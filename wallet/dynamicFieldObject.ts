import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

(async () => {
    const ownedObjects = await client.getDynamicFieldObject({
        parentId: '0x82139fa7c076816b67e2ff0927f2b30e4d6e2874a3a108649152a7b7d9eb25ac',
        name: {
            type: "address",
            value: "0xa1a97d20bbad79e2ac89f215a3b3c4f2ff9a1aa3cc26e529bde6e7bc5500d610"
        },
    });
    console.log(JSON.stringify(ownedObjects, null, 2));

    const ownedObjects2 = await client.getDynamicFieldObject({
        parentId: '0xd48c0a882059036ca8c21dcc8d8bcaefc923aa678f225d3d515b79e3094e5616',
        name: {
            type: "0x20c890da38609db67e2713e6b33b4e4d3c6a8e9f620f9bb48f918d2337e31503::domain::Domain",
            value: "55555.iota".split('.').reverse()
        },
    });
    console.log(JSON.stringify(ownedObjects2, null, 2));
})()
