import { toBase64 } from '@iota/bcs';
import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
    // url: 'https://api.hackanet.iota.cafe',
    // url: 'http://127.0.0.1:9000',
});

(async () => {
    const txBlock = await client.getTransactionBlock({
        digest: 'AHBQTeoHykZwcEDUVTF7UizEHXU8SBmMcGPZMy8NQsxv',
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
    console.log(toBase64(txBlock.rawEffects));
})();
