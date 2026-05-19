import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';

const client = new IotaClient({
    url: 'https://api.devnet.iota.cafe',
});

let address = '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e';
console.log('Sender address: ' + address);

let stakedIotaObjectId = '0x3e59a718a8f29093e16b17b15930835364cb7ca9942a8d0c1a3283f056990f1d';
let timelocked = false;
let unstakeAmount = 1_000_000_000; // amount in NANO
const tx = new Transaction();
const splitStakedIota = tx.moveCall({
    target: timelocked ? '0x3::timelocked_staking::split' : '0x3::staking_pool::split',
    arguments: [tx.object(stakedIotaObjectId), tx.pure.u64(unstakeAmount)],
});
tx.moveCall({
    target: timelocked
        ? '0x3::timelocked_staking::request_withdraw_stake'
        : '0x3::iota_system::request_withdraw_stake',
    arguments: [
        tx.object('0x5'), // system state object
        splitStakedIota,
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
