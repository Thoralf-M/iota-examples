// https://docs.iota.org/developer/iota-101/transactions/ptb/building-programmable-transaction-blocks-ts-sdk#building-offline

import { IotaClient } from '@iota/iota-sdk/client';
import { decodeIotaPrivateKey } from '@iota/iota-sdk/cryptography';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';
import { bcs } from '@iota/iota-sdk/bcs';
import { toBase64, fromBase64 } from '@iota/bcs';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    const privateKey = 'iotaprivkey1qrqvh7ps8ugvecus2sncjm78xpw6uqx77a4khzeg70yys7umtn6dwc42e24';
    const decoded = decodeIotaPrivateKey(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(decoded.secretKey);
    const senderAddress = keypair.getPublicKey().toIotaAddress();
    console.log(senderAddress);

    // Send 1 to the sender
    let transfers = [{ address: senderAddress, amount: 1 }];

    // Get inputs online
    const inputsObjectRefs = [];
    let inputs = (await client.getOwnedObjects({ owner: senderAddress })).data;
    for (const input of inputs) {
        inputsObjectRefs.push({
            objectId: input.data!.objectId,
            version: Number(input.data!.version),
            digest: input.data!.digest,
        });
    }
    console.log('Inputs: ', inputsObjectRefs);

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
    tx.setGasBudget(100000000);
    tx.setGasPrice(1000);
    tx.setSender(senderAddress);
    let transaction_bytes = await tx.build();
    console.log('Transaction bytes:', transaction_bytes);
    const signature = await keypair.signTransaction(transaction_bytes);
    console.log('Signature:', signature);

    // Parse the transaction data from the built bytes
    const transactionData = bcs.TransactionData.parse(transaction_bytes);

    // Create the SenderSignedData structure
    const senderSignedData = [
        {
            intentMessage: {
                intent: {
                    scope: { TransactionData: null },
                    version: { V0: null },
                    appId: { Iota: null },
                },
                value: transactionData,
            },
            txSignatures: [signature.signature], // signature.signature is already base64 encoded
        },
    ];

    // Serialize to BCS and encode as base64
    const senderSignedDataBytes = bcs.SenderSignedData.serialize(senderSignedData).toBytes();
    const senderSignedDataBase64 = toBase64(senderSignedDataBytes);

    console.log('\n=== SenderSignedData (base64) ===');
    console.log(senderSignedDataBase64);

    // Verify it can be decoded
    console.log('\n=== Verifying decode ===');
    const decodedData = bcs.SenderSignedData.parse(fromBase64(senderSignedDataBase64))[0];
    console.log('Decoded intentMessage.intent:', decodedData.intentMessage.intent);
    console.log('Decoded txSignatures count:', decodedData.txSignatures.length);
    console.log('Decoded sender:', decodedData.intentMessage.value.V1.sender);
})();


