import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';

(async () => {
    const client = new IotaClient({
        url: 'https://api.devnet.iota.cafe',
    });

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [1_000_000]);
    tx.transferObjects(
        [coin],
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    );

    tx.setSender('0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e');
    const bytes = await tx.build({ client });
    const dryRunResult = await client.dryRunTransactionBlock({
        transactionBlock: bytes,
    });
    console.log(dryRunResult);
})();
