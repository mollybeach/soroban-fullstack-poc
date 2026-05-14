extern crate std;

use super::*;
use proptest::prelude::*;
use soroban_sdk::{Address, Bytes, Env, Map, String, Symbol, Vec};

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
fn set_flag_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert!(!client.get_flag());
    client.set_flag(&true);
    assert!(client.get_flag());
    client.set_flag(&false);
    assert!(!client.get_flag());
}

#[test]
fn set_i64_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_i64(), 0);
    client.set_i64(&-9_223_372_036_854_775_808i64);
    assert_eq!(client.get_i64(), i64::MIN);
    client.set_i64(&9_223_372_036_854_775_807i64);
    assert_eq!(client.get_i64(), i64::MAX);
}

#[test]
fn set_blob_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_blob().len(), 0u32);
    let b = Bytes::from_array(&env, &[1u8, 2, 3]);
    client.set_blob(&b);
    assert_eq!(client.get_blob(), b);
}

#[test]
fn set_u128_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_u128(), 0u128);
    client.set_u128(&340282366920938463463374607431768211455u128);
    assert_eq!(client.get_u128(), 340282366920938463463374607431768211455u128);
}

#[test]
fn set_symbol_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    let label = String::from_str(&env, "POC");
    client.set_symbol(&label);
    assert_eq!(client.get_symbol(), Symbol::new(&env, "POC"));
}

#[test]
fn set_pointer_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_pointer(), None);
    let addr = Address::from_str(
        &env,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    );
    client.set_pointer(&Some(addr.clone()));
    assert_eq!(client.get_pointer(), Some(addr));
    client.set_pointer(&None);
    assert_eq!(client.get_pointer(), None);
}

#[test]
fn set_i128_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_i128(), 0i128);
    client.set_i128(&-170141183460469231731687303715884105728i128);
    assert_eq!(client.get_i128(), i128::MIN);
    client.set_i128(&170141183460469231731687303715884105727i128);
    assert_eq!(client.get_i128(), i128::MAX);
}

#[test]
fn set_vec_u32_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_vec_u32().len(), 0u32);
    let mut v = Vec::new(&env);
    v.push_back(2);
    v.push_back(3);
    client.set_vec_u32(&v);
    assert_eq!(client.get_vec_u32(), v);
}

#[test]
fn set_scores_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get_scores().len(), 0u32);
    let mut m = Map::new(&env);
    m.set(String::from_str(&env, "a"), 1u32);
    m.set(String::from_str(&env, "b"), 2u32);
    client.set_scores(&m);
    assert_eq!(client.get_scores(), m);
}

#[test]
fn set_plain_addr_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    let burn = Address::from_str(
        &env,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    );
    assert_eq!(client.get_plain_addr(), burn);
    let addr = contract_id.clone();
    client.set_plain_addr(&addr);
    assert_eq!(client.get_plain_addr(), addr);
}

#[test]
fn set_nested_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    let outer = OuterBits {
        inner: InnerBits { x: 7 },
        stamp: 99,
    };
    client.set_nested(&outer);
    let got = client.get_nested();
    assert!(got == outer);
}

#[test]
fn set_widget_get_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert!(client.get_widget() == DemoWidget::Off);
    client.set_widget(&DemoWidget::On);
    assert!(client.get_widget() == DemoWidget::On);
    client.set_widget(&DemoWidget::Pair(4u32, 5u32));
    assert!(client.get_widget() == DemoWidget::Pair(4u32, 5u32));
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

proptest! {
    #![proptest_config(ProptestConfig {
        cases: 32,
        .. ProptestConfig::default()
    })]

    #[test]
    fn invariant_flag_last_write_visible_on_get_flag(
        values in prop::collection::vec(any::<bool>(), 1..24usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = false;
        for &v in &values {
            client.set_flag(&v);
            expected = v;
        }
        prop_assert_eq!(client.get_flag(), expected);
    }

    #[test]
    fn invariant_i64_last_write_visible(
        values in prop::collection::vec(any::<i64>(), 1..20usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = 0i64;
        for v in &values {
            client.set_i64(v);
            expected = *v;
        }
        prop_assert_eq!(client.get_i64(), expected);
    }

    #[test]
    fn invariant_u128_last_write_visible(
        values in prop::collection::vec(any::<u128>(), 1..12usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = 0u128;
        for v in &values {
            client.set_u128(v);
            expected = *v;
        }
        prop_assert_eq!(client.get_u128(), expected);
    }

    #[test]
    fn invariant_i128_last_write_visible(
        values in prop::collection::vec(any::<i128>(), 1..12usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = 0i128;
        for v in &values {
            client.set_i128(v);
            expected = *v;
        }
        prop_assert_eq!(client.get_i128(), expected);
    }

    #[test]
    fn invariant_blob_last_write_visible(
        chunks in prop::collection::vec(
            prop::collection::vec(any::<u8>(), 0..=32usize),
            1..8usize
        )
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut expected = Bytes::new(&env);
        for bytes in &chunks {
            let b = Bytes::from_slice(&env, bytes.as_slice());
            client.set_blob(&b);
            expected = b;
        }
        prop_assert_eq!(client.get_blob(), expected);
    }

    #[test]
    fn invariant_symbol_last_write_visible(
        labels in prop::collection::vec(
            prop_oneof![
                Just("a"),
                Just("ab"),
                Just("Z9"),
                Just("POC"),
                Just("type_x"),
            ],
            1..10usize
        )
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let mut last = "";
        for s in &labels {
            let st = String::from_str(&env, s);
            client.set_symbol(&st);
            last = s;
        }
        prop_assert_eq!(client.get_symbol(), Symbol::new(&env, last));
    }

    #[test]
    fn invariant_pointer_optional_last_write_matches_sequence(
        present in prop::collection::vec(any::<bool>(), 1..18usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        let addr = Address::from_str(
            &env,
            "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        );
        let mut expected: Option<Address> = None;
        for &p in &present {
            if p {
                client.set_pointer(&Some(addr.clone()));
                expected = Some(addr.clone());
            } else {
                client.set_pointer(&None);
                expected = None;
            }
        }
        prop_assert_eq!(client.get_pointer(), expected);
    }

    /// `u32` anchor unchanged while only mutating `u128`.
    #[test]
    fn invariant_primary_unchanged_under_u128_only_writes(
        anchor in any::<u32>(),
        values in prop::collection::vec(any::<u128>(), 1..10usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        client.set(&anchor);
        let mut last = 0u128;
        for v in &values {
            client.set_u128(v);
            prop_assert_eq!(client.get(), anchor);
            last = *v;
        }
        prop_assert_eq!(client.get_u128(), last);
    }

    /// `i128` anchor unchanged while only mutating `flag`.
    #[test]
    fn invariant_i128_wide_unchanged_under_flag_only_writes(
        anchor in any::<i128>(),
        flags in prop::collection::vec(any::<bool>(), 1..14usize)
    ) {
        let env = Env::default();
        let contract_id = env.register(BasicStorageContract, ());
        let client = BasicStorageContractClient::new(&env, &contract_id);

        client.set_i128(&anchor);
        let mut last = false;
        for &f in &flags {
            client.set_flag(&f);
            prop_assert_eq!(client.get_i128(), anchor);
            last = f;
        }
        prop_assert_eq!(client.get_flag(), last);
    }
}
