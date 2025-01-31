// https://docs.iota.org/developer/iota-101/transactions/ptb/building-programmable-transaction-blocks-ts-sdk#building-offline

import { IotaClient } from '@iota/iota-sdk/client';
import { decodeIotaPrivateKey } from '@iota/iota-sdk/cryptography';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe'
});

(async () => {
    const privateKey = "iotaprivkey1qrqvh7ps8ugvecus2sncjm78xpw6uqx77a4khzeg70yys7umtn6dwc42e24";
    const decoded = decodeIotaPrivateKey(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
    const senderAddress = keypair.getPublicKey().toIotaAddress()
    console.log(senderAddress)

    // Send 1 to the sender
    let transfers = [{ address: senderAddress, amount: 1 }]

    // Get inputs online
    const inputsObjectRefs = [];
    let inputs = (await client.getOwnedObjects({ owner: senderAddress })).data
    for (const input of inputs) {
        inputsObjectRefs.push({
            objectId: input.data!.objectId,
            version: Number(input.data!.version),
            digest: input.data!.digest,
        });
    }
    console.log("Inputs: ", inputsObjectRefs)

    // Offline
    let tx = new Transaction();
    // first, split the gas coin into multiple coins
    const coins = tx.splitCoins(
        tx.gas,
        transfers.map((transfer) => transfer.amount),
    );
    // next, create a transfer transaction for each coin
    transfers.forEach((transfer, index) => {
        tx.transferObjects([coins[index]], transfer.address);
    });

    tx.setGasPayment(inputsObjectRefs);
    tx.setGasBudget(100000000)
    tx.setGasPrice(1000)
    tx.setSender(senderAddress)
    let transaction_bytes = await tx.build();
    console.log(transaction_bytes)
    const signature = await keypair.signTransaction(transaction_bytes);
    console.log(signature)
})()
