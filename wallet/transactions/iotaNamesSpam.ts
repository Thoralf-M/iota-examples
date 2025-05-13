// spam register names
// ts-node wallet/transactions/iotaNames.ts

import { IotaClient } from '@iota/iota-sdk/client';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { GraphQLQueryOptions, GraphQLQueryResult, IotaGraphQLClient } from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IOTA_CLOCK_OBJECT_ID } from '@iota/iota-sdk/utils';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});
let graphqlUrl = 'https://graphql.devnet.iota.cafe';
let faucetUrl = 'https://faucet.devnet.iota.cafe';

let IOTA_NAMES_PACKAGE_ID = '0x20c890da38609db67e2713e6b33b4e4d3c6a8e9f620f9bb48f918d2337e31503';
let UTILS_PACKAGE_ID = '0xdea9e554fbee54e8dd0ac1d036d46047b5621b8f8739aa155258d656303af8cf';
let REGISTRATION_PACKAGE_ID = '0x160581f35fb2a58a4964d513a96c70e0b64053a254936ae12b5f4d17087436f5';
let SUBDOMAIN_PACKAGE_ID = '0xa243b35cb23413601c23c4b6cc9b03020ebe8660071bd2239b3254fd09305619';
let IOTA_NAMES_OBJECT_ID = '0x55716ea4b9b7563537a1ef2705f1b06060b35f15f2ea00a20de29c547c319bef';
let SUBDOMAIN_PROXY_PACKAGE_ID =
    '0xcab03d8693d76b4afd8e21a4dd0daebcef14a0c07de67e2b3be22dc98c771913';

const YEARS = 1;
const FIVE_PLUS_CHAR_PRICE = 500000000;

const testMnemonic =
    'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good';
const keypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const address = keypair.getPublicKey().toIotaAddress();
console.log('Sender address: ' + address);

// 5+chars
let domainName = '55555.iota';

function makeid(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

(async () => {
    await requestFundsIfNeeded(client, address);
    // Domain nft for 55555.iota
    let domainNft = '0x1961de3ba35df3325f2b88490e93f6ac2ef96fb42fa32450b94b33600224ffcb';
    if (domainNft.length == 0) {
        try {
            domainNft = await getNft(domainName);
        } catch (error) {
            console.log('error', error);
            await registerName();
            await new Promise((r) => setTimeout(r, 3000));
            domainNft = await getNft(domainName);
        }
    }

    for (let i = 0; i < 10000; i++) {
        try {
            await requestFundsIfNeeded(client, address);
            const tx = new Transaction();

            let subdomains = [];
            // more will result in error: could not automatically determine a budget: MovePrimitiveRuntimeError(MoveLocationOpt(
            for (let i = 0; i < 330; i++) {
                subdomains.push(makeid(52) + '.' + domainName);
            }

            let expirationNextMonthTimestampMs = Date.now() + 1000 * 60 * 60 * 24 * 30;
            let allowChildCreation = true;
            let allowTimeExtension = true;
            let subdomainNfts = [];
            let leaf = true;
            if (leaf) {
                for (let subdomain of subdomains) {
                    tx.moveCall({
                        target: `${SUBDOMAIN_PACKAGE_ID}::subdomains::new_leaf`,
                        arguments: [
                            tx.object(IOTA_NAMES_OBJECT_ID),
                            tx.object(domainNft),
                            tx.object(IOTA_CLOCK_OBJECT_ID),
                            tx.pure.string(subdomain),
                            tx.pure.address(address),
                        ],
                    });
                }
            } else {
                for (let subdomain of subdomains) {
                    let subNft = tx.moveCall({
                        target: `${SUBDOMAIN_PACKAGE_ID}::subdomains::new`,
                        arguments: [
                            tx.object(IOTA_NAMES_OBJECT_ID),
                            tx.object(domainNft),
                            tx.object(IOTA_CLOCK_OBJECT_ID),
                            tx.pure.string(subdomain),
                            tx.pure.u64(expirationNextMonthTimestampMs),
                            tx.pure.bool(allowChildCreation),
                            tx.pure.bool(allowTimeExtension),
                        ],
                    });
                    subdomainNfts.push(subNft);
                }
                tx.transferObjects(subdomainNfts, tx.pure.address(address));
            }

            const txResponse = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
            });
            console.log(
                'Tx ' +
                    i +
                    ' https://explorer.rebased.iota.org/txblock/' +
                    txResponse.digest +
                    '?network=devnet',
            );
            await new Promise((r) => setTimeout(r, 1000));
        } catch (e) {
            console.log(e);
            await new Promise((r) => setTimeout(r, 600000));
        }
    }
})();

