import { IotaClient, IotaHTTPTransport } from '@iota/iota-sdk/client';
import { WebSocket } from 'ws';

const client = new IotaClient({
    transport: new IotaHTTPTransport({
        url: 'https://api.iota-rebased-alphanet.iota.cafe',
        // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
        // @ts-ignore
        WebSocketConstructor: WebSocket,
        websocket: {
            url: 'wss://api.iota-rebased-alphanet.iota.cafe/websocket'
        }
    }),
});

(async () => {
    // naming the function unsubscribe may seem counterintuitive here, but you call it later to unsubscribe from the event
    const unsubscribe = await client.subscribeEvent({
        filter: {
            Sender: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
        },
        onMessage(event) {
            // handle subscription notification message here. This function is called once per subscription message.
            console.log(event)
            /// Example output:
            // {
            //     id: {
            //       txDigest: '5gjU9mTNappHMrXWCZqgiAWB87DpNEbRHNsBMjvPuvzW',
            //       eventSeq: '0'
            //     },
            //     packageId: '0x0000000000000000000000000000000000000000000000000000000000000003',
            //     transactionModule: 'iota_system',
            //     sender: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
            //     type: '0x3::validator::StakingRequestEvent',
            //     parsedJson: {
            //       amount: '10000000000',
            //       epoch: '10',
            //       pool_id: '0xfedd339dbd79dd2c4c16bb02e2ec3f34c5bd7fb8a7f98bedddbe865859853b33',
            //       staker_address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
            //       validator_address: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215'
            //     },
            //     bcs: 'prMHqkF6FY7JiCTvCFsAzdfg9TuHvejmoFgVzDdikFEYFhnC1n8agxXjpdrMecXeUDAZLFC4TARBMxJkdW7RMmph5frhKnhWFczn5Q9kfzpRfzyBCsBbL6nna31i9DdrELYtG7Q4a79mhBo4RbHjnHBqh',
            //     timestampMs: '1726492874306'
            //   }
        },
    });

    // later, to unsubscribe
    // await unsubscribe();
})()
