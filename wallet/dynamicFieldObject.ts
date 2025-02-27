import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

(async () => {
    const ownedObjects = await client.getDynamicFieldObject({
        parentId: '0xd48c0a882059036ca8c21dcc8d8bcaefc923aa678f225d3d515b79e3094e5616',
        name: {
            type: "0x20c890da38609db67e2713e6b33b4e4d3c6a8e9f620f9bb48f918d2337e31503::domain::Domain",
            value: "55555.iota".split('.').reverse()
        },
    });
    console.log(JSON.stringify(ownedObjects, null, 2));
})()
