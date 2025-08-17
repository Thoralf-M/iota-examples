import {
    IotaGraphQLClient,
    type GraphQLQueryOptions,
    type GraphQLQueryResult,
} from '@iota/iota-sdk/graphql';
import { graphql } from '@iota/iota-sdk/graphql/schemas/2025.2';
import fs from 'fs';
import path from 'path';

// Script to fetch staking txs related to a given validator pool
// To skip syncing unrelated txs, create a cache file stake-txs.json with the following structure:
// {
//   "transactions": [],
//   "syncedSequenceNumber": 1130053
// }
// where the syncedSequenceNumber is the first tx of the validator address that called `request_add_validator_candidate`

const graphQLUrl = 'https://graphql.mainnet.iota.cafe';

const validatorPoolIds = [
    '0x75bc87e5433c67ed46646a10c0166d8bb5d458d2a1a313af897cc0c7fe3f955a',
    // Add more pool IDs here
];
const MAX_BATCH_SIZE = 1
const maxTransactions = undefined;
const inputObject = '0x5';
// const inputObject = undefined;
const functionFilter = undefined // '0x3::iota_system::request_add_stake';

const stakeTypes = [
    '0x0000000000000000000000000000000000000000000000000000000000000003::staking_pool::StakedIota',
    '0x0000000000000000000000000000000000000000000000000000000000000003::timelocked_staking::TimelockedStakedIota',
];

const stakeTxsCachePath = path.join(__dirname, 'stake-txs.json');

interface StakeTxsCache {
    transactions: RawTransactionBlock[];
    syncedSequenceNumber: number;
}

// Function to load or initialize checkpoint range cache
function loadStakeTxsCache(): StakeTxsCache {
    if (fs.existsSync(stakeTxsCachePath)) {
        const data = fs.readFileSync(stakeTxsCachePath, 'utf-8');
        return JSON.parse(data);
    }
    return { transactions: [], syncedSequenceNumber: 0 };
}

// Function to save checkpoint range cache
function saveStakeTxsCache(cache: StakeTxsCache) {
    fs.writeFileSync(stakeTxsCachePath, JSON.stringify(cache, null, 2));
}

export class GraphQLDataFetcher {
    constructor() { }

    async getLatestCheckpointSequence(): Promise<number> {
        const query = `
            query {
                checkpoints(last: 1) {
                    nodes {
                        sequenceNumber
                    }
                }
            }
        `;
        const result = await this.queryGraphQl(query);
        // @ts-ignore
        return result.data?.checkpoints?.nodes?.[0]?.sequenceNumber ?? 0;
    }

    private async queryGraphQl(
        query: string,
        variables: Record<string, any> = {},
    ): Promise<GraphQLQueryResult> {
        const options: GraphQLQueryOptions = {
            query: graphql(query),
            variables,
        };
        return new IotaGraphQLClient({
            url: graphQLUrl,
        }).query(options);
    }


    async fetchTransactionBatch(
        checkpointRange: CheckpointRange,
        batchSize: number = MAX_BATCH_SIZE,
        cursor?: string | null,
        inputObject?: string,
        functionFilter?: string,
    ): Promise<TransactionBatchResult> {
        const cursorSection = cursor ? `, after: "${cursor}"` : '';

        // Build filter object dynamically
        const filterParts = [
            `afterCheckpoint: ${checkpointRange.first}`,
        ];

        if (inputObject && inputObject.trim()) {
            filterParts.push(`inputObject: "${inputObject.trim()}"`);
        }

        if (functionFilter && functionFilter.trim()) {
            filterParts.push(`function: "${functionFilter.trim()}"`);
        }

        const filterString = filterParts.join(', ');

        // Add scanLimit if optional filters are provided
        const hasOptionalFilters =
            (inputObject && inputObject.trim()) || (functionFilter && functionFilter.trim());
        const scanLimitSection = hasOptionalFilters ? 'scanLimit: 100000000,' : '';

        const txQuery = `query {
                transactionBlocks(
                    ${scanLimitSection}
                    filter: {
                        ${filterString}
                    }
                    first: ${batchSize}${cursorSection}
                ) {
                    nodes {
                        digest
                        sender {
                            address
                        }
                        effects {
                            epoch{
                                epochId
                            }
                            checkpoint {
                                sequenceNumber
                                timestamp
                            }
                            objectChanges {
                                nodes {
                                    idDeleted
                                    idCreated
                                    address
                                    inputState {
                                        asMoveObject {
                                            contents {
                                                type {
                                                    repr
                                                }
                                                json
                                            }
                                        }
                                    }
                                    outputState {
                                        asMoveObject {
                                            contents {
                                                type{
                                                    repr
                                                }
                                                json
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }`;

        const result = await this.queryGraphQl(txQuery);

        if (result.errors) {
            throw new Error(
                `GraphQL Error: ${result.errors.map((e: any) => e.message).join(', ')}`,
            );
        }

        // @ts-ignore
        const transactionBlocks = result.data?.transactionBlocks?.nodes || [];
        // @ts-ignore
        const hasNextPage = result.data?.transactionBlocks?.pageInfo?.hasNextPage || false;
        // @ts-ignore
        const endCursor = result.data?.transactionBlocks?.pageInfo?.endCursor;

        return {
            transactions: transactionBlocks,
            hasNextPage,
            endCursor,
        };
    }

