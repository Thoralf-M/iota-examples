import { IotaClient } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { MultiSigPublicKey } from '@iota/iota-sdk/multisig';
import { Transaction } from '@iota/iota-sdk/transactions';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';

/// Multisig address generation
const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const keypair0 = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const pubKey0 = keypair0.getPublicKey();
const keypair1 = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/1'`);
const pubKey1 = keypair1.getPublicKey();
const keypair2 = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/2'`);
const pubKey2 = keypair2.getPublicKey();

const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
    threshold: 2,
    publicKeys: [
        {
            publicKey: pubKey0,
            weight: 1,
        },
        {
            publicKey: pubKey1,
            weight: 1,
        },
        {
            publicKey: pubKey2,
            weight: 1,
        },
    ],
});

const multisigAddress = multiSigPublicKey.toIotaAddress();
console.log("multisigAddress: " + multisigAddress);


(async () => {
    const client = new IotaClient({
        url: 'https://api.iota-rebased-alphanet.iota.cafe',
    });

    await requestFundsIfNeeded(client, multisigAddress)

    /// Transaction creation
    const transfers = [
        { address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215', amount: 1_000_000 },
        { address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215', amount: 1_000_000 }];

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

    txb.setSenderIfNotSet(multisigAddress);
    const transactionBytes = await txb.build({ client });

    const signature0 = (await keypair0.signTransaction(transactionBytes)).signature;
    const signature1 = (await keypair1.signTransaction(transactionBytes)).signature;
    const signature2 = (await keypair2.signTransaction(transactionBytes)).signature;
    const signature = multiSigPublicKey.combinePartialSignatures([signature0, signature1, signature2]);

    const txResponse = await client.executeTransactionBlock({
        transactionBlock: transactionBytes,
        signature: signature,
        options: { showEffects: true },
    });
    console.log(txResponse)
    console.log("https://explorer.rebased.iota.org/txblock/" + txResponse.digest)
})()

async function requestFundsIfNeeded(client: IotaClient, address: string) {
    const coinBalance = await client.getBalance({
        owner: address,
    });
    if (parseInt(coinBalance.totalBalance) < 2_500_000_000) {
        const faucetResponse = await requestIotaFromFaucetV0({
            host: 'https://faucet.iota-rebased-alphanet.iota.cafe/gas',
            recipient: address,
        });
        console.log(faucetResponse)
        // Wait some time for the indexer to process the tx
        await new Promise(r => setTimeout(r, 3000));
    }
}
