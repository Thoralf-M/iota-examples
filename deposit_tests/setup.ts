// This script requests funds from the faucet and publishes the smart contract.
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IotaClient, IotaTransactionBlockResponse } from '@iota/iota-sdk/client';
import { requestIotaFromFaucetV1 } from '@iota/iota-sdk/faucet';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

import { explorerTxBlockUrl, faucetUrl, nodeUrl, testMnemonic } from './consts';
import { getKeysAndAddresses } from './keys';

const client = new IotaClient({
    url: nodeUrl,
});

console.log('testMnemonic', testMnemonic);
const { senderKeypair, senderAddress, sponsorKeypair, sponsorAddress, multiSigPublicKey } =
    getKeysAndAddresses(testMnemonic);

export async function setup(): Promise<SmartContractData | undefined> {
    try {
        console.log('senderAddress: ' + senderAddress);
        console.log('sponsorAddress: ' + sponsorAddress);
        let multisigAddress = multiSigPublicKey.toIotaAddress();
        console.log('multisigAddress: ' + multisigAddress);

        await requestFundsIfNeeded(client, senderAddress);
        await requestFundsIfNeeded(client, sponsorAddress);
        await requestFundsIfNeeded(client, multisigAddress);

        let smartContractData = {
            packageId: '',
            sharedCoinsObjectId: '',
            coinTreasuryCap: '',
        };

        let fileName = 'published.json';
        if (!existsSync(fileName)) {
            // Publish the smart contract from the sponsor address
            const packagePath = './deposit_tests';
            const { modules, dependencies } = JSON.parse(
                execSync(`iota move build --dump-bytecode-as-base64 --path ${packagePath}`, {
                    encoding: 'utf-8',
                }),
            );
            const tx = new Transaction();
            const [upgradeCap] = tx.publish({
                modules,
                dependencies,
            });
            tx.transferObjects([upgradeCap], senderAddress);

            const transactionBlockResponse = await client.signAndExecuteTransaction({
                transaction: tx,
                signer: senderKeypair,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                },
            });

            console.log(explorerTxBlockUrl + transactionBlockResponse.digest);
            await client.waitForTransaction({
                digest: transactionBlockResponse.digest,
            });

            smartContractData.packageId = parsePackageId(transactionBlockResponse);
            smartContractData.sharedCoinsObjectId = parseCreatedObject(
                transactionBlockResponse,
                `${smartContractData.packageId}::deposit_from_shared_object::SharedCoins`,
            );
            smartContractData.coinTreasuryCap = parseCreatedObject(
                transactionBlockResponse,
                `0x2::coin::TreasuryCap<${smartContractData.packageId}::deposit_test_coin::DEPOSIT_TEST_COIN>`,
            );

            writeFileSync(fileName, JSON.stringify(smartContractData, null, 2));
        } else {
            const data = readFileSync(fileName, 'utf8');
            smartContractData = JSON.parse(data);
        }
        console.log(`packageId: ${smartContractData.packageId}`);
        console.log(`sharedCoinsObjectId: ${smartContractData.sharedCoinsObjectId}`);
        console.log(`coinTreasuryCap: ${smartContractData.coinTreasuryCap}`);

        let [digest, createdCoin] = await depositCoinsToSharedCoins0(
            client,
            smartContractData,
            sponsorKeypair,
        );
        console.log('createdCoin: ' + createdCoin);
        await new Promise((r) => setTimeout(r, 2000));
        await depositCoinsToSharedCoins1(client, smartContractData, sponsorKeypair, createdCoin);

        return smartContractData;
    } catch (error) {
        console.error(error);
    }
}

async function depositCoinsToSharedCoins0(
    client: IotaClient,
    smartContractData: SmartContractData,
    signer: Ed25519Keypair,
): Promise<[string, string]> {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(
        tx.gas,
        // [1],
        [1_000_000_000],
    );
    tx.transferObjects([coin], smartContractData.sharedCoinsObjectId);
    const txResponse = await client.signAndExecuteTransaction({
        signer,
        transaction: tx,
        options: { showObjectChanges: true },
    });
    console.log(explorerTxBlockUrl + txResponse.digest);
    console.log(txResponse);
    // @ts-ignore
    let createdCoin = txResponse.objectChanges!.find((x) => x.type === 'created')?.objectId!;
    return [txResponse.digest, createdCoin];
}

async function depositCoinsToSharedCoins1(
    client: IotaClient,
    smartContractData: SmartContractData,
    signer: Ed25519Keypair,
    coinObjectIdOnSharedCoinsAddress: string,
): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
        target: `${smartContractData.packageId}::deposit_from_shared_object::deposit_coin`,
        arguments: [
            tx.object(smartContractData.sharedCoinsObjectId),
            tx.object(coinObjectIdOnSharedCoinsAddress),
        ],
    });
    return finishTx(client, tx, signer);
}

async function finishTx(
    client: IotaClient,
    tx: Transaction,
    signer: Ed25519Keypair,
): Promise<string> {
    const txResponse = await client.signAndExecuteTransaction({ signer, transaction: tx });
    console.log(explorerTxBlockUrl + txResponse.digest);
    return txResponse.digest;
}

const parsePackageId = (data: IotaTransactionBlockResponse) => {
    const packageId = data.objectChanges!.find((x) => x.type === 'published');
    if (!packageId || packageId.type !== 'published') throw new Error('Expected Published object');
    return packageId.packageId;
};

const parseCreatedObject = (data: IotaTransactionBlockResponse, objectType: string) => {
    const obj = data.objectChanges!.find(
        (x) => x.type === 'created' && x.objectType === objectType,
    );
    if (!obj || obj.type !== 'created') throw new Error(`Expected ${objectType} object`);
    return obj.objectId;
};

async function requestFundsIfNeeded(client: IotaClient, address: string) {
    const coinBalance = await client.getBalance({
        owner: address,
    });
    if (parseInt(coinBalance.totalBalance) < 4_000_000_000) {
        const faucetResponse = await requestIotaFromFaucetV1({
            host: faucetUrl,
            recipient: address,
        });
        console.log(faucetResponse);
        // Wait some time for the indexer to process the tx
        await new Promise((r) => setTimeout(r, 3000));
    }
}

export interface SmartContractData {
    packageId: string;
    sharedCoinsObjectId: string;
    coinTreasuryCap: string;
}
