import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    const latestCheckpoint = await client.getLatestCheckpointSequenceNumber();
    console.log('Latest checkpoint number: ' + latestCheckpoint);

    const checkpoint = await client.getCheckpoint({ id: latestCheckpoint });
    console.log(checkpoint);

    // Get the latest 2 checkpoints
    const checkpoints = await client.getCheckpoints({ limit: 2, descendingOrder: true });
    console.log(JSON.stringify(checkpoints, null, 2));
})();