async function requestFundsIfNeeded(client: IotaClient, address: string) {
    const coinBalance = await client.getBalance({
        owner: address,
    });
    if (parseInt(coinBalance.totalBalance) < 5_500_000_000) {
        const faucetResponse = await requestIotaFromFaucetV0({
            host: faucetUrl,
            recipient: address,
        });
        console.log(faucetResponse);
        // Wait some time for the indexer to process the tx
        await new Promise((r) => setTimeout(r, 3000));
    }
}

async function queryDynamicFields(): Promise<GraphQLQueryResult> {
    const gqlClient = new IotaGraphQLClient({
        url: graphqlUrl,
    });

    const objectQuery = `query ($address: IotaAddress!) {
            owner(address: $address) {
                dynamicFields {
                nodes {
                    name { type {
                            repr
                    } }
                    value {
                    ... on MoveValue {
                        json
                    }
                    }
                }
                }
            }
        }`;
    let dynamicFields: any = await queryGraphQl(gqlClient, objectQuery, {
        address: IOTA_NAMES_OBJECT_ID,
    });
    return dynamicFields;
}

async function getRegisteredNamesInner(): Promise<object> {
    const gqlClient = new IotaGraphQLClient({
        url: graphqlUrl,
    });

    let dynamicFields = await queryDynamicFields();
    let registration =
        // @ts-ignore
        dynamicFields.data.owner.dynamicFields.nodes.find(
            (v: any) =>
                v.name.type.repr ==
                `${IOTA_NAMES_PACKAGE_ID}::iota_names::RegistryKey<${IOTA_NAMES_PACKAGE_ID}::registry::Registry>`,
        );
    let registryId = registration.value.json.registry.id;

    let res = { total: 0, names: [], registrations: [] };

    let cursorSection = '';
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

        let object: GraphQLQueryResult = await queryGraphQl(gqlClient, query, {
            address: registryId,
        });

        if (object.errors) {
            break;
        }
        // @ts-ignore
        res.total += object.data.owner.dynamicFields.nodes.length;
        res.names.push(
            // @ts-ignore
            ...object.data.owner.dynamicFields.nodes.map((v) =>
                v.name.json.labels.reverse().join('.'),
            ),
        );
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

    return res;
}
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
async function getNft(domainName: string): Promise<string> {
    let registered = await getRegisteredNamesInner();
    // @ts-ignore
    let registrationIndex = registered.registrations.findIndex(
        (e: any) => e.name.json.labels.join('.') == domainName,
    );
    if (registrationIndex == -1) {
        throw new Error('domain name not found');
    }
    // @ts-ignore
    return registered.registrations[registrationIndex].value.json.nft_id;
}

async function registerName() {
    try {
        let tx = new Transaction();
        let nft = tx.moveCall({
            target: `${REGISTRATION_PACKAGE_ID}::register::register`,
            arguments: [
                tx.object(IOTA_NAMES_OBJECT_ID),
                tx.pure.string(domainName),
                tx.pure.u8(YEARS),
                tx.splitCoins(tx.gas, [tx.pure.u64(FIVE_PLUS_CHAR_PRICE)]),
                tx.object(IOTA_CLOCK_OBJECT_ID),
            ],
        });
        tx.transferObjects([nft], tx.pure.address(address));

        const txResponse = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });
        console.log(txResponse);
        console.log('https://explorer.rebased.iota.org/txblock/' + txResponse.digest);
    } catch (err: any) {
        console.error(err);
    }
}
