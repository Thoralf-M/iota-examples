import { IotaClient, IotaObjectRef } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { fromB64 } from '../../../iota/sdk/bcs/dist/cjs';

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'

const senderKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/1'`);
const senderAddress = senderKeypair.getPublicKey().toIotaAddress();
console.log("senderAddress: " + senderAddress);


(async () => {
    /// Request funds from faucet if needed
    const client = new IotaClient({
        url: 'http://127.0.0.1:9000',
        // url: 'https://api.hackanet.iota.cafe',
    });
    await requestFundsIfNeeded(client, senderAddress)

    const txb = new Transaction();

    const senderCoins = await client.getCoins({ owner: senderAddress, limit: 10 });
    let inputCoins: IotaObjectRef[] = [];
    for (const coin of senderCoins.data) {
        if (parseInt(coin.balance) > 500_000_000) {
            inputCoins.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            })
            break;
        }
    }

    const transfers = [
        { address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215', amount: 1_000_000 },
        { address: '0xa1a97d20bbad79e2ac89f215a3b3c4f2ff9a1aa3cc26e529bde6e7bc5500d610', amount: 1_000_000 },
    ];
    const coins = txb.splitCoins(
        txb.objectRef(inputCoins[0]),
        transfers.map((transfer) => transfer.amount),
    );

    transfers.forEach((transfer, index) => {
        txb.transferObjects([coins[index]], transfer.address);
    });

    const kindBytes = await txb.build({ client, onlyTransactionKind: true });

    const { signature, bytes } = await sponsorTransaction(client, senderAddress, kindBytes)

    const senderSignature = (await senderKeypair.signTransaction(fromB64(bytes))).signature

    const txResponse = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: [senderSignature, signature],
        options: { showEffects: true },
    });
    console.log(txResponse)
    console.log("https://explorer.iota.cafe/txblock/" + txResponse.digest)
})()


async function sponsorTransaction(client: IotaClient, sender: string, transactionKindBytes: Uint8Array) {
    const sponsorKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
    const sponsorAddress = sponsorKeypair.getPublicKey().toIotaAddress();
    console.log(`Sponsor address: ${sponsorAddress}`);

    requestFundsIfNeeded(client, sponsorAddress)

    const coins = await client.getCoins({ owner: sponsorAddress, limit: 10 });
    let gasCoins: IotaObjectRef[] = [];
    for (const coin of coins.data) {
        if (parseInt(coin.balance) > 500_000_000) {
            gasCoins.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            })
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

async function requestFundsIfNeeded(client: IotaClient, address: string) {
    const coinBalance = await client.getBalance({
        owner: address,
    });
    if (parseInt(coinBalance.totalBalance) < 2_500_000) {
        const faucetResponse = await requestIotaFromFaucetV0({
            host: 'http://127.0.0.1:9123/gas',
            // host: 'https://faucet.hackanet.iota.cafe/gas',
            recipient: address,
        });
        console.log(faucetResponse)
        // Wait some time for the indexer to process the tx
        await new Promise(r => setTimeout(r, 3000));
    }
}
