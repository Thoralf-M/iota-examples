// Live transaction subscription using native GraphQL subscriptions.
// ts-node graphql/subscribeTransactionsLive.ts

import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';

const graphqlUrlInput = process.env.IOTA_GRAPHQL_URL ?? 'https://graphql.devnet.iota.cafe/graphql';
const graphqlUrl = new URL(graphqlUrlInput);

if (graphqlUrl.pathname === '/') {
    graphqlUrl.pathname = '/graphql';
}

const graphqlWsUrl =
    process.env.IOTA_GRAPHQL_SUBSCRIPTION_URL ??
    `${graphqlUrl.protocol === 'https:' ? 'wss' : 'ws'}://${graphqlUrl.host}/subscriptions`;
const signingAddress = process.env.IOTA_SIGNING_ADDRESS;
const kind = process.env.IOTA_TX_KIND;
const moveFunction = process.env.IOTA_MOVE_FUNCTION;

const subscriptionQuery = /* GraphQL */ `
    subscription OnTransactions($filter: SubscriptionTransactionFilter) {
        transactions(filter: $filter) {
            __typename
            ... on TransactionBlock {
                digest
                indexedOnNode
            }
            ... on Lagged {
                count
            }
        }
    }
`;

async function main() {
    const filter: Record<string, string> = {};

    if (kind) {
        filter.kind = kind;
    }

    if (signingAddress) {
        filter.signingAddress = signingAddress;
    }

    if (moveFunction) {
        filter.function = moveFunction;
    }

    const client = createClient({
        url: graphqlWsUrl,
        webSocketImpl: WebSocket,
    });

    console.log('Subscribing to GraphQL transactions...');
    console.log(`GraphQL endpoint: ${graphqlUrl.toString()}`);
    console.log(`GraphQL websocket endpoint: ${graphqlWsUrl}`);
    console.log(`Filter: ${JSON.stringify(filter)}`);

    const unsubscribe = client.subscribe(
        {
            query: subscriptionQuery,
            variables: {
                filter: Object.keys(filter).length ? filter : null,
            },
        },
        {
            next: (message) => {
                console.log('Transaction event:');
                console.log(JSON.stringify(message, null, 2));
            },
            error: (error) => {
                console.error('Subscription error:', error);
            },
            complete: () => {
                console.log('Subscription completed.');
            },
        },
    );

    console.log('Subscribed. Press Ctrl+C to stop.');

    const shutdown = () => {
        console.log('\nStopping subscription...');
        unsubscribe();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

void main().catch((error: unknown) => {
    console.error('Subscription setup failed:', error);
    process.exit(1);
});
