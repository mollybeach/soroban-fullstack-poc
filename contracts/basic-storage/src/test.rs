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

// --- Invariants (Proptest): last-write wins and cross-slot isolation ---

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

proptest! {
    #![proptest_config(ProptestConfig {
        cases: 48,
        .. ProptestConfig::default()
    })]

    /// After any non-empty sequence of `set_signed`, `get_signed` equals the last value written.
    #[test]
    fn invariant_signed_last_write_visible_on_get_signed(
        values in prop::collection::vec(any::<i32>(), 1..32usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = 0i32;
        for v in &values {
            client.set_signed(v);
            expected = *v;
        }
        prop_assert_eq!(client.get_signed(), expected);
    }

    /// After any non-empty sequence of `set_counter`, `get_counter` equals the last value written.
    #[test]
    fn invariant_counter_last_write_visible_on_get_counter(
        values in prop::collection::vec(any::<u64>(), 1..32usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = 0u64;
        for v in &values {
            client.set_counter(v);
            expected = *v;
        }
        prop_assert_eq!(client.get_counter(), expected);
    }

    /// Primary `u32` slot stays fixed while only the signed slot is written; signed still last-write wins.
    #[test]
    fn invariant_primary_unchanged_under_signed_only_writes(
        anchor in any::<u32>(),
        signed_values in prop::collection::vec(any::<i32>(), 1..36usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        client.set(&anchor);
        let mut last = 0i32;
        for v in &signed_values {
            client.set_signed(v);
            prop_assert_eq!(client.get(), anchor);
            last = *v;
        }
        prop_assert_eq!(client.get_signed(), last);
    }

    /// Signed slot stays fixed while only the primary slot is written; primary still last-write wins.
    #[test]
    fn invariant_signed_unchanged_under_primary_only_writes(
        anchor in any::<i32>(),
        primary_values in prop::collection::vec(any::<u32>(), 1..36usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        client.set_signed(&anchor);
        let mut last = 0u32;
        for v in &primary_values {
            client.set(v);
            prop_assert_eq!(client.get_signed(), anchor);
            last = *v;
        }
        prop_assert_eq!(client.get(), last);
    }
}
