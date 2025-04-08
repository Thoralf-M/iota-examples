import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    const validatorsApy = await client.getValidatorsApy()
    console.log(validatorsApy)
})()
