//! Integration-style tests: multi-step flows against the deployed contract type in a single `Env`.
//! Complements unit tests in `src/test.rs` (separate test binary is the conventional Rust layout).

use basic_storage::{BasicStorageContract, BasicStorageContractClient};
use soroban_sdk::Env;

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
