import { IotaClient } from '@iota/iota-sdk/client';
import { requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';

(async () => {

    // Request funds from faucet so we have some data
    // const faucetResponse = await requestIotaFromFaucetV0({
    //     host: 'https://faucet.iota-rebased-alphanet.iota.cafe/gas',
    //     recipient: '0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215',
    // });
    // console.log(faucetResponse)
    // await new Promise(r => setTimeout(r, 2000));

    const client = new IotaClient({
        url: 'https://api.testnet.iota.cafe',
    });

    // Called in cronjob, then starting from latest known checkpoint until this one
    let latestCheckpoint = parseInt(await client.getLatestCheckpointSequenceNumber())
    console.log("Latest checkpoint number: " + latestCheckpoint)
    // Uncomment to overwrite with checkpoint with known tx
    // latestCheckpoint = 4423313
    // latestCheckpoint = 3984083

    let lastKnownCheckpoint = latestCheckpoint - 10

    for (let checkpointNumber = lastKnownCheckpoint; checkpointNumber <= latestCheckpoint; checkpointNumber++) {
        console.log("Processing checkpoint: " + checkpointNumber)

        const checkpoint = await client.getCheckpoint({ id: checkpointNumber.toString() });

        const transactions = await client.multiGetTransactionBlocks({ digests: checkpoint.transactions, options: { showBalanceChanges: true, showEffects: true } });
        for (const transaction of transactions) {
            if (transaction.effects == null || transaction.effects.status.status != 'success') {
                continue;
            }
            if (transaction.balanceChanges == null || transaction.balanceChanges.length == 0) {
                continue;
            }
            for (const balanceChange of transaction.balanceChanges) {
                if (balanceChange.coinType != "0x2::iota::IOTA") {
                    continue
                }
                // console.log(JSON.stringify(transaction, null, 2));
                console.log("Tx: " + transaction.digest)
                console.log(JSON.stringify(balanceChange, null, 2));
            }
        }

    }
})()
