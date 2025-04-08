import { IotaClient } from '@iota/iota-sdk/client';

(async () => {
    const client = new IotaClient({
        url: 'https://api.testnet.iota.cafe',
    });
    const delegatedStakes = await client.getStakes({ owner: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215' })
    console.log(delegatedStakes)
})()
