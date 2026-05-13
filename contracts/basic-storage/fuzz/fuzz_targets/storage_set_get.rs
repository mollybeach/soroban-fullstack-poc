#![no_main]

//! LibFuzzer harness: decode `u32` / `i64` / `u128` / `bool` / short `Bytes` from the input and assert
//! round-trips on independent storage slots.
//! Run from `contracts/basic-storage/fuzz`: `cargo fuzz run storage_set_get`

use basic_storage::{BasicStorageContract, BasicStorageContractClient};
use libfuzzer_sys::fuzz_target;
use soroban_sdk::{Bytes, Env};

fuzz_target!(|data: &[u8]| {
    let env = Env::default();
    let contract_id = env.register(BasicStorageContract, ());
    let client = BasicStorageContractClient::new(&env, &contract_id);

    if data.len() >= 4 {
        let value = u32::from_le_bytes(data[0..4].try_into().unwrap());
        client.set(&value);
        assert_eq!(client.get(), value);
    }

    if data.len() >= 12 {
        let i = i64::from_le_bytes(data[4..12].try_into().unwrap());
        client.set_i64(&i);
        assert_eq!(client.get_i64(), i);
    }

    if data.len() >= 28 {
        let w = u128::from_le_bytes(data[12..28].try_into().unwrap());
        client.set_u128(&w);
        assert_eq!(client.get_u128(), w);
    }

    if data.len() >= 29 {
        client.set_flag(&(data[28] & 1 == 1));
        assert_eq!(client.get_flag(), data[28] & 1 == 1);
    }

    if data.len() >= 30 {
        let n = (data[29] as usize) % 65;
        let end = 30usize.saturating_add(n).min(data.len());
        let slice = &data[30..end];
        let blob = Bytes::from_slice(&env, slice);
        client.set_blob(&blob);
        assert_eq!(client.get_blob(), blob);
    }
});
