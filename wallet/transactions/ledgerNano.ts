import { toHEX } from '@iota/bcs';
import { IotaClient } from '@iota/iota-sdk/client';
import { messageWithIntent, toSerializedSignature } from '@iota/iota-sdk/cryptography';
import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';
import IotaLedgerClient from '@iota/ledgerjs-hw-app-iota';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

(async () => {
    let ledgerTransport = await TransportNodeHid.create();
    const ledgerClient = new IotaLedgerClient(ledgerTransport);
    // For compatibility with other wallets, use IOTA 4218 as coin type instead of testnet 1.
    let bip44Path = `m/44'/1'/0'/0'/0'`;
    let { address, publicKey } = await ledgerClient.getPublicKey(bip44Path);
    let iotaAddress = '0x' + toHEX(address);
    console.log('Sender address: ' + iotaAddress);

    const transfers = [
        {
            address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
            amount: 1_000_000_000,
        },
        {
            address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
            amount: 2_000_000_000,
        },
    ];

    const txb = new Transaction();
    // first, split the gas coin into multiple coins
    const coins = txb.splitCoins(
        txb.gas,
        transfers.map((transfer) => transfer.amount),
    );
    // next, create a transfer transaction for each coin
    transfers.forEach((transfer, index) => {
        txb.transferObjects([coins[index]], transfer.address);
    });
    txb.setSender(iotaAddress);
    const txBytes = await txb.build({ client });

    let txMessageIntent = messageWithIntent('TransactionData', txBytes);
    const { signature } = await ledgerClient.signTransaction(bip44Path, txMessageIntent);
    const serializedSignature = toSerializedSignature({
        signature,
        signatureScheme: 'ED25519',
        publicKey: new Ed25519PublicKey(publicKey),
    });

    const txResponse = await client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: serializedSignature,
        options: {
            showBalanceChanges: true,
            showEffects: true,
        },
    });
    console.log(txResponse);
    console.log('https://explorer.iota.org/txblock/' + txResponse.digest + '?network=devnet');
})();
