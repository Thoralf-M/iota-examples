import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

(async () => {
    const totalTxBlocks = await client.getTotalTransactionBlocks();
    console.log('Total tx blocks: ' + totalTxBlocks);
    // One tx block can contain multiple transactions
    const totalTxs = await client.getTotalTransactionBlocks();
    console.log('Total txs: ' + totalTxs);

    const txBlocksPage = await client.queryTransactionBlocks({ limit: 2 });
    console.log(txBlocksPage);
    const txBlock = await client.getTransactionBlock({
        digest: txBlocksPage.data[0].digest,
        options: { showObjectChanges: true },
    });
    console.log(txBlock);
})();
