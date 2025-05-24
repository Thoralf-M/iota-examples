import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
});

async function queryEvents() {
    try {
        const events = await client.queryEvents({
            query: {
                MoveModule: {
                    package: '0x0000000000000000000000000000000000000000000000000000000000000002',
                    module: 'kiosk',
                },
            },
            limit: 5,
        });
        console.log('Events:', JSON.stringify(events, null, 2));
    } catch (error) {
        console.error('Error querying events:', error);
    }
}

queryEvents();
