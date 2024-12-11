import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'http://127.0.0.1:9000',
    // url: 'https://api.iota-rebased-alphanet.iota.cafe',
});


let cursor;
let txsToFind = 5;
(async () => {
    searchLoop: while (true) {
        const txBlocksPage = await client.queryTransactionBlocks({
            cursor,
            options: {
                showEffects: false,
                showInput: true,
                showObjectChanges: false
            }
        })
        for (const txBlock of txBlocksPage.data) {
            if (txBlock.transaction != null
                // @ts-ignore
                && txBlock.transaction.data.transaction.kind != 'ConsensusCommitPrologueV1'
                && txBlock.transaction.data.transaction.kind != 'RandomnessStateUpdate'
                && txBlock.transaction.data.transaction.kind != 'EndOfEpochTransaction'
                // && txBlock.transaction.data.transaction.kind != 'AuthenticatorStateUpdate'
            ) {
                // Cleanup output
                try {
                    // Temp fix to not spam the console output as the raw effects are currently always included https://github.com/iotaledger/iota/issues/2488
                    delete txBlock.rawEffects
                    // @ts-ignore
                    delete txBlock.transaction.data.messageVersion
                    // @ts-ignore
                    delete txBlock.transaction.data.transaction.inputs[0].type
                    // @ts-ignore
                    delete txBlock.transaction.data.transaction.inputs[0].valueType
                    // @ts-ignore
                    delete txBlock.transaction.data.gasData.payment[0].digest
                    // @ts-ignore
                    delete txBlock.transaction.data.sender
                    // @ts-ignore
                    delete txBlock.transaction.txSignatures
                } catch (error) { }

                console.log(JSON.stringify(txBlock, (k, v) => {
                    if (v instanceof Array)
                        return JSON.stringify(v);
                    return v;
                }, 2).replace(/\\/g, ''))
                // console.log(txBlock)
                txsToFind -= 1;
                if (txsToFind == 0) {
                    break searchLoop
                }
            }
        }
        cursor = txBlocksPage.nextCursor;
    }
})()
