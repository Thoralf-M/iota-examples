import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'http://localhost:9000',
    // url: 'https://api.iota-rebased-alphanet.iota.cafe',
    // url: 'https://api-direct.iota-rebased-alphanet.iota.cafe',
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
