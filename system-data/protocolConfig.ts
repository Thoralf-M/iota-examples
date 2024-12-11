import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.iota-rebased-alphanet.iota.cafe',
    // url: 'https://api-direct.iota-rebased-alphanet.iota.cafe',
});

(async () => {
    const protocolConfig = await client.getProtocolConfig()
    console.log(protocolConfig)
})()
