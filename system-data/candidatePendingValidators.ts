import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient({
    url: 'https://api.testnet.iota.cafe',
    // url: 'http://127.0.0.1:9000',
});

(async () => {
    const systemState = await client.getLatestIotaSystemState()
    console.log(systemState)

    const validatorCandidatesId = systemState.validatorCandidatesId
    // Note: pagination is not handled here, so only the first page of results will be returned
    const candidateValidators = await client.getDynamicFields({ parentId: validatorCandidatesId });
    for (const candidateValidator of candidateValidators.data) {
        const validatorWrapper = await client.getDynamicFieldObject({ parentId: validatorCandidatesId, name: candidateValidator.name });
        // @ts-ignore
        const validatorV1 = await client.getDynamicFields({ parentId: validatorWrapper.data?.content.fields.value.fields.inner.fields.id.id });
        const validatorObject = await client.getObject({ id: validatorV1.data[0].objectId, options: { showContent: true } });

        // @ts-ignore
        const validator = validatorObject.data?.content.fields.value.fields;
        cleanupValidatorFields(validator)
        console.log(JSON.stringify(validator, null, 2))
    }

    const pendingActiveValidatorsId = systemState.pendingActiveValidatorsId
    // Note: pagination is not handled here, so only the first page of results will be returned
    const pendingValidators = await client.getDynamicFields({ parentId: pendingActiveValidatorsId })
    for (const pendingValidator of pendingValidators.data) {
        // @ts-ignore
        const validatorObject = await client.getObject({ id: pendingValidator.objectId, options: { showContent: true } });

        // @ts-ignore
        const validator = validatorObject.data?.content.fields.value.fields;
        cleanupValidatorFields(validator)
        console.log(JSON.stringify(validator, null, 2))
    }
})()

// Remove fields from the validator to have a cleaner output
function cleanupValidatorFields(validator: any) {
    delete validator.extra_fields
    delete validator.metadata.type
    delete validator.metadata.fields.authority_pubkey_bytes
    delete validator.metadata.fields.next_epoch_authority_pubkey_bytes
    delete validator.metadata.fields.next_epoch_net_address
    delete validator.metadata.fields.next_epoch_network_pubkey_bytes
    delete validator.metadata.fields.next_epoch_p2p_address
    delete validator.metadata.fields.next_epoch_primary_address
    delete validator.metadata.fields.next_epoch_proof_of_possession
    delete validator.metadata.fields.next_epoch_protocol_pubkey_bytes
    delete validator.metadata.fields.net_address
    delete validator.metadata.fields.p2p_address
    delete validator.metadata.fields.primary_address
    delete validator.metadata.fields.image_url
    delete validator.metadata.fields.extra_fields
    delete validator.metadata.fields.network_pubkey_bytes
    delete validator.metadata.fields.proof_of_possession
    delete validator.metadata.fields.protocol_pubkey_bytes
    delete validator.staking_pool.type
    delete validator.staking_pool.fields.exchange_rates
    delete validator.staking_pool.fields.extra_fields
    delete validator.staking_pool.fields.id
}
