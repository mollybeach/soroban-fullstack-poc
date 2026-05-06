extern crate std;

use super::*;
use soroban_sdk::Env;

#[test]
fn test_set_and_get_value() {
    let env = Env::default();

    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    assert_eq!(client.get(), 0);

    client.set(&42);

    assert_eq!(client.get(), 42);
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
