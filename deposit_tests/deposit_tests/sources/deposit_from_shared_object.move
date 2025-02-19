module deposit_tests::deposit_from_shared_object;

use iota::coin::Coin;
use iota::transfer::{Receiving};
use iota::iota::IOTA;

/// Coins, anyone can deposit and transfer.
public struct SharedCoins has key {
    id: UID,
    coins: vector<Coin<IOTA>>
}

/// Helper to create a SharedCoins object already when publishing.
fun init(ctx: &mut TxContext){
    create(ctx);
}

/// Create and share a SharedCoins object.
public fun create(ctx: &mut TxContext) {
    transfer::share_object(SharedCoins {
        id: object::new(ctx),
        coins: vector[],
    })
}

/// Delete a SharedCoins object, works only if there are no coins anymore.
public fun delete(shared_coins: SharedCoins) {
    let SharedCoins {id, coins} = shared_coins;
    id.delete();
    vector::destroy_empty(coins);
}

/// Deposit (receive) a coin to the SharedCoins object.
public fun deposit_coin(
    obj: &mut SharedCoins,
    coin: Receiving<Coin<IOTA>>,
) {
    let coin: Coin<IOTA> = transfer::public_receive(&mut obj.id, coin);
    vector::push_back(&mut obj.coins, coin);
}

/// Transfer a coin from the SharedCoins object.
public fun transfer_coin(
    obj: &mut SharedCoins,
    recipient: address,
) {
    let coin = vector::pop_back(&mut obj.coins);
    transfer::public_transfer(coin, recipient)
}
