import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    // url: 'https://api.iota-rebased-alphanet.iota.cafe',
    url: 'https://api.devnet.iota.cafe',
    // url: 'http://127.0.0.1:9000',
});

(async () => {
    const object = await client.getObject({
        id: '0x85f493ba298b68af3e4812385460e21ddc5aa61273efd9dc54aa6919848090e4',
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
