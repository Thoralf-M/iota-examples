import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://indexer.mainnet.iota.cafe',
});

let cursor;
let txsToFind = 5000;
(async () => {
    searchLoop: while (true) {
        const txBlocksPage = await client.queryTransactionBlocks({
            cursor,
            filter: {
                // Currently only supported by the indexer
                TransactionKind: 'ProgrammableTransaction'
            },
            options: {
                showEffects: false,
                showInput: true,
                showObjectChanges: false,
            },
        });
        for (const txBlock of txBlocksPage.data) {
            if (
                txBlock.transaction != null
            ) {
                // Cleanup output
                try {
                    // @ts-ignore
                    delete txBlock.transaction.data.messageVersion;
                    // @ts-ignore
                    delete txBlock.transaction.data.transaction.inputs[0].type;
                    // @ts-ignore
                    delete txBlock.transaction.data.transaction.inputs[0].valueType;
                    // @ts-ignore
                    delete txBlock.transaction.data.gasData.payment[0].digest;
                    // @ts-ignore
                    delete txBlock.transaction.data.sender;
                    // @ts-ignore
                    delete txBlock.transaction.txSignatures;
                } catch (error) { }

                console.log(
                    JSON.stringify(
                        txBlock,
                        (k, v) => {
                            if (v instanceof Array) return JSON.stringify(v);
                            return v;
                        },
                        2,
                    ).replace(/\\/g, ''),
                );
                // console.log(txBlock)
                txsToFind -= 1;
                if (txsToFind == 0) {
                    break searchLoop;
                }
            }
        }
        cursor = txBlocksPage.nextCursor;
    }
})();
