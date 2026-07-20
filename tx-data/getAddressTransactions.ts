import { IotaClient } from '@iota/iota-sdk/client';
import type { TransactionFilter } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.mainnet.iota.cafe',
});

const address = '0x7ad28bcbaa0b375232fa5cece58676a5f9d90d607311583b9f260be73e08eb2a';

const maxTransactions = 2;
const pageSize = 1;

async function printTransactions(
    filter: TransactionFilter,
    senderMatches: (sender: string | undefined) => boolean,
) {
    let printed = 0;
    let cursor: string | null | undefined = undefined;

    while (printed < maxTransactions) {
        const txsPage = await client.queryTransactionBlocks({
            filter,
            options: { showBalanceChanges: true, showInput: true },
            limit: pageSize,
            cursor,
            order: 'descending',
        });

        for (const tx of txsPage.data) {
            const sender = tx.transaction?.data.sender;
            if (!senderMatches(sender)) {
                continue;
            }
            console.log('Digest: ' + tx.digest + ', sender: ' + sender);
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
}

(async () => {
    // The combined FromOrToAddress filter is only available on indexer-backed
    // endpoints, so query sent and received transactions separately.
    // The ToAddress filter is effects-based and also matches the sender's own
    // transactions (e.g. the mutated gas coin returns to the sender), so
    // additionally filter by the actual sender to prevent the same transaction
    // from appearing as both sent and received
    console.log('Transactions sent by ' + address + ':');
    await printTransactions({ FromAddress: address }, (sender) => sender === address);

    console.log('\nTransactions received by ' + address + ':');
    await printTransactions({ ToAddress: address }, (sender) => sender !== address);
})();
