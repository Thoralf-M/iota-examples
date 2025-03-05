import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
    // url: 'https://api-direct.iota-rebased-alphanet.iota.cafe',
});

(async () => {
    const chainIdentifier = await client.getChainIdentifier()
    console.log(chainIdentifier)
})()
