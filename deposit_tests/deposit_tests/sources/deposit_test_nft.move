module deposit_tests::deposit_test_nft;

use std::string;

public struct DepositTestNFT has key, store {
    id: UID,
    description: string::String,
}

public fun mint(
    recipient: address,
    ctx: &mut TxContext
) {
    let nft = DepositTestNFT {
        id: object::new(ctx),
        description: string::utf8(b"NFT to test deposits"),
    };
    transfer::public_transfer(nft, recipient);
}
