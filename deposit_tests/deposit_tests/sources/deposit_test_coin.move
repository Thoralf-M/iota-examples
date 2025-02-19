module deposit_tests::deposit_test_coin;

use iota::coin::{Self, TreasuryCap};

// The type identifier of coin. The coin will have a type
// tag of kind: `Coin<package_object::deposit_test_coin::DEPOSIT_TEST_COIN>`
public struct DEPOSIT_TEST_COIN has drop {}

// Module initializer is called once on module publish. A treasury
// cap is sent to the publisher, who then controls minting and burning.
fun init(witness: DEPOSIT_TEST_COIN, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(witness, 9, b"DEPOSIT_TEST_COIN", b"", b"", option::none(), ctx);
    transfer::public_freeze_object(metadata);
    transfer::public_transfer(treasury, ctx.sender())
}

// Create DEPOSIT_TEST_COINs using the TreasuryCap.
public fun mint(
    treasury_cap: &mut TreasuryCap<DEPOSIT_TEST_COIN>, 
    amount: u64, 
    recipient: address, 
    ctx: &mut TxContext,
) {
    let coin = coin::mint(treasury_cap, amount, ctx);
    transfer::public_transfer(coin, recipient)
}
