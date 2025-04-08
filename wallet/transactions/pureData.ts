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

const txb = new Transaction();
const data = 'Some data to have in the transaction as pure input'
txb.pure("string", data);

(async () => {
    const txResponse = await client.signAndExecuteTransaction({ signer: keypair, transaction: txb });
    console.log(txResponse)
    console.log("https://explorer.rebased.iota.org/txblock/" + txResponse.digest)
})()
