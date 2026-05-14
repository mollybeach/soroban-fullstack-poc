import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}






export type DataKey = {tag: "Value", values: void} | {tag: "Signed", values: void} | {tag: "Tag", values: void} | {tag: "Counter", values: void} | {tag: "Flag", values: void} | {tag: "WideI", values: void} | {tag: "Blob", values: void} | {tag: "WideU", values: void} | {tag: "Code", values: void} | {tag: "Pointer", values: void} | {tag: "WideI128", values: void} | {tag: "U32List", values: void} | {tag: "Scores", values: void} | {tag: "PlainAddr", values: void} | {tag: "Nested", values: void} | {tag: "Widget", values: void};






export interface InnerBits {
  x: u32;
}


/**
 * Nested `#[contracttype]` struct (coverage for composite UDT graphs).
 */
export interface OuterBits {
  inner: InnerBits;
  stamp: u64;
}






/**
 * Small user enum stored on-chain (coverage for `#[contracttype]` enums).
 */
export type DemoWidget = {tag: "Off", values: void} | {tag: "On", values: void} | {tag: "Pair", values: readonly [u32, u32]};






export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set: ({value}: {value: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_i64 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_i64: (options?: MethodOptions) => Promise<AssembledTransaction<i64>>

  /**
   * Construct and simulate a get_tag transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_tag: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_i64 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_i64: ({v}: {v: i64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_tag transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores a short text label and emits `TagSet` (string payload for indexers).
   */
  set_tag: ({label}: {label: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_blob transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_blob: (options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a get_flag transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_flag: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_i128 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_i128: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_u128 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_u128: (options?: MethodOptions) => Promise<AssembledTransaction<u128>>

  /**
   * Construct and simulate a set_blob transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_blob: ({data}: {data: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_flag transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_flag: ({on}: {on: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_i128 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_i128: ({v}: {v: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_u128 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_u128: ({v}: {v: u128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_nested transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_nested: (options?: MethodOptions) => Promise<AssembledTransaction<OuterBits>>

  /**
   * Construct and simulate a get_scores transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_scores: (options?: MethodOptions) => Promise<AssembledTransaction<Map<string, u32>>>

  /**
   * Construct and simulate a get_signed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_signed: (options?: MethodOptions) => Promise<AssembledTransaction<i32>>

  /**
   * Construct and simulate a get_symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_symbol: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_widget transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_widget: (options?: MethodOptions) => Promise<AssembledTransaction<DemoWidget>>

  /**
   * Construct and simulate a set_nested transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_nested: ({outer}: {outer: OuterBits}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_scores transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores a bounded string-keyed map (coverage for `Map` + `String` keys).
   */
  set_scores: ({scores}: {scores: Map<string, u32>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_signed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores a signed integer and emits `SignedSet`.
   */
  set_signed: ({v}: {v: i32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores a short `Symbol` (interned id; pass UTF-8 bytes that match Symbol rules: `a-zA-Z0-9_`, 1–32 chars).
   */
  set_symbol: ({label}: {label: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_widget transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_widget: ({w}: {w: DemoWidget}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_counter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_counter: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_pointer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pointer: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_vec_u32 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_vec_u32: (options?: MethodOptions) => Promise<AssembledTransaction<Array<u32>>>

  /**
   * Construct and simulate a set_counter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores a u64 counter and emits `CounterSet`.
   */
  set_counter: ({n}: {n: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_pointer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores an optional Stellar address (account or contract).
   */
  set_pointer: ({who}: {who: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_vec_u32 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores a bounded `Vec<u32>` (empty allowed).
   */
  set_vec_u32: ({items}: {items: Array<u32>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_plain_addr transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_plain_addr: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_plain_addr transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Non-optional `Address` (default read is the burned account when unset).
   */
  set_plain_addr: ({who}: {who: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAABkk2NFNldAAAAAAAAQAAAAdpNjRfc2V0AAAAAAEAAAAAAAAAAXYAAAAAAAAHAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAABlRhZ1NldAAAAAAAAQAAAAd0YWdfc2V0AAAAAAEAAAAAAAAABWxhYmVsAAAAAAAAEAAAAAAAAAAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAEAAAAAAAAAAAAAAABVZhbHVlAAAAAAAAAAAAAAAAAAAGU2lnbmVkAAAAAAAAAAAAAAAAAANUYWcAAAAAAAAAAAAAAAAHQ291bnRlcgAAAAAAAAAAI0Jvb2xlYW4gdG9nZ2xlIChlLmcuIGZlYXR1cmUgZmxhZykuAAAAAARGbGFnAAAAAAAAABY2NC1iaXQgc2lnbmVkIGludGVnZXIuAAAAAAAFV2lkZUkAAAAAAAAAAAAAIlNtYWxsIG9wYXF1ZSBibG9iIChjYXBwZWQgbGVuZ3RoKS4AAAAAAARCbG9iAAAAAAAAABkxMjgtYml0IHVuc2lnbmVkIGludGVnZXIuAAAAAAAABVdpZGVVAAAAAAAAAAAAADZTaG9ydCBpbnRlcm5lZCBsYWJlbCAoU3RlbGxhciBgU3ltYm9sYCwgbWF4IDMyIGNoYXJzKS4AAAAAAARDb2RlAAAAAAAAACxPcHRpb25hbCBTdGVsbGFyIGFjY291bnQgLyBjb250cmFjdCBhZGRyZXNzLgAAAAdQb2ludGVyAAAAAAAAAAAXMTI4LWJpdCBzaWduZWQgaW50ZWdlci4AAAAACFdpZGVJMTI4AAAAAAAAAChCb3VuZGVkIGBWZWM8dTMyPmAgKGNvdmVyYWdlIGZvciBgVmVjYCkuAAAAB1UzMkxpc3QAAAAAAAAAADBCb3VuZGVkIGBNYXA8U3RyaW5nLCB1MzI+YCAoY292ZXJhZ2UgZm9yIGBNYXBgKS4AAAAGU2NvcmVzAAAAAAAAAAAATU5vbi1vcHRpb25hbCBgQWRkcmVzc2AgKGRpc3RpbmN0IGZyb20gYE9wdGlvbjxBZGRyZXNzPmAgb24gdGhlIHBvaW50ZXIgc2xvdCkuAAAAAAAACVBsYWluQWRkcgAAAAAAAAAAAAATTmVzdGVkIHN0cnVjdCBzbG90LgAAAAAGTmVzdGVkAAAAAAAAAAAACkVudW0gc2xvdC4AAAAAAAZXaWRnZXQAAA==",
        "AAAABQAAAGZFbWl0cyB0aGUgc2FtZSBgQnl0ZXNgIHBhc3NlZCB0byBgc2V0X2Jsb2JgIChjYXBwZWQgYnkgYE1BWF9CTE9CX0xFTmApIGZvciBpbmRleGVyIC8gRVZNLXN0eWxlIHBhcml0eS4AAAAAAAAAAAAHQmxvYlNldAAAAAABAAAACGJsb2Jfc2V0AAAAAQAAAAAAAAAEZGF0YQAAAA4AAAAAAAAAAA==",
        "AAAABQAAAFJTYW1lIFVURi04IHN0cmluZyBpbnB1dCBhcyBgc2V0X3N5bWJvbGAgKGJlZm9yZSBpbnRlcm5pbmcgYXMgYFN5bWJvbGAgaW4gc3RvcmFnZSkuAAAAAAAAAAAAB0NvZGVTZXQAAAAAAQAAAAhjb2RlX3NldAAAAAEAAAAAAAAABWxhYmVsAAAAAAAAEAAAAAAAAAAA",
        "AAAABQAAAAAAAAAAAAAAB0ZsYWdTZXQAAAAAAQAAAAhmbGFnX3NldAAAAAEAAAAAAAAAAm9uAAAAAAABAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAACFZhbHVlU2V0AAAAAQAAAAl2YWx1ZV9zZXQAAAAAAAABAAAAAAAAAAV2YWx1ZQAAAAAAAAQAAAAAAAAAAA==",
        "AAAAAQAAAAAAAAAAAAAACUlubmVyQml0cwAAAAAAAAEAAAAAAAAAAXgAAAAAAAAE",
        "AAAAAQAAAEROZXN0ZWQgYCNbY29udHJhY3R0eXBlXWAgc3RydWN0IChjb3ZlcmFnZSBmb3IgY29tcG9zaXRlIFVEVCBncmFwaHMpLgAAAAAAAAAJT3V0ZXJCaXRzAAAAAAAAAgAAAAAAAAAFaW5uZXIAAAAAAAfQAAAACUlubmVyQml0cwAAAAAAAAAAAAAFc3RhbXAAAAAAAAAG",
        "AAAABQAAACFTYW1lIGBPdXRlckJpdHNgIGFzIGBzZXRfbmVzdGVkYC4AAAAAAAAAAAAACU5lc3RlZFNldAAAAAAAAAEAAAAKbmVzdGVkX3NldAAAAAAAAQAAAAAAAAAFb3V0ZXIAAAAAAAfQAAAACU91dGVyQml0cwAAAAAAAAAAAAAA",
        "AAAABQAAAChTYW1lIGBNYXA8U3RyaW5nLCB1MzI+YCBhcyBgc2V0X3Njb3Jlc2AuAAAAAAAAAAlTY29yZXNTZXQAAAAAAAABAAAACnNjb3Jlc19zZXQAAAAAAAEAAAAAAAAABnNjb3JlcwAAAAAD7AAAABAAAAAEAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAACVNpZ25lZFNldAAAAAAAAAEAAAAKc2lnbmVkX3NldAAAAAAAAQAAAAAAAAABdgAAAAAAAAUAAAAAAAAAAA==",
        "AAAABQAAACFTYW1lIGBWZWM8dTMyPmAgYXMgYHNldF92ZWNfdTMyYC4AAAAAAAAAAAAACVZlY1UzMlNldAAAAAAAAAEAAAALdmVjX3UzMl9zZXQAAAAAAQAAAAAAAAAFaXRlbXMAAAAAAAPqAAAABAAAAAAAAAAA",
        "AAAABQAAACJTYW1lIGBEZW1vV2lkZ2V0YCBhcyBgc2V0X3dpZGdldGAuAAAAAAAAAAAACVdpZGdldFNldAAAAAAAAAEAAAAKd2lkZ2V0X3NldAAAAAAAAQAAAAAAAAABdwAAAAAAB9AAAAAKRGVtb1dpZGdldAAAAAAAAAAAAAA=",
        "AAAAAgAAAEdTbWFsbCB1c2VyIGVudW0gc3RvcmVkIG9uLWNoYWluIChjb3ZlcmFnZSBmb3IgYCNbY29udHJhY3R0eXBlXWAgZW51bXMpLgAAAAAAAAAACkRlbW9XaWRnZXQAAAAAAAMAAAAAAAAAAAAAAANPZmYAAAAAAAAAAAAAAAACT24AAAAAAAEAAAAAAAAABFBhaXIAAAACAAAABAAAAAQ=",
        "AAAABQAAAAAAAAAAAAAACkNvdW50ZXJTZXQAAAAAAAEAAAALY291bnRlcl9zZXQAAAAAAQAAAAAAAAABbgAAAAAAAAYAAAAAAAAAAA==",
        "AAAABQAAAExTYW1lIGBPcHRpb248QWRkcmVzcz5gIGFzIGBzZXRfcG9pbnRlcmAgc28gZXZlbnQgcGF5bG9hZCBtYXRjaGVzIGludm9jYXRpb24uAAAAAAAAAApQb2ludGVyU2V0AAAAAAABAAAAC3BvaW50ZXJfc2V0AAAAAAEAAAAAAAAAA3dobwAAAAPoAAAAEwAAAAAAAAAA",
        "AAAABQAAAAAAAAAAAAAAC1dpZGVJMTI4U2V0AAAAAAEAAAANd2lkZV9pMTI4X3NldAAAAAAAAAEAAAAAAAAAAXYAAAAAAAALAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAAC1dpZGVVMTI4U2V0AAAAAAEAAAANd2lkZV91MTI4X3NldAAAAAAAAAEAAAAAAAAAAXYAAAAAAAAKAAAAAAAAAAA=",
        "AAAABQAAACNTYW1lIGBBZGRyZXNzYCBhcyBgc2V0X3BsYWluX2FkZHJgLgAAAAAAAAAADFBsYWluQWRkclNldAAAAAEAAAAOcGxhaW5fYWRkcl9zZXQAAAAAAAEAAAAAAAAAA3dobwAAAAATAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAADc2V0AAAAAAEAAAAAAAAABXZhbHVlAAAAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAHZ2V0X2k2NAAAAAAAAAAAAQAAAAc=",
        "AAAAAAAAAAAAAAAHZ2V0X3RhZwAAAAAAAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAHc2V0X2k2NAAAAAABAAAAAAAAAAF2AAAAAAAABwAAAAA=",
        "AAAAAAAAAEtTdG9yZXMgYSBzaG9ydCB0ZXh0IGxhYmVsIGFuZCBlbWl0cyBgVGFnU2V0YCAoc3RyaW5nIHBheWxvYWQgZm9yIGluZGV4ZXJzKS4AAAAAB3NldF90YWcAAAAAAQAAAAAAAAAFbGFiZWwAAAAAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAAIZ2V0X2Jsb2IAAAAAAAAAAQAAAA4=",
        "AAAAAAAAAAAAAAAIZ2V0X2ZsYWcAAAAAAAAAAQAAAAE=",
        "AAAAAAAAAAAAAAAIZ2V0X2kxMjgAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAIZ2V0X3UxMjgAAAAAAAAAAQAAAAo=",
        "AAAAAAAAAAAAAAAIc2V0X2Jsb2IAAAABAAAAAAAAAARkYXRhAAAADgAAAAA=",
        "AAAAAAAAAAAAAAAIc2V0X2ZsYWcAAAABAAAAAAAAAAJvbgAAAAAAAQAAAAA=",
        "AAAAAAAAAAAAAAAIc2V0X2kxMjgAAAABAAAAAAAAAAF2AAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAIc2V0X3UxMjgAAAABAAAAAAAAAAF2AAAAAAAACgAAAAA=",
        "AAAAAAAAAAAAAAAKZ2V0X25lc3RlZAAAAAAAAAAAAAEAAAfQAAAACU91dGVyQml0cwAAAA==",
        "AAAAAAAAAAAAAAAKZ2V0X3Njb3JlcwAAAAAAAAAAAAEAAAPsAAAAEAAAAAQ=",
        "AAAAAAAAAAAAAAAKZ2V0X3NpZ25lZAAAAAAAAAAAAAEAAAAF",
        "AAAAAAAAAAAAAAAKZ2V0X3N5bWJvbAAAAAAAAAAAAAEAAAAR",
        "AAAAAAAAAAAAAAAKZ2V0X3dpZGdldAAAAAAAAAAAAAEAAAfQAAAACkRlbW9XaWRnZXQAAA==",
        "AAAAAAAAAAAAAAAKc2V0X25lc3RlZAAAAAAAAQAAAAAAAAAFb3V0ZXIAAAAAAAfQAAAACU91dGVyQml0cwAAAAAAAAA=",
        "AAAAAAAAAEdTdG9yZXMgYSBib3VuZGVkIHN0cmluZy1rZXllZCBtYXAgKGNvdmVyYWdlIGZvciBgTWFwYCArIGBTdHJpbmdgIGtleXMpLgAAAAAKc2V0X3Njb3JlcwAAAAAAAQAAAAAAAAAGc2NvcmVzAAAAAAPsAAAAEAAAAAQAAAAA",
        "AAAAAAAAAC5TdG9yZXMgYSBzaWduZWQgaW50ZWdlciBhbmQgZW1pdHMgYFNpZ25lZFNldGAuAAAAAAAKc2V0X3NpZ25lZAAAAAAAAQAAAAAAAAABdgAAAAAAAAUAAAAA",
        "AAAAAAAAAGxTdG9yZXMgYSBzaG9ydCBgU3ltYm9sYCAoaW50ZXJuZWQgaWQ7IHBhc3MgVVRGLTggYnl0ZXMgdGhhdCBtYXRjaCBTeW1ib2wgcnVsZXM6IGBhLXpBLVowLTlfYCwgMeKAkzMyIGNoYXJzKS4AAAAKc2V0X3N5bWJvbAAAAAAAAQAAAAAAAAAFbGFiZWwAAAAAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAAKc2V0X3dpZGdldAAAAAAAAQAAAAAAAAABdwAAAAAAB9AAAAAKRGVtb1dpZGdldAAAAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2NvdW50ZXIAAAAAAAAAAAEAAAAG",
        "AAAAAAAAAAAAAAALZ2V0X3BvaW50ZXIAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAALZ2V0X3ZlY191MzIAAAAAAAAAAAEAAAPqAAAABA==",
        "AAAAAAAAACxTdG9yZXMgYSB1NjQgY291bnRlciBhbmQgZW1pdHMgYENvdW50ZXJTZXRgLgAAAAtzZXRfY291bnRlcgAAAAABAAAAAAAAAAFuAAAAAAAABgAAAAA=",
        "AAAAAAAAADlTdG9yZXMgYW4gb3B0aW9uYWwgU3RlbGxhciBhZGRyZXNzIChhY2NvdW50IG9yIGNvbnRyYWN0KS4AAAAAAAALc2V0X3BvaW50ZXIAAAAAAQAAAAAAAAADd2hvAAAAA+gAAAATAAAAAA==",
        "AAAAAAAAACxTdG9yZXMgYSBib3VuZGVkIGBWZWM8dTMyPmAgKGVtcHR5IGFsbG93ZWQpLgAAAAtzZXRfdmVjX3UzMgAAAAABAAAAAAAAAAVpdGVtcwAAAAAAA+oAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAAOZ2V0X3BsYWluX2FkZHIAAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAEdOb24tb3B0aW9uYWwgYEFkZHJlc3NgIChkZWZhdWx0IHJlYWQgaXMgdGhlIGJ1cm5lZCBhY2NvdW50IHdoZW4gdW5zZXQpLgAAAAAOc2V0X3BsYWluX2FkZHIAAAAAAAEAAAAAAAAAA3dobwAAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<u32>,
        set: this.txFromJSON<null>,
        get_i64: this.txFromJSON<i64>,
        get_tag: this.txFromJSON<string>,
        set_i64: this.txFromJSON<null>,
        set_tag: this.txFromJSON<null>,
        get_blob: this.txFromJSON<Buffer>,
        get_flag: this.txFromJSON<boolean>,
        get_i128: this.txFromJSON<i128>,
        get_u128: this.txFromJSON<u128>,
        set_blob: this.txFromJSON<null>,
        set_flag: this.txFromJSON<null>,
        set_i128: this.txFromJSON<null>,
        set_u128: this.txFromJSON<null>,
        get_nested: this.txFromJSON<OuterBits>,
        get_scores: this.txFromJSON<Map<string, u32>>,
        get_signed: this.txFromJSON<i32>,
        get_symbol: this.txFromJSON<string>,
        get_widget: this.txFromJSON<DemoWidget>,
        set_nested: this.txFromJSON<null>,
        set_scores: this.txFromJSON<null>,
        set_signed: this.txFromJSON<null>,
        set_symbol: this.txFromJSON<null>,
        set_widget: this.txFromJSON<null>,
        get_counter: this.txFromJSON<u64>,
        get_pointer: this.txFromJSON<Option<string>>,
        get_vec_u32: this.txFromJSON<Array<u32>>,
        set_counter: this.txFromJSON<null>,
        set_pointer: this.txFromJSON<null>,
        set_vec_u32: this.txFromJSON<null>,
        get_plain_addr: this.txFromJSON<string>,
        set_plain_addr: this.txFromJSON<null>
  }
}