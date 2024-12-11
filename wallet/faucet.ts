import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';

(async () => {
    const faucetResponse = await requestIotaFromFaucetV0({
        host: 'https://faucet.iota-rebased-alphanet.iota.cafe/gas',
        recipient: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
    });
    console.log(faucetResponse)
})()
