import { IotaClient } from '@iota/iota-sdk/client';

(async () => {
    const client = new IotaClient({
        url: 'https://indexer.testnet.iota.cafe',
    });
    const objectId = '0xb42b9db5e3363ea80767891458406377ff212b8b4ce1aea5ad396df52250ada1';
    const object = await client.getObject({
        id: objectId,
        options: { showContent: true, showPreviousTransaction: true },
    });

    console.log('Current object version:', object.data?.version);
    console.log(object);

    const allVersions: any[] = [object];
    let previousTransaction = object.data?.previousTransaction;

    // Get all previous versions of the object
    while (previousTransaction) {
        const txBlock = await client.getTransactionBlock({
            digest: previousTransaction,
            options: {
                showInput: true,
                showEvents: true,
            },
        });

        console.log(`\nTx ${previousTransaction} - Events:`, txBlock.events);

        // Find the previous version from transaction inputs or gas payment
        const txData = txBlock.transaction?.data as any;
        const inputs = [...(txData?.transaction?.inputs ?? []), ...(txData?.gasData?.payment ?? [])];
        const previousVersion = inputs.find((i: any) => i.objectId === objectId)?.version;

        if (!previousVersion) {
            console.log(`\nObject was created in tx: ${previousTransaction}`);
            break;
        }

        const previousObject = await client.tryGetPastObject({
            id: objectId,
            version: parseInt(previousVersion),
            options: { showContent: true, showPreviousTransaction: true },
        });

        console.log(`\nVersion ${previousVersion}:`);
        console.log(previousObject);

        allVersions.push(previousObject);
        previousTransaction = (previousObject as any).details?.previousTransaction;
    }

    console.log(`\nTotal versions found: ${allVersions.length}`);
})();
