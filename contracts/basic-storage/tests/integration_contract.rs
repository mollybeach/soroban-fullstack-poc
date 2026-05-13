//! Integration-style tests: multi-step flows against the deployed contract type in a single `Env`.
//! Complements unit tests in `src/test.rs` (separate test binary is the conventional Rust layout).

use basic_storage::{BasicStorageContract, BasicStorageContractClient};
use soroban_sdk::{Address, Bytes, Env, String, Symbol};

#[test]
fn integration_alternating_writes_read_as_last_value() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    client.set(&100u32);
    assert_eq!(client.get(), 100);

    client.set(&200u32);
    assert_eq!(client.get(), 200);

    client.set(&0u32);
    assert_eq!(client.get(), 0);
}

#[test]
fn integration_sequence_matches_property_last_write_wins() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    let sequence = [7u32, 14, 21, 42];
    for v in sequence {
        client.set(&v);
        assert_eq!(client.get(), v);
    }
}

#[test]
fn integration_multi_slot_roundtrip_and_isolation() {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    client.set(&99u32);
    client.set_signed(&-5i32);
    client.set_flag(&true);
    client.set_i64(&-1_000i64);
    client.set_u128(&(u128::MAX - 7));
    client.set_i128(&(i128::MIN + 3));
    let blob = Bytes::from_slice(&env, &[1u8, 2, 3, 4, 5]);
    client.set_blob(&blob);
    let label = String::from_str(&env, "POC");
    client.set_symbol(&label);
    let addr = Address::from_str(
        &env,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    );
    client.set_pointer(&Some(addr.clone()));

    assert_eq!(client.get(), 99);
    assert_eq!(client.get_signed(), -5);
    assert!(client.get_flag());
    assert_eq!(client.get_i64(), -1_000);
    assert_eq!(client.get_u128(), u128::MAX - 7);
    assert_eq!(client.get_i128(), i128::MIN + 3);
    assert_eq!(client.get_blob(), blob);
    assert_eq!(client.get_symbol(), Symbol::new(&env, "POC"));
    assert_eq!(client.get_pointer(), Some(addr));

    client.set(&100u32);
    assert_eq!(client.get(), 100);
    assert_eq!(client.get_signed(), -5);
    assert_eq!(client.get_i128(), i128::MIN + 3);
}
