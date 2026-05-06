#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Value,
}

#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct ValueSet {
    pub value: u32,
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
}

#[cfg(test)]
mod test;
