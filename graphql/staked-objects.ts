// ts-node graphql/staked-objects.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';

const STAKED_IOTA_TYPE = "0x3::staking_pool::StakedIota";
// const TIMELOCKED_STAKED_IOTA_TYPE = "0x3::timelocked_staking::TimelockedStakedIota";

(async () => {
    const gqlClient = new IotaGraphQLClient({
        url: 'https://graphql.devnet.iota.cafe',
    });

    let res = { stakeObjects: 0, addresses: new Set<string>() };

    let cursorSection;
    while (true) {
        let query = `query getStakedIota($type: String, $cursor: String) {
            objects(filter: {type: $type}, after: $cursor) {
                nodes {
                    address
                    owner {
                        ... on AddressOwner {
                            owner {
                                address
                            }
                        }
                    }
                    asMoveObject{
                        contents{
                            json
                        }
                    }
                }
                pageInfo {
                hasNextPage
                endCursor
                }
            }
        }`;

        let result: GraphQLQueryResult = await queryGraphQl(
            gqlClient,
            query,
            {
                type: STAKED_IOTA_TYPE,
                cursor: cursorSection
            },
        );

        if (result.errors) {
            throw new Error("GraphQL query failed: " + JSON.stringify(result.errors));
            break;
        }

        // @ts-ignore
        for (let node of result.data.objects.nodes) {
            res.stakeObjects++;
            console.log(JSON.stringify(node, null, 2));
            if (node.owner && node.owner.owner) {
                res.addresses.add(node.owner.owner.address)
            } else {
                console.warn("No owner found for node: ", node);
            }
        }

        console.log(res.addresses.size, " addresses, ", res.stakeObjects, " stake objects");
        // @ts-ignore
        if (result.data.objects.pageInfo.hasNextPage) {
            // @ts-ignore
            cursorSection = result.data.objects.pageInfo.endCursor;
            console.log("next cursor:" + cursorSection);
        } else {
            break;
        }
    }
    console.log(res);
})();

async function queryGraphQl(
    gqlClient: IotaGraphQLClient,
    query: string,
    variables: Record<string, any>,
): Promise<GraphQLQueryResult> {
    const options: GraphQLQueryOptions = {
        query: graphql(query),
        variables,
    };
    return gqlClient.query(options);
}
