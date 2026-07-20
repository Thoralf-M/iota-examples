import { IotaClient } from '@iota/iota-sdk/client';

// The combined FromOrToAddress filter requires an indexer-backed endpoint.
// Fallback for plain fullnodes (e.g. https://api.mainnet.iota.cafe), which
// reject this filter: query { FromAddress: address } and { ToAddress: address }
// separately and dedupe by digest. Note that the ToAddress filter is
// effects-based and also matches the address' own transactions (the mutated
// gas coin returns to the sender), so classify sent vs. received by comparing
// the transaction's sender field with the address
const client = new IotaClient({
    url: 'https://indexer.mainnet.iota.cafe',
});

const address = '0x7ad28bcbaa0b375232fa5cece58676a5f9d90d607311583b9f260be73e08eb2a';

const maxTransactions = 2;
const pageSize = 1;

(async () => {
    let printed = 0;
    let cursor: string | null | undefined = undefined;

    console.log('Transactions sent or received by ' + address + ':');
    while (printed < maxTransactions) {
        const txsPage = await client.queryTransactionBlocks({
            filter: { FromOrToAddress: { addr: address } },
            options: { showBalanceChanges: true, showInput: true },
            limit: pageSize,
            cursor,
            order: 'descending',
        });

        for (const tx of txsPage.data) {
            const sender = tx.transaction?.data.sender;
            const direction = sender === address ? 'sent' : 'received';
            console.log('Digest: ' + tx.digest + ', sender: ' + sender + ' (' + direction + ')');
            for (const change of tx.balanceChanges ?? []) {
                console.log(
                    `    owner=${JSON.stringify(change.owner)} coinType=${change.coinType} amount=${change.amount}`,
                );
            }
            printed++;
            if (printed >= maxTransactions) {
                break;
            }
        }

        if (!txsPage.hasNextPage || !txsPage.nextCursor) {
            break;
        }
        cursor = txsPage.nextCursor;
    }
})();
