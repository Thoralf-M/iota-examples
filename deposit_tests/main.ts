// This script creates transactions to test deposits.
// ts-node main.ts

import { writeFileSync } from 'fs';
import { IotaClient, IotaObjectRef } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';
import { fromB64 } from '@iota/iota-sdk/utils';

import { explorerTxBlockUrl, nodeUrl, testMnemonic } from './consts';
import { getKeysAndAddresses } from './keys';
import { setup, SmartContractData } from './setup';
import { transactionResults } from './transactionResults';

const { senderKeypair, senderAddress, sponsorKeypair, sponsorAddress, multiSigPublicKey } =
    getKeysAndAddresses(testMnemonic);

// Replace the address if another address is wanted
const targetAddress = senderAddress;

(async () => {
    try {
        let scData = (await setup())!;
        const client = new IotaClient({
            url: nodeUrl,
        });

        console.log('iotaCoin');
        transactionResults.iotaCoin = {
            digest: await iotaTransfer(client, senderKeypair, [targetAddress]),
            targetAddresses: [targetAddress],
        };
        // timeouts to not reuse the gas object at the same version
        await new Promise((r) => setTimeout(r, 2000));

        console.log('failed');
        transactionResults.failed = {
            // will fail with insufficient gas
            digest: await iotaTransfer(client, senderKeypair, [targetAddress], {
                gasBudget: 1_000_000,
            }),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('zeroIotaCoin');
        transactionResults.zeroIotaCoin = {
            digest: await iotaTransfer(client, senderKeypair, [targetAddress], { amount: 0 }),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('nonIotaCoin');
        transactionResults.nonIotaCoin = {
            digest: await transferNonIotaCoin(client, scData, senderKeypair, targetAddress),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('nonCoinObject');
        transactionResults.nonCoinObject = {
            digest: await transferNFT(client, scData, senderKeypair, targetAddress),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('gasSponsor');
        transactionResults.gasSponsor = {
            digest: await sponsorTx(client, senderKeypair, sponsorKeypair, targetAddress),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('multipleAddresses');
        let targetAddresses = [targetAddress, sponsorAddress];
        transactionResults.multipleAddresses = {
            digest: await iotaTransfer(client, senderKeypair, targetAddresses),
            targetAddresses: targetAddresses,
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('fromMultiSigAddress');
        transactionResults.fromMultiSigAddress = {
            digest: await transferFromMultiSigAddress(
                client,
                senderKeypair,
                sponsorKeypair,
                targetAddress,
            ),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('smartContractCall');
        transactionResults.smartContractCall = {
            digest: await transferFromSharedObject(client, scData, senderKeypair, targetAddress),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log('transferGasCoin');
        transactionResults.transferGasCoin = {
            digest: await transferGasCoin(client, senderKeypair, targetAddress),
            targetAddresses: [targetAddress],
        };
        await new Promise((r) => setTimeout(r, 2000));

        console.log(transactionResults);
        let targetFile = 'results.json';
        writeFileSync(targetFile, JSON.stringify(transactionResults, null, 2));
        console.log('Transaction results written to ' + targetFile);
    } catch (error) {
        console.error(error);
    }
})();

interface IotaTransferOptions {
    gasBudget?: number;
    amount?: number;
}

async function iotaTransfer(
    client: IotaClient,
    signer: Ed25519Keypair,
    targetAddresses: string[],
    options?: IotaTransferOptions,
): Promise<string> {
    let amount = 1_000_000;
    if (typeof options?.amount !== 'undefined') {
        amount = options.amount;
    }
    const transfers = targetAddresses.map((address) => ({ address, amount }));

    const tx = new Transaction();
    const coins = tx.splitCoins(
        tx.gas,
        transfers.map((transfer) => transfer.amount),
    );
    transfers.forEach((transfer, index) => {
        tx.transferObjects([coins[index]], transfer.address);
    });
    if (options?.gasBudget) {
        tx.setGasBudget(options?.gasBudget);
    }
    return finishTx(client, tx, signer);
}

async function transferGasCoin(
    client: IotaClient,
    signer: Ed25519Keypair,
    targetAddress: string,
): Promise<string> {
    const tx = new Transaction();
    tx.transferObjects([tx.gas], targetAddress);
    return finishTx(client, tx, signer);
}

async function sponsorTx(
    client: IotaClient,
    sender: Ed25519Keypair,
    sponsor: Ed25519Keypair,
    targetAddress: string,
): Promise<string> {
    let senderAddress = sender.getPublicKey().toIotaAddress();
    let sponsorAddress = sponsor.getPublicKey().toIotaAddress();

    const senderCoins = await client.getCoins({ owner: senderAddress, limit: 10 });
    let inputCoins: IotaObjectRef[] = [];
    for (const coin of senderCoins.data) {
        if (parseInt(coin.balance) >= 1_000_000_000) {
            inputCoins.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            });
            break;
        }
    }
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.objectRef(inputCoins[0]), [1_000_000_000]);

    tx.transferObjects([coin], targetAddress);

    const kindBytes = await tx.build({ client, onlyTransactionKind: true });

    const { signature, bytes } = await sponsorTransaction(
        client,
        senderAddress,
        sponsorAddress,
        kindBytes,
    );

    const senderSignature = (await senderKeypair.signTransaction(fromB64(bytes))).signature;

    const txResponse = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: [senderSignature, signature],
    });

    console.log(explorerTxBlockUrl + txResponse.digest);
    return txResponse.digest;
}

async function sponsorTransaction(
    client: IotaClient,
    sender: string,
    sponsorAddress: string,
    transactionKindBytes: Uint8Array,
) {
    const coins = await client.getCoins({ owner: sponsorAddress, limit: 10 });
    let gasCoins: IotaObjectRef[] = [];
    for (const coin of coins.data) {
        if (parseInt(coin.balance) > 500_000_000) {
            gasCoins.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            });
            break;
        }
    }

    const tx = Transaction.fromKind(transactionKindBytes);
    tx.setSender(sender);
    tx.setGasOwner(sponsorAddress);
    tx.setGasPayment(gasCoins);

    const transaction = await tx.build({ client });
    return sponsorKeypair.signTransaction(transaction);
}

async function transferFromMultiSigAddress(
    client: IotaClient,
    keypair0: Ed25519Keypair,
    keypair1: Ed25519Keypair,
    targetAddress: string,
): Promise<string> {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [1_000_000_000]);

    tx.transferObjects([coin], targetAddress);
    tx.setSenderIfNotSet(multiSigPublicKey.toIotaAddress());
    const transactionBytes = await tx.build({ client });

    const signature0 = (await keypair0.signTransaction(transactionBytes)).signature;
    const signature1 = (await keypair1.signTransaction(transactionBytes)).signature;
    const signature = multiSigPublicKey.combinePartialSignatures([signature0, signature1]);

    const txResponse = await client.executeTransactionBlock({
        transactionBlock: transactionBytes,
        signature: signature,
    });
    console.log(explorerTxBlockUrl + txResponse.digest);
    return txResponse.digest;
}

async function transferNonIotaCoin(
    client: IotaClient,
    smartContractData: SmartContractData,
    signer: Ed25519Keypair,
    targetAddress: string,
): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
        target: `${smartContractData.packageId}::deposit_test_coin::mint`,
        arguments: [
            tx.object(smartContractData.coinTreasuryCap),
            tx.pure.u64(1_000_000_000),
            tx.pure.address(targetAddress),
        ],
    });
    return finishTx(client, tx, signer);
}

async function transferNFT(
    client: IotaClient,
    smartContractData: SmartContractData,
    signer: Ed25519Keypair,
    targetAddress: string,
): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
        target: `${smartContractData.packageId}::deposit_test_nft::mint`,
        arguments: [tx.pure.address(targetAddress)],
    });
    return finishTx(client, tx, signer);
}

async function transferFromSharedObject(
    client: IotaClient,
    smartContractData: SmartContractData,
    signer: Ed25519Keypair,
    address: string,
): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
        target: `${smartContractData.packageId}::deposit_from_shared_object::transfer_coin`,
        arguments: [tx.object(smartContractData.sharedCoinsObjectId), tx.pure.address(address)],
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
