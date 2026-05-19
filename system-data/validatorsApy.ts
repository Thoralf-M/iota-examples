import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

(async () => {
    const validatorsApy = await client.getValidatorsApy();
    console.log(validatorsApy);
})();
