import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

(async () => {
    const object = await client.view({
        functionName: "0x5e7a300e640f645a4030aeb507c7be16909e6fa9711e7ca2d4397bbd967d5c50::auction::get_auction_metadata",
        typeArgs: [],
        callArgs: [
            "0x31deb8cbd320867089d52c37fed2d443520aac0fc5a957de1f64f9135b83f42b",
            "auc.iota"
        ]
    });
    console.log(JSON.stringify(object, null, 2));
})();
