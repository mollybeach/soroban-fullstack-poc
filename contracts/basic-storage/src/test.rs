extern crate std;

use super::*;
use proptest::prelude::*;
use soroban_sdk::Env;

// --- Unit tests (getter / setter) ---

#[test]
fn get_returns_zero_before_first_set() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);
    assert_eq!(client.get(), 0);
}

#[test]
fn set_then_get_roundtrip_known_value() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get(), 0);

    client.set(&42);

    assert_eq!(client.get(), 42);
}

#[test]
fn set_max_u32_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    client.set(&u32::MAX);
    assert_eq!(client.get(), u32::MAX);
}

#[test]
fn sequential_sets_overwrite_previous_value() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    client.set(&1);
    assert_eq!(client.get(), 1);
    client.set(&2);
    assert_eq!(client.get(), 2);
}

#[test]
fn set_signed_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_signed(), 0);
    client.set_signed(&-17i32);
    assert_eq!(client.get_signed(), -17);
}

#[test]
fn set_tag_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    let label = String::from_str(&env, "hello-events");
    client.set_tag(&label);
    assert_eq!(client.get_tag(), label);
}

#[test]
fn set_counter_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    client.set_counter(&99u64);
    assert_eq!(client.get_counter(), 99);
}

#[test]
fn property_set_get_roundtrip_for_many_values() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    for value in 0u32..100u32 {
        client.set(&value);
        assert_eq!(client.get(), value);
    }
}

// --- Property-based fuzz-style test (random `u32` each case) ---

proptest! {
    #![proptest_config(ProptestConfig {
        cases: 256,
        .. ProptestConfig::default()
    })]

    #[test]
    fn fuzz_set_get_random_u32(value in any::<u32>()) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        client.set(&value);
        prop_assert_eq!(client.get(), value);
    }
}

// --- Invariant: after any non-empty sequence of sets, get() == last set value ---

proptest! {
    #![proptest_config(ProptestConfig {
        cases: 64,
        .. ProptestConfig::default()
    })]

    #[test]
    fn invariant_last_write_visible_on_get(
        values in prop::collection::vec(any::<u32>(), 1..40usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = 0u32;
        for v in &values {
            client.set(v);
            expected = *v;
        }
        prop_assert_eq!(client.get(), expected);
    }
}
