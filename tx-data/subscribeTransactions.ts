import { IotaClient, IotaHTTPTransport } from '@iota/iota-sdk/client';
import { WebSocket } from 'ws';

const client = new IotaClient({
    transport: new IotaHTTPTransport({
        url: 'https://api.testnet.iota.cafe',
        // @ts-ignore
        WebSocketConstructor: WebSocket,
        websocket: {
            url: 'wss://api.testnet.iota.cafe',
        },
    }),
});

(async () => {
    await client.subscribeTransaction({
        filter: {
            FromAddress: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
        },
        onMessage(event) {
            console.log(event);
        },
    });
    await client.subscribeTransaction({
        filter: {
            ToAddress: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
        },
        onMessage(event) {
            // handle subscription notification message here. This function is called once per subscription message.
            console.log(event);
            // {
            //     messageVersion: 'v1',
            //     status: { status: 'success' },
            //     executedEpoch: '11',
            //     gasUsed: {
            //       computationCost: '1000000',
            //       storageCost: '2964000',
            //       storageRebate: '1976000',
            //       nonRefundableStorageFee: '0'
            //     },
            //     modifiedAtVersions: [
            //       {
            //         objectId: '0x000672272638d5ed799bea32109cc089d8eb7f3d7709379901cc0e2f3e64b3d6',
            //         sequenceNumber: '2142'
            //       },
            //       {
            //         objectId: '0x8251b9ae7554bf99baca9eb1e87888c5172168c078ec8ffd4d38db5ae548d840',
            //         sequenceNumber: '2142'
            //       }
            //     ],
            //     transactionDigest: '3GbijBmdP7isrpi9FWKjdELZe6BA5H3BG7bfRZwBReWq',
            //     created: [ { owner: [Object], reference: [Object] } ],
            //     mutated: [
            //       { owner: [Object], reference: [Object] },
            //       { owner: [Object], reference: [Object] }
            //     ],
            //     gasObject: {
            //       owner: {
            //         AddressOwner: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215'
            //       },
            //       reference: {
            //         objectId: '0x000672272638d5ed799bea32109cc089d8eb7f3d7709379901cc0e2f3e64b3d6',
            //         version: 2143,
            //         digest: 'B53mhg9r6DBLJZmsvdTacE49p2tztt7NYVbZxaDG2eFH'
            //       }
            //     },
            //     dependencies: [ 'HNqNES5H1U4U4oEEDzUncfwnPadBD1BpuLLK9rfTfeo5' ]
            //   }
        },
    });
})();

// iota client pay --amounts 1 --recipients 0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215 --gas-budget 100000000 --input-coins 0x8251b9ae7554bf99baca9eb1e87888c5172168c078ec8ffd4d38db5ae548d840
