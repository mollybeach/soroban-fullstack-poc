#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Env, String,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Value,
    Signed,
    Tag,
    Counter,
}

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
        env.storage().persistent().get(&DataKey::Signed).unwrap_or(0)
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
        env.storage().persistent().get(&DataKey::Counter).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
