// ts-node graphql/iota-names-registry.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';

(async () => {
  const gqlClient = new IotaGraphQLClient({
    url: 'https://graphql.devnet.iota.cafe',
  });

  const IOTA_NAMES_REGISTRY_ID =
    '0xef24c78e8c085e29760d37b287fc16647f0f578e8d22f18dd65f655285afad3e';

  let res = { total: 0, names: [], registrations: [], leafs: [] };

  let cursorSection = "";
  while (true) {
    let query = `query ($address: IotaAddress) {
                owner(address: $address) {
                    dynamicFields${cursorSection} {
                        pageInfo{
                            hasNextPage
                            endCursor
                        }
                        nodes {
                            name {
                                json
                            }
                            value {
                                ... on MoveValue {
                                    json
                                }
                            }
                        }
                    }
                }
            }`;

    let object: GraphQLQueryResult = await queryGraphQl(
      gqlClient,
      query,
      {
        address: IOTA_NAMES_REGISTRY_ID,
      },
    );

    if (object.errors) {
      break;
    }
    // @ts-ignore
    res.total += object.data.owner.dynamicFields.nodes.length;
    res.names.push(
      // @ts-ignore
      ...object.data.owner.dynamicFields.nodes.map((v) =>
        v.name.json.labels.reverse().join("."),
      ),
    );

    // @ts-ignore
    for (let node of object.data.owner.dynamicFields.nodes) {
      // @ts-ignore
      if (node.value.json.expiration_timestamp_ms == '0') {
        // @ts-ignore
        res.leafs.push(node);
        // Print the leaf in a bit nicer way
        node.name = node.name.json.labels.reverse().join(".");
        node.value = node.value.json;
        console.log(node)
      }

    }

    // @ts-ignore
    res.registrations.push(...object.data.owner.dynamicFields.nodes);

    // @ts-ignore
    if (object.data.owner.dynamicFields.pageInfo.hasNextPage) {
      // @ts-ignore
      cursorSection = `(after: "${object.data.owner.dynamicFields.pageInfo.endCursor}")`;
    } else {
      break;
    }
  }
  console.log("Leafs: ", res.leafs.length);
  console.log("Names: ", res.names.length);
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
