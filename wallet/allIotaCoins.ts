import { CoinStruct, IotaClient, PaginatedCoins } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    let coins = await getAllIotaCoins(
        client,
        '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
    );

    // console.log(JSON.stringify(coins, null, 2));
    console.log('Coin objects: ' + coins.length);
})();

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
        console.log('Current fetched coin objects: ' + coins.length);
    } while (cursor);
    return coins;
}
