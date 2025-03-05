import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';

(async () => {
    const client = new IotaClient({
        url: 'https://api.devnet.iota.cafe',
    });

    const tx = new Transaction();
    let packageId: string =
        "0x104d521d9d6ca86bbbe7910bd025f35ff5ed605dadecb234e159d7908d48ded6";
    let moduleName: string = "IoTDataModule";
    let functionName: string = "update_data";

    let args0: string =
        "0x677fe27616d274dad7d07db4bf46eaa6bc7764e712b3c0835d4fe9b2e750416d";
    let args1: string = "0x48656c6c6f20576f726c64";
    tx.moveCall({
        target: `${packageId}::${moduleName}::${functionName}`,
        arguments: [tx.object(args0), tx.pure.string(args1)],
    });

    tx.setSender(
        "0x834096c4c47f22aadaad935e94c8efb867ad9dd0497a06c66fe22992e7bae494",
    );
    const bytes = await tx.build({ client });
    const dryRunResult = await client.dryRunTransactionBlock({
        transactionBlock: bytes,
    });
    console.log(dryRunResult)
})()
