import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    // url: 'https://api.iota-rebased-alphanet.iota.cafe',
    // url: 'https://api.hackanet.iota.cafe',
    url: 'http://127.0.0.1:9000',
});

(async () => {
    const object = await client.getObject({
        id: "0x5b890eaf2abcfa2ab90b77b8e6f3d5d8609586c3e583baf3dccd5af17edf48d1",
        options: {
            showBcs: true,
            showDisplay: true,
            showContent: true,
            showType: true,
        }
    })
    console.log(object)
})()
