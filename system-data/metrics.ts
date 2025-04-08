import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    const networkMetrics = await client.getNetworkMetrics()
    console.log(networkMetrics)

    const addressMetrics = await client.getAddressMetrics()
    console.log(addressMetrics)

    const moveMetrics = await client.getMoveCallMetrics()
    // console.log(moveMetrics)
    console.log(JSON.stringify(moveMetrics, (k, v) => {
        if (v instanceof Array)
            return JSON.stringify(v);
        return v;
    }, 2).replace(/\\/g, ''))
})()
