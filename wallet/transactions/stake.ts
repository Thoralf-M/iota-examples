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

const stakeAmount = 1_000_000_000;

const txb = new Transaction();

txb.moveCall({
    target: `0x3::iota_system::request_add_stake`,
    arguments: [
        txb.object('0x0000000000000000000000000000000000000000000000000000000000000005'),
        txb.splitCoins(txb.gas, [txb.pure(stakeAmount)])[0],
        txb.pure('0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215'),
    ],
});

(async () => {
    const txResponse = await client.signAndExecuteTransaction({ signer: keypair, transaction: txb });
    console.log(txResponse)
    console.log("https://explorer.rebased.iota.org/txblock/" + txResponse.digest)
})()

// CLI command to stake:
// iota client call --package 0x3 --module iota_system --function request_add_stake --args 0x5 0x9168755030335f318d8810c0339e14c8f6eee0d416958e3a84e7ea0f9b8ab556 0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215 --gas-budget 10000000
