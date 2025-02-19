import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { MultiSigPublicKey } from '@iota/iota-sdk/multisig';

interface KeysAndAddresses {
    senderKeypair: Ed25519Keypair;
    senderAddress: string;
    sponsorKeypair: Ed25519Keypair;
    sponsorAddress: string;
    multiSigPublicKey: MultiSigPublicKey;
}

// multisigAddress is created from sender and sponsor keys
export function getKeysAndAddresses(testMnemonic: string): KeysAndAddresses {
    const senderKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/0'`);
    const senderPublicKey = senderKeypair.getPublicKey();
    const senderAddress = senderPublicKey.toIotaAddress()

    const sponsorKeypair = Ed25519Keypair.deriveKeypair(testMnemonic, `m/44'/4218'/0'/0'/1'`);
    const sponsorPublicKey = sponsorKeypair.getPublicKey();
    const sponsorAddress = sponsorPublicKey.toIotaAddress()

    const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: 2,
        publicKeys: [
            {
                publicKey: senderPublicKey,
                weight: 1,
            },
            {
                publicKey: sponsorPublicKey,
                weight: 1,
            }
        ],
    });

    return { senderKeypair, senderAddress, sponsorKeypair, sponsorAddress, multiSigPublicKey };
}
