import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    // url: 'http://127.0.0.1:9000',
    url: 'https://api.hackanet.iota.cafe',
    // url: 'https://api.iota-rebased-alphanet.iota.cafe',
});

(async () => {
    const currentEpochInfo = await client.getCurrentEpoch()
    console.log(currentEpochInfo)

    const committeeInfo = await client.getCommitteeInfo({ epoch: currentEpochInfo.epoch });
    console.log(committeeInfo)

    // Manually call an endpoint
    // const committeeInfo_ = await client.call('iotax_getCommitteeInfo', [(currentEpochInfo.epoch - 1).toString()]);
    // console.log(committeeInfo_)
})()
