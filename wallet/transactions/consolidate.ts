import { CoinStruct, IotaClient, PaginatedCoins } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.hackanet.iota.cafe',
});

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const keypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const address = keypair.getPublicKey().toIotaAddress();
console.log("Sender address: " + address);

(async () => {
    let coins = await getAllIotaCoins(client, address)
    if (coins.length < 2) {
        console.log("No coins to consolidate")
        return
    }

    console.log(`Available coins: ${coins.length}`);

    let position = coins.findIndex(c => parseInt(c.balance) > 500_000)
    let [gasCoinObject] = coins.splice(position, 1);

    let coinObjectIds = coins.slice(0, 1676).map((coin) => {
        return coin.coinObjectId;
    })
    console.log(`Consolidating ${coinObjectIds.length + 1} coins`);

    const tx = new Transaction();
    const chunkSize = 511;
    for (let i = 0; i < coinObjectIds.length; i += chunkSize) {
        const coinObjectIdsChunk = coinObjectIds.slice(i, i + chunkSize);
        // For many coin objects (> 512) one needs to call mergeCoins() multiple times with a max of 1676 inputs in a single PTB.
        tx.mergeCoins(tx.gas, coinObjectIdsChunk);
    }
    tx.setGasPayment([{ objectId: gasCoinObject.coinObjectId, version: gasCoinObject.version, digest: gasCoinObject.digest }])

    const txResponse = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
    console.log(txResponse)
    console.log("https://explorer.rebased.iota.org/txblock/" + txResponse.digest)
})()



async function getAllIotaCoins(client: IotaClient, address: string): Promise<CoinStruct[]> {
    let cursor: string | undefined | null = null;
    const coins: CoinStruct[] = [];
    // keep fetching until cursor is null or undefined
    do {
        const { data, nextCursor }: PaginatedCoins = await client.getCoins({
            owner: address,
            cursor,
        });
        if (!data || !data.length) {
            break;
        }

        coins.push(...data);
        cursor = nextCursor;
    } while (cursor);
    return coins
}
