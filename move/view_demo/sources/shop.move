// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// A small shop whose state is exposed through `#[view]` functions, covering
/// the different return shapes: primitive, reference, vector, `Option`,
/// struct, and multiple return values, plus views reading the system `Clock`.
module view_demo::shop;

use iota::clock::Clock;
use std::string::String;

/// A shared shop; one instance is created and shared on publish.
public struct Shop has key {
    id: UID,
    name: String,
    owner: address,
    /// Sale amounts in NANOS, in the order they happened.
    sales: vector<u64>,
    opened_at_ms: u64,
}

/// Snapshot of the shop state, returned by value from `summary`.
public struct ShopSummary has copy, drop {
    name: String,
    owner: address,
    total_revenue: u64,
    sales_count: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Shop {
        id: object::new(ctx),
        name: b"IOTA Merch Store".to_string(),
        owner: ctx.sender(),
        sales: vector[1000, 2500, 500],
        opened_at_ms: ctx.epoch_timestamp_ms(),
    });
}

/// Records a sale, so view results can be observed changing.
public fun record_sale(shop: &mut Shop, amount: u64) {
    shop.sales.push_back(amount);
}

/// Pure view: only primitive arguments, no object access.
#[view]
public fun discounted_price(price: u64, discount_percent: u64): u64 {
    price - (price * discount_percent / 100)
}

/// Returns a primitive value.
#[view]
public fun total_revenue(shop: &Shop): u64 {
    let mut total = 0;
    shop.sales.do_ref!(|amount| total = total + *amount);
    total
}

/// Returns an immutable reference.
#[view]
public fun name(shop: &Shop): &String {
    &shop.name
}

/// Returns a vector.
#[view]
public fun sales(shop: &Shop): vector<u64> {
    shop.sales
}

/// Returns an `Option`: `some` amount, or `none` if `index` is out of range.
#[view]
public fun sale_at(shop: &Shop, index: u64): Option<u64> {
    if (index < shop.sales.length()) {
        option::some(shop.sales[index])
    } else {
        option::none()
    }
}

/// Returns a struct.
#[view]
public fun summary(shop: &Shop): ShopSummary {
    ShopSummary {
        name: shop.name,
        owner: shop.owner,
        total_revenue: total_revenue(shop),
        sales_count: shop.sales.length(),
    }
}

/// Returns multiple values: (total revenue, number of sales, owner).
#[view]
public fun stats(shop: &Shop): (u64, u64, address) {
    (total_revenue(shop), shop.sales.length(), shop.owner)
}

/// Takes an `address` argument.
#[view]
public fun is_owner(shop: &Shop, addr: address): bool {
    shop.owner == addr
}

/// Reads a system object: milliseconds the shop has been open per `clock`.
#[view]
public fun open_for_ms(shop: &Shop, clock: &Clock): u64 {
    clock.timestamp_ms() - shop.opened_at_ms
}
