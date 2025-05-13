import { IotaClient, IotaObjectRef } from '@iota/iota-sdk/client';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

import { fromB64 } from '../../../iota/sdk/bcs/dist/cjs';

const testMnemonic =
    'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good';

const senderKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/1'`);
const senderAddress = senderKeypair.getPublicKey().toIotaAddress();
console.log('senderAddress: ' + senderAddress);

(async () => {
    /// Request funds from faucet if needed
    const client = new IotaClient({
        url: 'https://api.testnet.iota.cafe',
    });
    await requestFundsIfNeeded(client, senderAddress);

    const txb = new Transaction();

    // From sender coin object
    const senderCoins = await client.getCoins({ owner: senderAddress, limit: 10 });
    let inputCoins: IotaObjectRef[] = [];
    for (const coin of senderCoins.data) {
        if (parseInt(coin.balance) > 500_000_000) {
            inputCoins.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            });
            break;
        }
    }

    // From gas object
    const transfers = [
        {
            address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
            amount: 2_000_000,
        },
    ];
    const coins = txb.splitCoins(txb.objectRef(inputCoins[0]), [
        transfers[0].amount,
        transfers[0].amount / 2,
    ]);
    transfers.forEach((transfer, index) => {
        txb.transferObjects([coins[index]], transfer.address);
    });

    // From gas object
    const transfersFromGas = [
        {
            address: '0xa1a97d20bbad79e2ac89f215a3b3c4f2ff9a1aa3cc26e529bde6e7bc5500d610',
            amount: 2_000_000,
        },
    ];
    const coinsFromGas = txb.splitCoins(txb.gas, [
        transfersFromGas[0].amount,
        transfers[0].amount / 2,
    ]);
    transfersFromGas.forEach((transfer, index) => {
        txb.transferObjects([coinsFromGas[index]], transfer.address);
    });

    // From sender and gas object
    const transfersFromGasAndSender = {
        address: '0xb875c1dd25c456f9221fbd62fc83f83b06e22f79733fce62c2b9cbcf234d2400',
        amount: 2_000_000,
    };

    txb.mergeCoins(coinsFromGas[1], [coins[1]]);
    txb.transferObjects([coinsFromGas[1]], transfersFromGasAndSender.address);

    const kindBytes = await txb.build({ client, onlyTransactionKind: true });

    const { signature, bytes } = await sponsorTransaction(client, senderAddress, kindBytes);

    const senderSignature = (await senderKeypair.signTransaction(fromB64(bytes))).signature;

    const txResponse = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: [senderSignature, signature],
        options: { showEffects: true },
    });
    console.log(txResponse);
    console.log('https://explorer.rebased.iota.org/txblock/' + txResponse.digest);
})();

async function sponsorTransaction(
    client: IotaClient,
    sender: string,
    transactionKindBytes: Uint8Array,
) {
    const sponsorKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
    const sponsorAddress = sponsorKeypair.getPublicKey().toIotaAddress();
    console.log(`Sponsor address: ${sponsorAddress}`);

    requestFundsIfNeeded(client, sponsorAddress);

    const coins = await client.getCoins({ owner: sponsorAddress, limit: 10 });
    let gasCoins: IotaObjectRef[] = [];
    for (const coin of coins.data) {
        if (parseInt(coin.balance) > 500_000_000) {
            gasCoins.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            });
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
    if (parseInt(coinBalance.totalBalance) < 2_500_000_000) {
        const faucetResponse = await requestIotaFromFaucetV0({
            host: 'https://faucet.iota-rebased-alphanet.iota.cafe/gas',
            recipient: address,
        });
        console.log(faucetResponse);
        // Wait some time for the indexer to process the tx
        await new Promise((r) => setTimeout(r, 3000));
    }
}
