// Modified from https://gist.github.com/JackyWYX/2bd9dea336325158572e1187c16c0eee
import { PublicKey, SIGNATURE_FLAG_TO_SCHEME } from '@iota/iota-sdk/cryptography';
import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';
import { MultiSigPublicKey } from '@iota/iota-sdk/multisig';
import { assert } from 'console';

type Weight = number;
type OwnerWeightPubKey = {
    publicKey: PublicKey;
    weight: Weight;
}
type PublicKeyWithSchema = {
    publicKey: PublicKey;
    schema: string;
}

export const NONCE_PREFIX_MAX_SIZE = 16;
export const NONCE_PK_PREFIX = 'maven';
export const NONCE_PK_WEIGHT = 1;

export function computeMSafeAddress(input: {
    owners: OwnerWeightPubKey[];
    threshold: Weight;
    nonce: number | undefined;
}): string {
    const { owners, threshold, nonce } = input;
    const pks = owners.map((owner) => ({
        publicKey: owner.publicKey,
        weight: owner.weight,
    }));
    if (nonce !== undefined) {
        // append nonce public key, weight is 1 because 0 is not allowed
        pks.push({
            publicKey: noncePublicKey(nonce).publicKey,
            weight: NONCE_PK_WEIGHT,
        });
    }
    return MultiSigPublicKey.fromPublicKeys({ threshold, publicKeys: pks }).toIotaAddress();
}

export function noncePublicKeyWithWeight(nonce: number) {
    return {
        pubKey: noncePublicKey(nonce).publicKey,
        weight: NONCE_PK_WEIGHT,
    };
}

export function noncePublicKey(nonce: number): PublicKeyWithSchema {
    const buffer = new ArrayBuffer(Ed25519PublicKey.SIZE);
    const textEncoder = new TextEncoder();
    textEncoder.encodeInto(NONCE_PK_PREFIX, new Uint8Array(buffer, 0, NONCE_PREFIX_MAX_SIZE));
    const nonceView = new DataView(buffer, NONCE_PREFIX_MAX_SIZE, 4);
    nonceView.setUint32(0, nonce, true);
    const pk = new Ed25519PublicKey(new Uint8Array(buffer));
    return {
        publicKey: pk,
        schema: getSchemaFromPublicKey(pk),
    };
}

export function getSchemaFromPublicKey(pk: PublicKey) {
    const flag = pk.flag() as keyof typeof SIGNATURE_FLAG_TO_SCHEME;
    if (!SIGNATURE_FLAG_TO_SCHEME[flag]) {
        throw new Error('Invalid public key');
    }
    return SIGNATURE_FLAG_TO_SCHEME[flag];
}

let publicKey0Base64 = 'D8B0q6XeNDgHF0Wa4mGTfY+nZoHQVyoMVopEHmhkFgs=';
let pulicKey0WithFlagBase64 = 'AA/AdKul3jQ4BxdFmuJhk32Pp2aB0FcqDFaKRB5oZBYL'
let address0 = '0x0000a4984bd495d4346fa208ddff4f5d5e5ad48c21dec631ddebc99809f16900'

let msafeAddress0 = '0xd2ab6beca6ec6502bb8bd34d73e943c6d12087cc937f2facdb046cfb67904a91';

let inputData0 = {
    owners: [
        {
            publicKey: new Ed25519PublicKey(publicKey0Base64),
            weight: 1
        }
    ],
    threshold: 1,
    // Increased for every new account
    nonce: 0
}
let computedMsafeAddress0 = computeMSafeAddress(inputData0)
assert(computedMsafeAddress0 === msafeAddress0, `Expected ${msafeAddress0}, got ${computedMsafeAddress0}`);
console.log("Additional pk with flag for computedMsafeAddress0", noncePublicKey(inputData0.nonce).publicKey.toIotaPublicKey());
console.log("computedMsafeAddress0", computedMsafeAddress0)


let publicKey1Base64 = 'YNSEfDzye5OZwQk3MVAuiWf+Tby4+tE+GPmHeDzvL0I=';
let pulicKey1WithFlagBase64 = 'AGDUhHw88nuTmcEJNzFQLoln/k28uPrRPhj5h3g87y9C'
let address1 = '0x111173a14c3d402c01546c54265c30cc04414c7b7ec1732412bb19066dd49d11'

let msafeAddress1 = '0x8a2a1906c00c5afabf9ae2dc498cd039823211c841dd2518ae1541b84d458d89';

let inputData1 = {
    owners: [
        {
            publicKey: new Ed25519PublicKey(publicKey0Base64),
            weight: 1
        },
        {
            publicKey: new Ed25519PublicKey(publicKey1Base64),
            weight: 1
        }
    ],
    threshold: 2,
    // Increased for every new account
    nonce: 1
}
let computedMsafeAddress1 = computeMSafeAddress(inputData1)
assert(computedMsafeAddress1 === msafeAddress1, `Expected ${msafeAddress1}, got ${computedMsafeAddress1}`);
console.log("Additional pk with flag for computedMsafeAddress1", noncePublicKey(inputData1.nonce).publicKey.toIotaPublicKey());
console.log("computedMsafeAddress1", computedMsafeAddress1)
