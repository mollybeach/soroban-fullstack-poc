#![no_main]

//! LibFuzzer harness: random 4-byte chunks decode to a `u32` passed to `set`; we assert `get` matches.
//! Run from `contracts/basic-storage/fuzz`: `cargo fuzz run storage_set_get`

use basic_storage::{BasicStorageContract, BasicStorageContractClient};
use libfuzzer_sys::fuzz_target;
use soroban_sdk::Env;

fuzz_target!(|data: &[u8]| {
    if data.len() < 4 {
        return;
    }
    let mut b = [0u8; 4];
    b.copy_from_slice(&data[..4]);
    let value = u32::from_le_bytes(b);

    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    client.set(&value);
    assert_eq!(client.get(), value);
});
