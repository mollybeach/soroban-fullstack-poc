# Solidity smart contracts overview — `factorycontracts`

**Source tree:** `/Users/beachmolly/Documents/git/factorycontracts`  
This document describes **what the Solidity is for**, how the main pieces relate, and where to read next. It complements that repo’s root `README.md` and `docs/WhatIsTheFactoryRepo.md`.

---

## What this repo is (and is not)

`factorycontracts` is a **standalone Foundry** project: Solidity **0.8.24** (`foundry.toml`), OpenZeppelin **EnumerableSet** and introspection helpers, and **hundreds of `.sol` files** arranged like an upstream **factory + contexts + data framework** platform.

**Important:** The root README states this is a **scaffold aligned with reference layout and public surfaces**, **not** a line-by-line copy of proprietary production code. Many contracts are **stubs** or simplified so `forge build` / `forge test` stay green. Even stubs encode **real seams**: interfaces, ERC-7201-style storage locations, package boundaries, and call directions that matter for reviews and for ports (e.g. to **Soroban**).

---

## The problem the design addresses

At runtime, the intended system is a **platform for creating and governing many deployable “items”** (tokens, registries, list contexts, attribute registries, and similar) from **templates** and **strategies**, under shared **access control**, **pause** semantics, and a **data / attestation** layer.

Roughly:

1. **Who may create what** — Factory flows tie creation to controllers, templates, and optional **strategy** contracts (`registerStrategy`, `deployWithStrategy`).
2. **What exists** — Factory storage records standards, templates, issued items, id→address maps, issuers, and template/strategy metadata (`FactoryStorageLib`).
3. **How each live item behaves** — Items are modeled as **proxies** (`BaseProxy`) delegating to **packages** (upgradeable / composable surfaces). Shared patterns: **controller**, pause flags (`SharedItemStateLib`), link to **factory** and **team** (`CoreContextStorageLib`), and **RBAC** via **resolver** (role name → role contract address) and team context (`CoreContextInternal`, `PermissionUtils`).
4. **How data is validated** — **Schemas**, **inheritance / nesting**, **limits**, and an **attestation** model: authoritative property values can live in an **attestation service / context**, while **items** enforce **who may request a write** (`DataItemLib` / `DataItemStorageLib`: local `itemLevelPermission` vs `PermissionType.Item` at the service).
5. **How names map to addresses** — Resolver / registry / **reference** stubs model lookup and routing.

So the Solidity is a **contract-side blueprint** for: *deploy governed items from templates, resolve roles, validate and attest data under explicit limits, and evolve behavior in package-sized chunks.*

---

## Core Solidity building blocks

### 1. `BaseProxy` — minimal delegatecall proxy

`src/core/common/proxy/BaseProxy.sol`

- Constructor takes an **initial implementation (“package”)** address, an **initialize** selector, and an interface id (shape alignment with the reference repo).
- On deploy, it **`delegatecall`s** into that package to run **`initialize`**, then stores the implementation in an **EIP-1967-style** slot.
- **`fallback`** delegates all subsequent calls to the stored implementation.

Production systems would add fuller ERC-7201 namespacing, formal upgrade auth, and reentrancy posture; this file documents the **bootstrap + delegate** pattern.

### 2. `Factory` — thin factory entrypoint

`src/core/implementations/factory/Factory.sol`

- `contract Factory is BaseProxy` with constructor wiring `IFactoryInit.initialize.selector`.
- **No business logic in the contract body**; behavior lives in the **implementation package** behind the proxy.

### 3. `IFactory` — the public factory API

`src/core/interfaces/factory/IFactory.sol`

| Function | Role |
|----------|------|
| `getResolver()` | Returns the attached **`IResolver`**. |
| `createItem(name, description, template, controller, data)` | **Primary creation API**: deploy/register a new item from template + bootstrap bytes. |
| `setResolver(resolver)` | Wires global resolution. |
| `deployWithStrategy(strategyId, config)` | Strategy-driven deploy (`bytes32` id + `bytes` config). |
| `registerStrategy(strategyId, strategy)` | Admin maps strategy id → strategy contract. |

Events include **`StrategyRegistered`**. Full implementations live in factory **packages** and scripts, not in the two-line `Factory.sol` file.

### 4. `FactoryStorageLib` — what the factory issued

