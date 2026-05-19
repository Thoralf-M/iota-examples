import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
    // url: 'https://api.devnet.iota.cafe',
    // url: 'https://api-direct.iota-rebased-alphanet.iota.cafe',
});

(async () => {
    console.log(await client.getCoinMetadata({ coinType: '0x2::iota::IOTA' }));
})();
