// This example gets only programmable transactions that called a specific function.
// ts-node graphql/programmableTxsByFunction.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';

(async () => {
  const gqlClient = new IotaGraphQLClient({
    url: 'https://graphql.testnet.iota.cafe',
  });
  const objectQuery = `{
    transactionBlocks(filter: {afterCheckpoint: 0, function: "0x3::iota_system::request_add_stake"}) {
      nodes {
        digest
      }
      pageInfo {
        startCursor
        endCursor
      }
    }
  }`;
  let object: GraphQLQueryResult = await queryGraphQl(gqlClient, objectQuery, {});
  console.log(JSON.stringify(object, null, 2));
})();

async function queryGraphQl(
  gqlClient: IotaGraphQLClient,
  query: string,
  variables: Record<string, any>,
): Promise<GraphQLQueryResult> {
  const options: GraphQLQueryOptions = { query: graphql(query), variables };
  return gqlClient.query(options);
}
