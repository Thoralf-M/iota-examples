// This example gets a dynamic field id from an object and then queries the content of the dynamic field and prints its content
// ts-node graphql/dynamic-field.ts

import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';

(async () => {
    const gqlClient = new IotaGraphQLClient({
        url: 'https://graphql.testnet.iota.cafe',
    });

    const objectId = '0x7c98da4057f4cc17e52acdd3ec49c4fee25692f4d61aad29a9348d1c46fa67db';
    const objectQuery = `query ($address: IotaAddress!) {
    object(address: $address) {
      asMoveObject {
        contents {
          json
        }
      }
    }
  }`;
    let object: any = await queryGraphQl(gqlClient, objectQuery, { address: objectId });
    // console.log(JSON.stringify(object, null, 2))
    // dynamic field address for a Table<address, bool>
    let tableAddress = object.data.object.asMoveObject.contents.json.admins.id;

    const queryString = `
    query ($address: IotaAddress) {
      owner(address: $address) {
        dynamicFields {
          nodes {
            name {
              ...Value
            }
            value {
              ... on MoveValue {
                ...Value
              }
              ... on MoveObject {
                contents {
                  ...Value
                }
              }
            }
          }
        }
      }
    }

    fragment Value on MoveValue {
      type {
        # contains then MoveType of the value, as string ("address", "bool", ...)
        repr
      }
      json # contains the value, with type according to MoveType ("address"=>string, "bool"=>boolean, ...)
    }
  `;

    let graphQLQueryResult = await queryGraphQl(gqlClient, queryString, { address: tableAddress });
    const data = graphQLQueryResult.data as MyGraphQLDataType;
    printDynamicFields(data);
})();

type MyGraphQLDataType = {
    owner: {
        dynamicFields: {
            nodes: MyGraphQLNodeType[];
        };
    };
};

type MyGraphQLNodeType = {
    name: MyGraphQLNodeNameType;
    value: MyGraphQLNodeValueType;
};

type MyGraphQLNodeNameType = MyGraphQLValueFragmentType;

type MyGraphQLNodeValueMoveValueType = MyGraphQLValueFragmentType;
type MyGraphQLNodeValueMoveObjectType = { contents: MyGraphQLValueFragmentType };

type MyGraphQLNodeValueType = MyGraphQLNodeValueMoveValueType | MyGraphQLNodeValueMoveObjectType;

function isMoveObjectType(
    nodeValue: MyGraphQLNodeValueType,
): nodeValue is MyGraphQLNodeValueMoveObjectType {
    const key: keyof MyGraphQLNodeValueMoveObjectType = 'contents';
    return key in (nodeValue as MyGraphQLNodeValueMoveObjectType);
}

type MyGraphQLValueFragmentType = {
    type: {
        repr: string;
    };
    json: unknown;
};

function printDynamicFields(data: MyGraphQLDataType) {
    data.owner.dynamicFields.nodes.forEach((node, index) => {
        const [key, keyType] = [node.name.json, node.name.type.repr];

        const [value, valueType] = isMoveObjectType(node.value)
            ? [node.value.contents.json, node.value.contents.type.repr]
            : [node.value.json, node.value.type.repr];

        console.log(
            `index= ${index}`,
            `key= ${key} (${keyType}/${typeof key})`,
            `value= ${value} (${valueType}/${typeof value})`,
        );
    });
}

async function queryGraphQl(
    gqlClient: IotaGraphQLClient,
    query: string,
    variables: Record<string, any>,
): Promise<GraphQLQueryResult> {
    const options: GraphQLQueryOptions = { query: graphql(query), variables };
    return gqlClient.query(options);
}
