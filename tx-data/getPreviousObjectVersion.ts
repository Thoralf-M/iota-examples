import { IotaClient } from '@iota/iota-sdk/client';

(async () => {
    const client = new IotaClient({
        url: 'https://api.testnet.iota.cafe',
    });
    const objectId = '0x0031cf44d9b568dbd93302d23fa064b13b42e0c3f741783229702f85584d1ee0';
    const object = await client.getObject({ id: objectId, options: { showPreviousTransaction: true } });

    // Manually get the previous version of the object as tryGetObjectBeforeVersion is not part of the TS SDK: https://github.com/iotaledger/iota/issues/6266
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
    // Object could also be used as gas object
    // @ts-ignore
    for (const input of txBlock.transaction?.data.gasData.payment) {
        if (input.objectId === objectId) {
            console.log('Found input as gas object:', input);
            previousVersion = input.version
        }
    }
    console.log('Previous version:', previousVersion);

    let previousObject = await client.tryGetPastObject({
        id: objectId,
        version: parseInt(previousVersion),
        options: { showContent: true, showPreviousTransaction: true }
    })
    console.log(previousObject)

})()
