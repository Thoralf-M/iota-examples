import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

const testMnemonic = 'remove vessel lens oak junk view cancel say fatal hotel swamp cool true mean basic year shoe chat obey ozone hand blade toe good'
const keypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
const address = keypair.getPublicKey().toIotaAddress();
console.log(address)


const testSeed = '2cde01e4766948c8f4cbd2f0a5c82f0d55154d478f291eafb457d4b5e264cf866be67b6d9374aff7cd840f1d71e4664e9e5ef2f233fc9834e0583ecac9e04244'
const seedKeypair = Ed25519Keypair.deriveKeypairFromSeed(testSeed, `m/44'/4218'/0'/0'/0'`)
const addr = seedKeypair.getPublicKey().toIotaAddress();
console.log(addr)


let { bech32 } = require('bech32')

const bech32AddressToHexAddress = (bech32Address: string) => {
    let decoded = bech32.decode(bech32Address);
    let addressBytes = bech32.fromWords(decoded.words)
    // Remove prefix byte
    addressBytes.shift()
    return '0x' + bytesToHex(addressBytes)
}

const bytesToHex = (value: number[]): string => {
    return value.map(v => v.toString(16).padStart(2, '0')).join('');
}

let hexAddress = bech32AddressToHexAddress('iota1qzvn3j20gyvp2wa76z83ftn5uf2hzuj59avm7zm6xphfn4dqkzykuqrmcue')
console.log(hexAddress)
