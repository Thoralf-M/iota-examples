module dynamic_fields::dynamic_fields;

use iota::dynamic_field as df;
use iota::dynamic_object_field as dof;

/// The object that we will attach dynamic fields to.
public struct ParentObject has key {
    id: UID
}

public fun new_parent_object(ctx: &mut TxContext): ParentObject {
    ParentObject {
        id: object::new(ctx),
    }
}

/// Get a read-only `uid` field of `ParentObject`.
public fun uid(self: &ParentObject): &UID { &self.id }

/// Get the mutable `id` field of the `ParentObject`.
public fun uid_mut(self: &mut ParentObject): &mut UID { &mut self.id }

public enum Relation has copy, drop, store{
    DynamicField,
    DynamicObjectField
}
public fun new_dynamic_field_relation(): Relation { Relation::DynamicField }
public fun new_dynamic_object_field_relation(): Relation { Relation::DynamicObjectField }

// A child object that can be attached to the parent object as dynamic field and also as dynamic object field.
public struct SomeChildObject has key, store { id: UID, relation: Relation }

// A struct without fields will have dummy_field: bool as value for the dynamic field.
public struct StructWithoutFieldKey has copy, drop, store {}

public fun new_child_object_with_dynamic_field_relation(ctx: &mut TxContext): SomeChildObject {
    SomeChildObject {
        id: object::new(ctx),
        relation: new_dynamic_field_relation(),
    }
}

public fun new_child_object_with_dynamic_object_field_relation(ctx: &mut TxContext): SomeChildObject {
    SomeChildObject {
        id: object::new(ctx),
        relation: new_dynamic_object_field_relation(),
    }
}

fun init(ctx: &mut TxContext) {
    let mut parent_object = new_parent_object(ctx);

    // Dynamic fields, anything with the store ability can be attached

    // Attach a `String` via a `vector<u8>` name
    df::add(&mut parent_object.id, b"vec_u8_key", b"A String value!".to_string());
    // Attach a `vector<u8>` via a `String` name
    df::add(&mut parent_object.id, b"string_key".to_string(), b"A vector<u8> value!");
    // Attach a `u64` via a `u32` name
    df::add(&mut parent_object.id, 42u32, 1_000_000_000u64);
    // Attach a `bool` via a `bool` name
    df::add(&mut parent_object.id, true, false);
    // Attach a `SomeChildObject` via a `vector<u8>` name
    let child_object = new_child_object_with_dynamic_field_relation(ctx);
    df::add(&mut parent_object.id, b"child_key", child_object);
    // Attach a `SomeChildObject` via a `StructWithoutFieldKey` name
    let child_object = new_child_object_with_dynamic_field_relation(ctx);
    df::add(&mut parent_object.id, StructWithoutFieldKey{}, child_object);

    // Dynamic object fields (only objects (key ability) can be attached, no primitives like `bool`, `u64`, etc.)

    // Attach a `SomeChildObject` via a `vector<u8>` name
    let child_object = new_child_object_with_dynamic_object_field_relation(ctx);
    dof::add(&mut parent_object.id, b"child_object_key", child_object);

    // Attach a `SomeChildObject` via a `u8` name, note, for dynamic object fields, we can use the same keys as for a dynamic field again
    let another_child_object = new_child_object_with_dynamic_object_field_relation(ctx);
    dof::add(&mut parent_object.id, 42u8, another_child_object);

    // Attach a `SomeChildObject` via a `StructWithoutFieldKey` name
    let another_child_object = new_child_object_with_dynamic_object_field_relation(ctx);
    dof::add(&mut parent_object.id, StructWithoutFieldKey{}, another_child_object);

    transfer::transfer(parent_object, tx_context::sender(ctx));
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx)
}