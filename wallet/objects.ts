import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.iota-rebased-alphanet.iota.cafe',
});

(async () => {
    const ownedObjects = await client.getOwnedObjects({
        owner: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
        options: { showContent: true }
    });
    console.log(JSON.stringify(ownedObjects, null, 2));
})()
