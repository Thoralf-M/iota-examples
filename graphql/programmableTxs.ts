// This example gets only programmable transactions.
// ts-node graphql/programmableTxs.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from "@iota/iota-sdk/graphql";
import { graphql } from "@iota/iota-sdk/graphql/schemas/2024.11";

(async () => {
  const gqlClient = new IotaGraphQLClient({
    url: "https://graphql.testnet.iota.cafe",
  });

  const objectQuery = `{
    transactionBlocks(filter: {afterCheckpoint: 0, kind: PROGRAMMABLE_TX}) {
      nodes {
        digest
      }
      pageInfo {
        startCursor
        endCursor
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
