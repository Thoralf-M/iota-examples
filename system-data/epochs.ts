import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
    // url: 'http://localhost:9000',
});

(async () => {
    const currentEpoch = await client.getCurrentEpoch();
    console.log(currentEpoch);

    const epochs = await client.getEpochs({ limit: 2 });
    console.log(epochs);

    const epochMetrics = await client.getEpochMetrics({ limit: 2 });
    console.log(epochMetrics);

    const allEpochMetrics = await client.getAllEpochAddressMetrics();
    console.log(allEpochMetrics);
})();
