export let transactionResults: TransactionResults = {
    iotaCoin: undefined,
    failed: undefined,
    zeroIotaCoin: undefined,
    nonIotaCoin: undefined,
    nonCoinObject: undefined,
    gasSponsor: undefined,
    multipleAddresses: undefined,
    fromMultiSigAddress: undefined,
    smartContractCall: undefined,
    transferGasCoin: undefined,
};

interface TransactionData {
    digest: string;
    targetAddresses: string[];
    gasSponsor?: string;
}

interface TransactionResults {
    iotaCoin: TransactionData | undefined;
    failed: TransactionData | undefined;
    zeroIotaCoin: TransactionData | undefined;
    nonIotaCoin: TransactionData | undefined;
    nonCoinObject: TransactionData | undefined;
    gasSponsor: TransactionData | undefined;
    multipleAddresses: TransactionData | undefined;
    fromMultiSigAddress: TransactionData | undefined;
    smartContractCall: TransactionData | undefined;
    transferGasCoin: TransactionData | undefined;
}
