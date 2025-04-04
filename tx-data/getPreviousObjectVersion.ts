import { IotaClient } from '@iota/iota-sdk/client';

(async () => {
    const client = new IotaClient({
        url: 'https://api.testnet.iota.cafe',
    });
    const objectId = '0x05e448b68e7e2221002fa7ed8b4f931e1dfbd484a923f57e76c43d7944ecd3f9';
    const object = await client.getObject({ id: objectId, options: { showPreviousTransaction: true } });
    const txBlock = await client.getTransactionBlock({
        digest: object.data?.previousTransaction!,
        options: {
            showInput: true,
        }
    })
    let previousVersion;
    // @ts-ignore
    for (const input of txBlock.transaction?.data.transaction.inputs) {
        if (input.type === 'object' && input.objectId === objectId) {
            console.log('Found input:', input);
            previousVersion = input.version

        }
    }
    console.log('Previous version:', previousVersion);
})()
