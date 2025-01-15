import { IotaClient } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
    // url: 'https://api.hackanet.iota.cafe',
    // url: 'http://127.0.0.1:9000',
});

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const keypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const address = keypair.getPublicKey().toIotaAddress();
console.log("Sender address: " + address);

(async () => {
    const txb = new Transaction();
    txb.setSender(address);
    txb.setGasPrice(1000);
    txb.setGasBudget(10000000);
    const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(1)]);
    txb.transferObjects([coin], txb.pure.address(address));
    const txBytes = await txb.build({client});
    const digest = await txb.getDigest();
    console.log("Precomputed digest: "+digest)

    // const signature0 = (await keypair.signTransaction(txBytes)).signature;
    const txResponse = await client.signAndExecuteTransaction({ signer: keypair, transaction: txb });
    console.log(txResponse)
    console.log("https://explorer.rebased.iota.org/txblock/" + txResponse.digest)
})()
