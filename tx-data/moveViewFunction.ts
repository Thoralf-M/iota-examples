import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

(async () => {
    const object = await client.view({
        functionName: "0x2::clock::timestamp_ms",
        typeArgs: [],
        arguments: [
            "0x6"
        ]
    });
    console.log(JSON.stringify(object, null, 2));
})();