    async * fetchTransactionBlocks(
        checkpointRange: CheckpointRange,
        maxTransactions?: number,
        inputObject?: string,
        functionFilter?: string,
    ): AsyncGenerator<{
        transactions: RawTransactionBlock[];
        isComplete: boolean;
        totalFetched: number;
        hasMore: boolean;
    }> {
        let hasNextPage = true;
        let cursor: string | null = null;
        let totalFetched = 0;

        while (hasNextPage && (!maxTransactions || totalFetched < maxTransactions)) {
            const remainingToFetch = maxTransactions ? maxTransactions - totalFetched : MAX_BATCH_SIZE;
            const batchSize = Math.min(MAX_BATCH_SIZE, remainingToFetch);

            const batchResult = await this.fetchTransactionBatch(
                checkpointRange,
                batchSize,
                cursor,
                inputObject,
                functionFilter,
            );

            // Process transactions up to the limit
            const transactionsToProcess = maxTransactions
                ? batchResult.transactions.slice(0, remainingToFetch)
                : batchResult.transactions;

            totalFetched += transactionsToProcess.length;
            hasNextPage = batchResult.hasNextPage;
            cursor = batchResult.endCursor;

            const isComplete =
                !hasNextPage || (maxTransactions !== undefined && totalFetched >= maxTransactions);

            yield {
                transactions: transactionsToProcess,
                isComplete,
                totalFetched,
                hasMore: hasNextPage && (!maxTransactions || totalFetched < maxTransactions),
            };

            // Break if we've reached our limit
            if (maxTransactions && totalFetched >= maxTransactions) {
                break;
            }
        }
    }

}

export interface CheckpointRange {
    first: number;
    last: number;
}

export interface RawTransactionBlock {
    digest: string;
    sender?: {
        address: string;
    };
    effects?: {
        epoch?: {
            epochId: number;
        }
        checkpoint?: {
            sequenceNumber: number;
            timestamp: string;
        };
        objectChanges?: {
            nodes: any[];
        };
    };
}

export interface TransactionBatchResult {
    transactions: RawTransactionBlock[];
    hasNextPage: boolean;
    endCursor: string | null;
}


async function main() {
    let stakeTxsCache = loadStakeTxsCache();
    let checkpointRange: CheckpointRange = {
        first: stakeTxsCache.syncedSequenceNumber || 0,
        last: 0,
    };
    let fetcher = new GraphQLDataFetcher();
    const latestCheckpoint = await fetcher.getLatestCheckpointSequence();
    checkpointRange.last = latestCheckpoint;
    console.log(`Fetching transactions for pools ${validatorPoolIds.join(', ')} from checkpoint ${checkpointRange.first} to ${checkpointRange.last} (synced ${(checkpointRange.first / latestCheckpoint * 100).toFixed(2)}%)`);
    for await (const fetchResult of fetcher.fetchTransactionBlocks(
        checkpointRange,
        maxTransactions,
        inputObject,
        functionFilter,
    )) {
        const sequenceNumbers = fetchResult.transactions
            .map(tx => tx.effects?.checkpoint?.sequenceNumber)
            .filter((seq): seq is number => typeof seq === 'number');
        const highestSeq = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
        if (fetchResult.transactions) {
            for (const tx of fetchResult.transactions) {
                if (tx.effects && tx.effects.objectChanges && Array.isArray(tx.effects.objectChanges.nodes)) {
                    tx.effects.objectChanges.nodes = tx.effects.objectChanges.nodes.filter((objChange: any) => {
                        const inputJson = objChange.inputState?.asMoveObject?.contents?.json;
                        const outputJson = objChange.outputState?.asMoveObject?.contents?.json;
                        const inputType = objChange.inputState?.asMoveObject?.contents?.type?.repr;
                        const outputType = objChange.outputState?.asMoveObject?.contents?.type?.repr;
                        const typeMatch = stakeTypes.includes(inputType) || stakeTypes.includes(outputType);
                        const inputPoolId = inputJson?.pool_id || inputJson?.staked_iota?.pool_id;
                        const outputPoolId = outputJson?.pool_id || outputJson?.staked_iota?.pool_id;
                        const poolMatch = validatorPoolIds.includes(inputPoolId) || validatorPoolIds.includes(outputPoolId);
                        return typeMatch && poolMatch;
                    });
                }
            }
            fetchResult.transactions = fetchResult.transactions.filter(tx => {
                const nodes = tx.effects?.objectChanges?.nodes;
                return Array.isArray(nodes) && nodes.length > 0;
            });
        }
        stakeTxsCache.transactions.push(...fetchResult.transactions);
        if (highestSeq !== undefined) {
            stakeTxsCache.syncedSequenceNumber = highestSeq;
        }
        console.log(`Found ${fetchResult.transactions.length} transactions, synced ${highestSeq}/${latestCheckpoint} ${(highestSeq / latestCheckpoint * 100).toFixed(2)}%`);
        if (fetchResult.isComplete) {
            console.log(`Synced all txs up to checkpoint ${checkpointRange.last} for pools ${validatorPoolIds.join(', ')}`);
        }
        saveStakeTxsCache(stakeTxsCache);
    }
}

main()
