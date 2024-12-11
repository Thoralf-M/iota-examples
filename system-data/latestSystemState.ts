import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'http://127.0.0.1:9000',
    // url: 'https://api.iota-rebased-alphanet.iota.cafe',
    // url: 'https://api-direct.iota-rebased-alphanet.iota.cafe',
});

(async () => {
    const systemState = await client.getLatestIotaSystemState();
    console.log(systemState)
})()
