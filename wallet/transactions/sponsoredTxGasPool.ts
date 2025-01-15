import { IotaClient, IotaObjectRef, TransactionEffects } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { ObjectRef, Transaction } from '@iota/iota-sdk/transactions';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { toB64 } from '@iota/bcs';
import axios from 'axios';

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const gasPoolUrl = 'http://0.0.0.0:9527';
const faucetUrl = 'http://127.0.0.1:9123/gas';
const nodeUrl = 'http://127.0.0.1:9000';
const GAS_POOL_BEARER_TOKEN = 'GAS_STATION_AUTH';

(async () => {
    const client = new IotaClient({
        url: nodeUrl,
    });

    const senderKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
    const senderAddress = senderKeypair.getPublicKey().toIotaAddress();
    console.log("senderAddress: " + senderAddress);

    await requestFundsIfNeeded(client, senderAddress)

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
    const txb = new Transaction();
    const coins = txb.splitCoins(
        txb.objectRef(inputCoins[0]),
        transfers.map((transfer) => transfer.amount),
    );
    transfers.forEach((transfer, index) => {
        txb.transferObjects([coins[index]], transfer.address);
    });
    const transactionKindBytes = await txb.build({ client, onlyTransactionKind: true });

    const gasBudget = 50_000_000
    const reservedSponsorGasData = await getSponsorGas(gasBudget)
    console.log(reservedSponsorGasData)

    // Build tx with gas pool input
    const tx = Transaction.fromKind(transactionKindBytes);
    tx.setSender(senderAddress);
    tx.setGasOwner(reservedSponsorGasData.sponsor_address);
    tx.setGasPayment(reservedSponsorGasData.gas_coins);
    const transaction = await tx.build({ client });

    // Sign from sender
    const senderSignature = (await senderKeypair.signTransaction(transaction)).signature

    const transactionEffects = await sponsorSignAndSubmit(reservedSponsorGasData.reservation_id, transaction, senderSignature)
    console.log(transactionEffects)
    console.log("https://explorer.rebased.iota.org/txblock/" + transactionEffects.transactionDigest + '?network=http%3A%2F%2F127.0.0.1%3A9000')
})()

interface ReserveGasResult {
    sponsor_address: string;
    reservation_id: number;
    gas_coins: ObjectRef[];
}

async function getSponsorGas(gasBudget: number): Promise<ReserveGasResult> {
    // Set bearer token configured in the gas pool server
    axios.defaults.headers.common = { 'Authorization': `Bearer ${GAS_POOL_BEARER_TOKEN}` }

    const requestData = {
        gas_budget: gasBudget,
        reserve_duration_secs: 10
    }
    let reservation_response = await axios.post(gasPoolUrl + '/v1/reserve_gas', requestData)
    return reservation_response.data.result
}

async function sponsorSignAndSubmit(reservationId: number, transaction: Uint8Array, senderSignature: string): Promise<TransactionEffects> {
    const data = {
        reservation_id: reservationId,
        tx_bytes: toB64(transaction),
        user_sig: senderSignature
    };
    // Let gas pool sign and submit
    let response = await axios.post(gasPoolUrl + '/v1/execute_tx', data)
    return response.data.effects
}

async function requestFundsIfNeeded(client: IotaClient, address: string) {
    const coinBalance = await client.getBalance({
        owner: address,
    });
    if (parseInt(coinBalance.totalBalance) < 2_500_000) {
        const faucetResponse = await requestIotaFromFaucetV0({
            host: faucetUrl,
            recipient: address,
        });
        console.log(faucetResponse)
        // Wait some time for the indexer to process the tx
        await new Promise(r => setTimeout(r, 3000));
    }
}
