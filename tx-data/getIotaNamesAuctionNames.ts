import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://indexer.testnet.iota.cafe',
});

let cursor;
let txsToFind = 5000;
const nameCounts: Record<string, number> = {};
const seenDigests = new Set<string>();

function extractName(txBlock: any): string | null {
    try {
        let inputs = txBlock?.transaction?.data?.transaction?.inputs;
        if (typeof inputs === 'string') {
            inputs = JSON.parse(inputs);
        }
        if (!Array.isArray(inputs)) {
            console.log('inputs is not an array:', inputs);
            return null;
        }
        if (!inputs[2]) {
            console.log('inputs[2] missing:', inputs);
            return null;
        }
        if (typeof inputs[2].value !== 'string') {
            console.log('inputs[2].value is not a string:', inputs[2]);
            return null;
        }
        return inputs[2].value;
    } catch (e) {
        console.log('extractName error:', e, txBlock?.transaction?.data?.transaction?.inputs);
    }
    return null;
}

(async () => {
    searchLoop: while (true) {
        const txBlocksPage = await client.queryTransactionBlocks({
            cursor,
            filter: {
                MoveFunction: {
                    function: "place_bid",
                    module: "auction",
                    package: "0x6f727ea576a00036657fff0ae3a6d7c8171b178bf35112d6b83b2a6272cc5f0d",
                }
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

                // Extract and count the name
                const digest = txBlock?.digest;
                if (digest && !seenDigests.has(digest)) {
                    seenDigests.add(digest);
                    const name = extractName(txBlock);
                    if (name) {
                        nameCounts[name] = (nameCounts[name] || 0) + 1;
                    } else {
                        // Print the txBlock for debugging if name extraction fails
                        console.log('No name extracted for txBlock:', JSON.stringify(txBlock, null, 2));
                    }
                }

                // Optionally print the txBlock as before
                /*
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
                */

                txsToFind -= 1;
                if (txsToFind == 0) {
                    break searchLoop;
                }
            }
        }
        cursor = txBlocksPage.nextCursor;
    }

    // Print the summary, right-aligned
    const entries = Object.entries(nameCounts);
    if (entries.length === 0) {
        console.log("No names found.");
        return;
    }
    // Find max lengths for alignment
    const maxNameLen = Math.max(...entries.map(([name]) => name.length));
    const maxCountLen = Math.max(...entries.map(([, count]) => count.toString().length));
    // Sort by count descending, then name
    entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    for (const [name, count] of entries) {
        console.log(
            name.padStart(maxNameLen, ' ') +
            '  ' +
            count.toString().padStart(maxCountLen, ' ')
        );
    }
})();
