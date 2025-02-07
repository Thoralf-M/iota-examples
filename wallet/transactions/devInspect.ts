import { IotaClient } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const keypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const address = keypair.getPublicKey().toIotaAddress();
console.log("Sender address: " + address)

const transfers = [
    { address: '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e', amount: 1_000_000 },
    { address: '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e', amount: 1_000_000 }];

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

(async () => {
    const devInspectResult = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: txb,
    })
    console.log(devInspectResult)
})()
