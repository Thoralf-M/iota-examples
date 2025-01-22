// https://docs.iota.org/developer/iota-101/transactions/ptb/building-programmable-transaction-blocks-ts-sdk#building-offline

import { IotaClient } from '@iota/iota-sdk/client';
import { decodeIotaPrivateKey } from '@iota/iota-sdk/cryptography';
import { Secp256k1Keypair } from '@iota/iota-sdk/keypairs/secp256k1';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe'
});

(async () => {
    const privateKey = "iotaprivkey1q8cy2ll8a0dmzzzwn9zavrug0qf47cyuj6k2r4r6rnjtpjhrdh52vpegd4f";
    const decoded = decodeIotaPrivateKey(privateKey);
    const keypair = Secp256k1Keypair.fromSecretKey(decoded.secretKey);
    const senderAddress = keypair.getPublicKey().toIotaAddress()
    console.log(senderAddress)

    // Send 1 to the sender
    let outputs = [{ address: senderAddress, amount: 1 }]

    let tx = new Transaction();
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
    for (const output of outputs) {
        // Unefficient to split in a loop, one could just split multiple amounts at once
        const coin = tx.splitCoins(tx.gas, [output.amount]);
        tx.transferObjects([coin], output.address);
    }

    tx.setGasBudget(100000000)
    tx.setGasPrice(1000)
    tx.setGasPayment(inputsObjectRefs);
    tx.setSender(senderAddress)
    let transaction_bytes = await tx.build();
    console.log(transaction_bytes)
    const signature = await keypair.signTransaction(transaction_bytes);
    console.log(signature)
})()
