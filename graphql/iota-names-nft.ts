// ts-node graphql/iota-names-nft.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from "@iota/iota-sdk/graphql";
import { graphql } from "@iota/iota-sdk/graphql/schemas/2024.11";
import { bcs } from "@iota/bcs";
import { IotaClient } from '@iota/iota-sdk/client';

(async () => {
  const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
  });
  const IOTA_NAMES_PACKAGE_ID = "0x20c890da38609db67e2713e6b33b4e4d3c6a8e9f620f9bb48f918d2337e31503"
  const IOTA_NAMES_REGISTRY_ID = "0xd48c0a882059036ca8c21dcc8d8bcaefc923aa678f225d3d515b79e3094e5616"

  let domain = "321.iota"
  let object_response = await client.getDynamicFieldObject({
    parentId: IOTA_NAMES_REGISTRY_ID,
    name: {
      type: `${IOTA_NAMES_PACKAGE_ID}::domain::Domain`,
      value: domain.split('.').reverse()
    }
  })
  // @ts-ignore
  console.log(JSON.stringify(object_response.data, null, 2));

  const gqlClient = new IotaGraphQLClient({
    url: "https://graphql.devnet.iota.cafe",
  });

  const objectQuery = `query ($registry: IotaAddress, $field_bcs: String) {
    owner(address: $registry) {
      dynamicObjectField(name: {type: "${IOTA_NAMES_PACKAGE_ID}::domain::Domain", bcs: $field_bcs}){
        name{
          json
        }
        value{
          __typename
        }
        __typename
      }
    }
  }`;

  // TODO: this seems to be somehow wrong
  const bcsBytes = bcs.vector(bcs.string()).serialize(domain.split('.').reverse()).toBase64();
  console.log(bcsBytes)

  let object: GraphQLQueryResult = await queryGraphQl(gqlClient, objectQuery, {
    "registry": IOTA_NAMES_REGISTRY_ID,
    "field_bcs": bcsBytes
  })
  console.log(JSON.stringify(object, null, 2))
})()

async function queryGraphQl(gqlClient: IotaGraphQLClient, query: string, variables: Record<string, any>): Promise<GraphQLQueryResult> {
  const options: GraphQLQueryOptions = { query: graphql(query), variables };
  return gqlClient.query(options)
};
