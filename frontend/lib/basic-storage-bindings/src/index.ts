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






export type DataKey = {tag: "Value", values: void} | {tag: "Signed", values: void} | {tag: "Tag", values: void} | {tag: "Counter", values: void} | {tag: "Flag", values: void} | {tag: "WideI", values: void} | {tag: "Blob", values: void} | {tag: "WideU", values: void} | {tag: "Code", values: void} | {tag: "Pointer", values: void} | {tag: "WideI128", values: void};










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
   * Construct and simulate a get_signed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_signed: (options?: MethodOptions) => Promise<AssembledTransaction<i32>>

  /**
   * Construct and simulate a get_symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_symbol: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

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
   * Construct and simulate a get_counter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_counter: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_pointer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pointer: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

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
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACwAAAAAAAAAAAAAABVZhbHVlAAAAAAAAAAAAAAAAAAAGU2lnbmVkAAAAAAAAAAAAAAAAAANUYWcAAAAAAAAAAAAAAAAHQ291bnRlcgAAAAAAAAAAI0Jvb2xlYW4gdG9nZ2xlIChlLmcuIGZlYXR1cmUgZmxhZykuAAAAAARGbGFnAAAAAAAAABY2NC1iaXQgc2lnbmVkIGludGVnZXIuAAAAAAAFV2lkZUkAAAAAAAAAAAAAIlNtYWxsIG9wYXF1ZSBibG9iIChjYXBwZWQgbGVuZ3RoKS4AAAAAAARCbG9iAAAAAAAAABkxMjgtYml0IHVuc2lnbmVkIGludGVnZXIuAAAAAAAABVdpZGVVAAAAAAAAAAAAADZTaG9ydCBpbnRlcm5lZCBsYWJlbCAoU3RlbGxhciBgU3ltYm9sYCwgbWF4IDMyIGNoYXJzKS4AAAAAAARDb2RlAAAAAAAAACxPcHRpb25hbCBTdGVsbGFyIGFjY291bnQgLyBjb250cmFjdCBhZGRyZXNzLgAAAAdQb2ludGVyAAAAAAAAAAAXMTI4LWJpdCBzaWduZWQgaW50ZWdlci4AAAAACFdpZGVJMTI4",
        "AAAABQAAAAAAAAAAAAAAB0Jsb2JTZXQAAAAAAQAAAAhibG9iX3NldAAAAAEAAAAAAAAAA2xlbgAAAAAEAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAAB0NvZGVTZXQAAAAAAQAAAAhjb2RlX3NldAAAAAEAAAAAAAAAA2xlbgAAAAAEAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAAB0ZsYWdTZXQAAAAAAQAAAAhmbGFnX3NldAAAAAEAAAAAAAAAAm9uAAAAAAABAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAACFZhbHVlU2V0AAAAAQAAAAl2YWx1ZV9zZXQAAAAAAAABAAAAAAAAAAV2YWx1ZQAAAAAAAAQAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAACVNpZ25lZFNldAAAAAAAAAEAAAAKc2lnbmVkX3NldAAAAAAAAQAAAAAAAAABdgAAAAAAAAUAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAACkNvdW50ZXJTZXQAAAAAAAEAAAALY291bnRlcl9zZXQAAAAAAQAAAAAAAAABbgAAAAAAAAYAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAAClBvaW50ZXJTZXQAAAAAAAEAAAALcG9pbnRlcl9zZXQAAAAAAQAAAAAAAAAHcHJlc2VudAAAAAABAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAAC1dpZGVJMTI4U2V0AAAAAAEAAAANd2lkZV9pMTI4X3NldAAAAAAAAAEAAAAAAAAAAXYAAAAAAAALAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAAC1dpZGVVMTI4U2V0AAAAAAEAAAANd2lkZV91MTI4X3NldAAAAAAAAAEAAAAAAAAAAXYAAAAAAAAKAAAAAAAAAAA=",
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
        "AAAAAAAAAAAAAAAKZ2V0X3NpZ25lZAAAAAAAAAAAAAEAAAAF",
        "AAAAAAAAAAAAAAAKZ2V0X3N5bWJvbAAAAAAAAAAAAAEAAAAR",
        "AAAAAAAAAC5TdG9yZXMgYSBzaWduZWQgaW50ZWdlciBhbmQgZW1pdHMgYFNpZ25lZFNldGAuAAAAAAAKc2V0X3NpZ25lZAAAAAAAAQAAAAAAAAABdgAAAAAAAAUAAAAA",
        "AAAAAAAAAGxTdG9yZXMgYSBzaG9ydCBgU3ltYm9sYCAoaW50ZXJuZWQgaWQ7IHBhc3MgVVRGLTggYnl0ZXMgdGhhdCBtYXRjaCBTeW1ib2wgcnVsZXM6IGBhLXpBLVowLTlfYCwgMeKAkzMyIGNoYXJzKS4AAAAKc2V0X3N5bWJvbAAAAAAAAQAAAAAAAAAFbGFiZWwAAAAAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2NvdW50ZXIAAAAAAAAAAAEAAAAG",
        "AAAAAAAAAAAAAAALZ2V0X3BvaW50ZXIAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAACxTdG9yZXMgYSB1NjQgY291bnRlciBhbmQgZW1pdHMgYENvdW50ZXJTZXRgLgAAAAtzZXRfY291bnRlcgAAAAABAAAAAAAAAAFuAAAAAAAABgAAAAA=",
        "AAAAAAAAADlTdG9yZXMgYW4gb3B0aW9uYWwgU3RlbGxhciBhZGRyZXNzIChhY2NvdW50IG9yIGNvbnRyYWN0KS4AAAAAAAALc2V0X3BvaW50ZXIAAAAAAQAAAAAAAAADd2hvAAAAA+gAAAATAAAAAA==" ]),
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
        get_signed: this.txFromJSON<i32>,
        get_symbol: this.txFromJSON<string>,
        set_signed: this.txFromJSON<null>,
        set_symbol: this.txFromJSON<null>,
        get_counter: this.txFromJSON<u64>,
        get_pointer: this.txFromJSON<Option<string>>,
        set_counter: this.txFromJSON<null>,
        set_pointer: this.txFromJSON<null>
  }
}