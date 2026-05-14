#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Address, Bytes, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Value,
    Signed,
    Tag,
    Counter,
    /// Boolean toggle (e.g. feature flag).
    Flag,
    /// 64-bit signed integer.
    WideI,
    /// Small opaque blob (capped length).
    Blob,
    /// 128-bit unsigned integer.
    WideU,
    /// Short interned label (Stellar `Symbol`, max 32 chars).
    Code,
    /// Optional Stellar account / contract address.
    Pointer,
    /// 128-bit signed integer.
    WideI128,
}

/// Maximum bytes accepted by `set_blob` (keeps storage bounded).
const MAX_BLOB_LEN: u32 = 64;

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct ValueSet {
    pub value: u32,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct SignedSet {
    pub v: i32,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct TagSet {
    pub label: String,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct CounterSet {
    pub n: u64,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct FlagSet {
    pub on: bool,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct I64Set {
    pub v: i64,
}

/// Emits the same `Bytes` passed to `set_blob` (capped by `MAX_BLOB_LEN`) for indexer / EVM-style parity.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct BlobSet {
    pub data: Bytes,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct WideU128Set {
    pub v: u128,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct WideI128Set {
    pub v: i128,
}

/// Same UTF-8 string input as `set_symbol` (before interning as `Symbol` in storage).
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct CodeSet {
    pub label: String,
}

/// Same `Option<Address>` as `set_pointer` so event payload matches invocation.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct PointerSet {
    pub who: Option<Address>,
}

#[contract]
pub struct BasicStorageContract;

#[contractimpl]
impl BasicStorageContract {
    pub fn set(env: Env, value: u32) {
        env.storage().persistent().set(&DataKey::Value, &value);

        ValueSet { value }.publish(&env);
    }

    pub fn get(env: Env) -> u32 {
        env.storage().persistent().get(&DataKey::Value).unwrap_or(0)
    }

    /// Stores a signed integer and emits `SignedSet`.
    pub fn set_signed(env: Env, v: i32) {
        env.storage().persistent().set(&DataKey::Signed, &v);
        SignedSet { v }.publish(&env);
    }

    pub fn get_signed(env: Env) -> i32 {
        env.storage()
            .persistent()
            .get(&DataKey::Signed)
            .unwrap_or(0)
    }

    /// Stores a short text label and emits `TagSet` (string payload for indexers).
    pub fn set_tag(env: Env, label: String) {
        env.storage().persistent().set(&DataKey::Tag, &label);
        TagSet {
            label: label.clone(),
        }
        .publish(&env);
    }

    pub fn get_tag(env: Env) -> String {
        env.storage()
            .persistent()
            .get(&DataKey::Tag)
            .unwrap_or_else(|| String::from_str(&env, ""))
    }

    /// Stores a u64 counter and emits `CounterSet`.
    pub fn set_counter(env: Env, n: u64) {
        env.storage().persistent().set(&DataKey::Counter, &n);
        CounterSet { n }.publish(&env);
    }

    pub fn get_counter(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::Counter)
            .unwrap_or(0)
    }

    pub fn set_flag(env: Env, on: bool) {
        env.storage().persistent().set(&DataKey::Flag, &on);
        FlagSet { on }.publish(&env);
    }

    pub fn get_flag(env: Env) -> bool {
        env.storage().persistent().get(&DataKey::Flag).unwrap_or(false)
    }

    pub fn set_i64(env: Env, v: i64) {
        env.storage().persistent().set(&DataKey::WideI, &v);
        I64Set { v }.publish(&env);
    }

    pub fn get_i64(env: Env) -> i64 {
        env.storage().persistent().get(&DataKey::WideI).unwrap_or(0)
    }

    pub fn set_blob(env: Env, data: Bytes) {
        if data.len() > MAX_BLOB_LEN {
            panic!("blob exceeds max length");
        }
        env.storage().persistent().set(&DataKey::Blob, &data);
        BlobSet {
            data: data.clone(),
        }
        .publish(&env);
    }

    pub fn get_blob(env: Env) -> Bytes {
        env.storage()
            .persistent()
            .get(&DataKey::Blob)
            .unwrap_or_else(|| Bytes::new(&env))
    }

    pub fn set_u128(env: Env, v: u128) {
        env.storage().persistent().set(&DataKey::WideU, &v);
        WideU128Set { v }.publish(&env);
    }

    pub fn get_u128(env: Env) -> u128 {
        env.storage().persistent().get(&DataKey::WideU).unwrap_or(0)
    }

    /// Stores a short `Symbol` (interned id; pass UTF-8 bytes that match Symbol rules: `a-zA-Z0-9_`, 1–32 chars).
    pub fn set_symbol(env: Env, label: String) {
        if label.len() == 0 || label.len() > 32 {
            panic!("symbol must be 1..=32 bytes");
        }
        let n = label.len() as usize;
        let mut buf = [0u8; 32];
        label.copy_into_slice(&mut buf[..n]);
        let s = core::str::from_utf8(&buf[..n]).expect("symbol utf8");
        let sym = Symbol::new(&env, s);
        env.storage().persistent().set(&DataKey::Code, &sym);
        CodeSet {
            label: label.clone(),
        }
        .publish(&env);
    }

    pub fn get_symbol(env: Env) -> Symbol {
        env.storage()
            .persistent()
            .get(&DataKey::Code)
            .unwrap_or_else(|| Symbol::new(&env, "_"))
    }

    /// Stores an optional Stellar address (account or contract).
    pub fn set_pointer(env: Env, who: Option<Address>) {
        env.storage().persistent().set(&DataKey::Pointer, &who);
        PointerSet { who: who.clone() }.publish(&env);
    }

    pub fn get_pointer(env: Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Pointer).unwrap_or(None)
    }

    pub fn set_i128(env: Env, v: i128) {
        env.storage().persistent().set(&DataKey::WideI128, &v);
        WideI128Set { v }.publish(&env);
    }

    pub fn get_i128(env: Env) -> i128 {
        env.storage().persistent().get(&DataKey::WideI128).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
