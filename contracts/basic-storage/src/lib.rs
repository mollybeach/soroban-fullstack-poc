#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Address, Bytes, Env, Map, String, Symbol,
    Vec,
};

#[contracttype]
#[derive(Clone, PartialEq)]
pub struct InnerBits {
    pub x: u32,
}

/// Nested `#[contracttype]` struct (coverage for composite UDT graphs).
#[contracttype]
#[derive(Clone, PartialEq)]
pub struct OuterBits {
    pub inner: InnerBits,
    pub stamp: u64,
}

/// Small user enum stored on-chain (coverage for `#[contracttype]` enums).
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum DemoWidget {
    Off,
    On,
    Pair(u32, u32),
}

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
    /// Bounded `Vec<u32>` (coverage for `Vec`).
    U32List,
    /// Bounded `Map<String, u32>` (coverage for `Map`).
    Scores,
    /// Non-optional `Address` (distinct from `Option<Address>` on the pointer slot).
    PlainAddr,
    /// Nested struct slot.
    Nested,
    /// Enum slot.
    Widget,
}

/// Maximum bytes accepted by `set_blob` (keeps storage bounded).
const MAX_BLOB_LEN: u32 = 64;

const MAX_VEC_U32: u32 = 16;
const MAX_MAP_ENTRIES: u32 = 8;
const MAX_MAP_KEY_LEN: u32 = 24;

fn default_burn_addr(env: &Env) -> Address {
    Address::from_str(
        env,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    )
}

fn default_outer(_env: &Env) -> OuterBits {
    OuterBits {
        inner: InnerBits { x: 0 },
        stamp: 0,
    }
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

/// Same `Vec<u32>` as `set_vec_u32`.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct VecU32Set {
    pub items: Vec<u32>,
}

/// Same `Map<String, u32>` as `set_scores`.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct ScoresSet {
    pub scores: Map<String, u32>,
}

/// Same `Address` as `set_plain_addr`.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct PlainAddrSet {
    pub who: Address,
}

/// Same `OuterBits` as `set_nested`.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct NestedSet {
    pub outer: OuterBits,
}

/// Same `DemoWidget` as `set_widget`.
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct WidgetSet {
    pub w: DemoWidget,
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

    /// Stores a bounded `Vec<u32>` (empty allowed).
    pub fn set_vec_u32(env: Env, items: Vec<u32>) {
        if items.len() > MAX_VEC_U32 {
            panic!("vec too long");
        }
        env.storage().persistent().set(&DataKey::U32List, &items);
        VecU32Set {
            items: items.clone(),
        }
        .publish(&env);
    }

    pub fn get_vec_u32(env: Env) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::U32List)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Stores a bounded string-keyed map (coverage for `Map` + `String` keys).
    pub fn set_scores(env: Env, scores: Map<String, u32>) {
        if scores.len() > MAX_MAP_ENTRIES {
            panic!("map too large");
        }
        for (k, _v) in scores.iter() {
            if k.len() == 0 || k.len() > MAX_MAP_KEY_LEN {
                panic!("bad map key length");
            }
        }
        env.storage().persistent().set(&DataKey::Scores, &scores);
        ScoresSet {
            scores: scores.clone(),
        }
        .publish(&env);
    }

    pub fn get_scores(env: Env) -> Map<String, u32> {
        env.storage()
            .persistent()
            .get(&DataKey::Scores)
            .unwrap_or_else(|| Map::new(&env))
    }

    /// Non-optional `Address` (default read is the burned account when unset).
    pub fn set_plain_addr(env: Env, who: Address) {
        env.storage().persistent().set(&DataKey::PlainAddr, &who);
        PlainAddrSet { who: who.clone() }.publish(&env);
    }

    pub fn get_plain_addr(env: Env) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::PlainAddr)
            .unwrap_or_else(|| default_burn_addr(&env))
    }

    pub fn set_nested(env: Env, outer: OuterBits) {
        env.storage().persistent().set(&DataKey::Nested, &outer);
        NestedSet {
            outer: outer.clone(),
        }
        .publish(&env);
    }

    pub fn get_nested(env: Env) -> OuterBits {
        env.storage()
            .persistent()
            .get(&DataKey::Nested)
            .unwrap_or_else(|| default_outer(&env))
    }

    pub fn set_widget(env: Env, w: DemoWidget) {
        env.storage().persistent().set(&DataKey::Widget, &w);
        WidgetSet { w: w.clone() }.publish(&env);
    }

    pub fn get_widget(env: Env) -> DemoWidget {
        env.storage()
            .persistent()
            .get(&DataKey::Widget)
            .unwrap_or(DemoWidget::Off)
    }
}

#[cfg(test)]
mod test;