`src/core/implementations/factory/FactoryStorageLib.sol`

- **ERC-7201**-style fixed slot for `"fsc.storage.Factory"`.
- **`FactoryStorage`**: counters, **OpenZeppelin `EnumerableSet`** for standards/templates/all items, **`_resolver`**, **`_indexedList`**, and mappings for standards, issuers, templates, strategies, and id→item address.

### 5. `CoreContextInternal` — modifiers and permission matrix

`src/core/implementations/packages/core-context/libraries/CoreContextInternal.sol`

Abstract contract with modifiers such as:

- **`onlyAuthorized` / `onlyAuthorizedWithPermission`** — RBAC via team + resolver + `PermissionType` (`PermissionUtils`).
- **`onlyFactory` / `onlyAuthorizedOrFactory`**
- **`onlyController` / `onlyControllerOrProxy`**
- **`onlyAuthorizedOrProxy` / `onlyAuthorizedOrOperator`**
- **`notPaused` / `whenNotPaused`** — item and global pause.

This is the **spine** of “who can call what” for platform-shaped contracts.

### 6. Context proxies

Same **`BaseProxy`** pattern with different init interfaces, e.g.:

- `src/core/implementations/attribute-registry/AttributeRegistryContext.sol` — `IContextPackageInitialization.initialize`.

Other contexts (monetized team, reference, …) follow the same **thin proxy + package** idea; see the root README path table.

### 7. Data layer — attestation and `DataItemLib`

Under `src/core/implementations/data/`:

- **Attestation context** — storage (`AttestationContextStorageLib`) and many **packages** (getters, attest, manage, limits, nesting, inheritance, schema items, …) plus validation libs (`SchemaCommonLib`, `SchemaValidationLib`, …).
- **Approval-type registry** — approval **type** registration/lookup.
- **`DataItemLib`** (`data/data-item/common/DataItemLib.sol`) — **two-level permission**:
  - Store the **real** permission in **`DataItemStorageLib.itemLevelPermission`**.
  - When calling the attestation service’s **`IServiceSchemaItemSetters`**, set service-side permission to **`PermissionType.Item`** so **only the item** can attest that property.
  - **`_checkSupportsInterfaces`** validates permission types (e.g. **`Whitelist`** requires **`IIndexedAddressList`** via ERC-165).

That encodes: **service holds attestations; item enforces local RBAC before writes.**

### 8. Attribute registry, strategies, scripts

- **Attribute registry** — codec, mixin, strategy stub, packages under `src/core/implementations/attribute-registry/**`.
- **Strategies** — stubs under `packages/**/*Strategy*` for `deployWithStrategy` recipes.
- **Scripts** — `script/*.s.sol` for phased deployments.

---

## Architecture layers (short)

See `docs/architecture/SystemArchitectureOverview.md` in **factorycontracts** for the **six-layer** model (foundation → governance → common packages → factory → token strategies → core components) and the **Factory ↔ Data ↔ Item** narrative.

---

## Dependencies and tooling

- **Foundry** — `forge build`, `forge test`, `forge fmt`.
- **Vendored** — `forge-std`, `openzeppelin-contracts` (see factorycontracts `README.md` if `lib/` is missing).
- Optional **Prettier** — `package.json` in factorycontracts.

---

## Where to read next (in `factorycontracts`)

| Need | Path |
|------|------|
| Program context + Soroban porting | `docs/WhatIsTheFactoryRepo.md` |
| Layers & deployment | `docs/architecture/SystemArchitectureOverview.md`, `DeploymentArchitecture.md` |
| Component index | `docs/ComponentsCatalog.md` |

---

## One-sentence summary

**The Solidity models an institutional-style factory platform: proxy-based factory and contexts, resolver-backed RBAC, rich factory storage, and a data/attestation layer where items and services split permission and truth—implemented as a Foundry-aligned scaffold with real interfaces and storage seams.**

---

*Synthesized from reading `factorycontracts` README, `WhatIsTheFactoryRepo.md`, `SystemArchitectureOverview.md`, `Factory.sol`, `IFactory.sol`, `BaseProxy.sol`, `FactoryStorageLib.sol`, `CoreContextInternal.sol`, `DataItemLib.sol`, and `AttributeRegistryContext.sol`.*
