import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

let address = '0x0000a4984bd495d4346fa208ddff4f5d5e5ad48c21dec631ddebc99809f16900'
console.log('Sender address: ' + address);

let stakedIotaObjectId = '0x1e0a56e50e4c194fe42dd27206248163842d81431db6c29f8ce6f5d0606dabe9';
let timelocked = false;
let unstakeAmount = 1_000_000_000 // amount in NANO
const tx = new Transaction();
const splitStakedIota = tx.moveCall({
    target: timelocked ? '0x3::timelocked_staking::split' : '0x3::staking_pool::split',
    arguments: [tx.object(stakedIotaObjectId), tx.pure.u64(unstakeAmount)],
})
tx.moveCall({
    target: timelocked ? '0x3::timelocked_staking::request_withdraw_stake' : '0x3::iota_system::request_withdraw_stake',
    arguments: [
        tx.object('0x5'), // system state object
        splitStakedIota
    ],
});
tx.setSender(address);

(async () => {
    const txBytes = await tx.build({ client });
    const txResponse = await client.dryRunTransactionBlock({
        transactionBlock: txBytes,
    });
    console.log(txResponse);
})();

