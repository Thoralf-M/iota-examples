#[test_only]
module dynamic_fields::dynamic_fields_tests;
use dynamic_fields::dynamic_fields::{init_for_testing, SomeChildObject, new_parent_object, new_child_object_with_dynamic_field_relation};
use iota::dynamic_field as df;

#[test]
fun test_dynamic_fields() {
    let ctx = &mut tx_context::dummy();
    let mut parent = new_parent_object(ctx);

    let field_key: vector<u8> = b"field_key";
    // Attach a SomeChildObject to the parent's UID
    df::add(
         parent.uid_mut(),
        field_key,
        new_child_object_with_dynamic_field_relation(ctx)
    );

    // Check that the SomeChildObject is attached to the parent
    assert!(df::exists_(parent.uid(), field_key), 0);

    // Remove the SomeChildObject from the parent
    let child_object: SomeChildObject = df::remove(parent.uid_mut(), field_key);

    iota::test_utils::destroy(parent);
    iota::test_utils::destroy(child_object);
}

use iota::test_scenario as ts;
const OWNER: address = @0xAD;

    #[test]
    public fun test_module_init() {
        let mut ts = ts::begin(@0x0);

        // first transaction to emulate module initialization.
        {
            ts::next_tx(&mut ts, OWNER);
            init_for_testing(ts::ctx(&mut ts));
        };

        ts::end(ts);
    }