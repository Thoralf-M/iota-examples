// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Generic `#[view]` functions: the result depends on the provided type
/// arguments, given either alone, with a value argument, or with a generic
/// object.
module view_demo::generics;

use std::type_name;

/// A shared generic container; `Box<u64>` and `Box<String>` instances are
/// created and shared on publish.
public struct Box<T: store> has key {
    id: UID,
    item: T,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(Box { id: object::new(ctx), item: 7u64 });
    transfer::share_object(Box { id: object::new(ctx), item: b"boxed string".to_string() });
}

/// Type argument only — the result depends solely on `T`.
#[view]
public fun type_name_of<T>(): std::ascii::String {
    type_name::get<T>().into_string()
}

/// Generic value argument — `T` must have `copy + drop` to be passed by
/// value.
#[view]
public fun echo<T: copy + drop>(value: T): T {
    value
}

/// Generic object argument with a reference return; the type argument must
/// match the concrete `Box` instance.
#[view]
public fun boxed_item<T: store>(container: &Box<T>): &T {
    &container.item
}
