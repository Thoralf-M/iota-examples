import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    // url: 'https://api.devnet.iota.cafe',
    url: 'https://api.devnet.iota.cafe',
    // url: 'http://127.0.0.1:9000',
});

(async () => {
    const object = await client.getObject({
        id: '0xc9404b0ad47fc2cdcb429d4eb2b8b62b1b75b278efaa341ea44617d0203e0f00',
        options: {
            showBcs: true,
            showDisplay: true,
            showContent: true,
            showOwner: true,
            showType: true,
        },
    });
    console.log(JSON.stringify(object, null, 2));
})();
