import { toB64 } from '@iota/bcs';
import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
    // url: 'https://api.hackanet.iota.cafe',
    // url: 'http://127.0.0.1:9000',
});

(async () => {
    const txBlock = await client.getTransactionBlock({
        digest: '6uo67WYPZWMGc5PqSntxrU7LZSwpxBH5hVn8HWdw7jqK',
        options: {
            // showObjectChanges: true,
            showRawEffects: true,
            // showEffects: false,
            // showInput: true,
            // showRawInput: true,
            // showEvents: true,
            // showBalanceChanges: true
        },
    });
    console.log(txBlock);
    // @ts-ignore
    console.log(toB64(txBlock.rawEffects));
})();
