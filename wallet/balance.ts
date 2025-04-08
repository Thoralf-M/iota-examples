import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    const address = '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215'
    const coinBalance = await client.getBalance({
        owner: address,
        // default:
        // coinType: 'iota::iota::IOTA',
    });
    console.log(`Address: ${address} balance:\n`, coinBalance)
})()
