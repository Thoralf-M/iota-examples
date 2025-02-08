// This example gets a an object id by its type tag
// ts-node graphql/typeTag.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from "@iota/iota-sdk/graphql";
import { graphql } from "@iota/iota-sdk/graphql/schemas/2024.11";

(async () => {
  const gqlClient = new IotaGraphQLClient({
    url: "https://graphql.devnet.iota.cafe",
  });

  const objectQuery = `{
    objects(filter: {type: "0x323b9fd87dcf0c5cbfdddeb43bf9834b4da5493246cfac2ae59e7b9b0fa62a99::iotans::IotaNS"}) {
      edges {
        node {
          address
        }
      }
    }
  }`;
  let object: GraphQLQueryResult = await queryGraphQl(gqlClient, objectQuery, {})
  console.log(JSON.stringify(object, null, 2))
})()

async function queryGraphQl(gqlClient: IotaGraphQLClient, query: string, variables: Record<string, any>): Promise<GraphQLQueryResult> {
  const options: GraphQLQueryOptions = { query: graphql(query), variables };
  return gqlClient.query(options)
};
