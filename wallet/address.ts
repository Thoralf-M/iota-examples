import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { decodeIotaPrivateKey } from '@iota/iota-sdk/cryptography';

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const keypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const address = keypair.getPublicKey().toIotaAddress();
console.log(address)

const testSeed = '2cde01e4766948c8f4cbd2f0a5c82f0d55154d478f291eafb457d4b5e264cf866be67b6d9374aff7cd840f1d71e4664e9e5ef2f233fc9834e0583ecac9e04244'
const seedKeypair = Ed25519Keypair.deriveKeypairFromSeed(testSeed, `m/44'/4218'/0'/0'/0'`)
const addr = seedKeypair.getPublicKey().toIotaAddress();
console.log(addr)

const parsed = decodeIotaPrivateKey("iotaprivkey1qrskdrlmprcf8fj2l4s9dgcpp5yuqy09n2ydvcxujurc96aqvwq7zn76p7f");
const keypairPrivKey = Ed25519Keypair.fromSecretKey(parsed.secretKey);
const add = keypairPrivKey.getPublicKey().toIotaAddress();
console.log(add)


// import { Secp256k1Keypair } from '@iota/iota-sdk/keypairs/secp256k1';
// const keypair = Secp256k1Keypair.generate();
// const address = keypair.getPublicKey().toIotaAddress();
// console.log(address)