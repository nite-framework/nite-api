# nite-api

TypeScript helpers for working with deployed Midnight Compact contracts.

This package wraps the lower-level Midnight JS contract APIs with a small, typed interface for:

- deploying a compiled contract
- joining an already deployed contract
- calling transaction circuits dynamically
- observing public and private contract state together
- building compiled contract objects from a contract class, witnesses, and compiled assets

## Installation

```bash
npm install nite-api
```

Peer runtime expectations:

- Node.js 18+
- a Midnight-compatible provider setup
- a compiled Compact contract and its assets

## What It Exports

### `DynamicContractAPI`

`DynamicContractAPI` is the main wrapper around Midnight's deployed contract APIs.

It provides:

- `DynamicContractAPI.deploy(...)`
- `DynamicContractAPI.join(...)`
- `api.callTx(...)`
- `api.contractState`
- `api.deployedContractAddress`

### `utils.createCompiledContract`

Helper for creating a `CompiledContract` from:

- a contract tag
- a contract class
- witness implementations
- a compiled assets path

## Quick Start

```ts
import { DynamicContractAPI, utils } from "nite-api";

const compiledContract = utils.createCompiledContract(
  "counter",
  CounterContract,
  witnesses,
  "./artifacts/counter"
);

const api = await DynamicContractAPI.deploy({
  providers,
  compiledContract,
  privateStateId,
  initialPrivateState,
  args: [],
  logger,
});

await api.callTx("increment" as any, txContext, 1n);
```

## Usage

### Create a compiled contract

```ts
import { utils } from "nite-api";

const compiledContract = utils.createCompiledContract(
  "my-contract",
  MyContract,
  witnesses, // Pass an empty object if no witness is used by you contract
  "./artifacts/my-contract"
);
```

### Deploy a contract
NB: The type for your `providers` should be constructed as follow `DynamicProviders<TContractType, typeof yourPrivateStateId>`

```ts
  const providers = {

  }
```


```ts
import { DynamicContractAPI } from "nite-api";

const api = await DynamicContractAPI.deploy<TContractType, typeof yourPrivateStateId>({
  providers,
  compiledContract,
  privateStateId,
  initialPrivateState,
  args: [],
  logger,
});

console.log(api.deployedContractAddress);
```

If your contract does not require private state during deployment:

```ts
const api = await DynamicContractAPI.deploy<TContractType, typeof yourPrivateStateId>({
  providers,
  compiledContract,
  args: [],
});
```

### Join an existing deployment

```ts
const api = await DynamicContractAPI.join<TContractType, typeof yourPrivateStateId>({
  providers,
  compiledContract,
  contractAddress: "0x...",
  privateStateId,
  initialPrivateState,
  logger,
});
```

### Call a transaction circuit

`callTx` forwards to the underlying Midnight `deployedContract.callTx` map. It also automatically detects a union of all callable contract circuit names and their arguments, to be passed sequentially.

```ts
await api.callTx("increment", 1n);
await api.callTx("transfer", recipient, amount);
await api.callTx("ping");
```

The exact arguments depend on the generated circuit function types from your Midnight contract bindings.
If a circuit takes no parameters, call it with just the circuit name.

### Observe contract state

`contractState` is an RxJS observable that emits:

```ts
[publicContractState, privateStateOrNull]
```

Example:

```ts
import ledger from "/path to your compiled contract";
const subscription = api.contractState.subscribe(([publicState, privateState]) => {
  console.log("public", publicState); 
  /* Format contract state using ledger() generated as artifact for compiled contract */
  const ledgerState = ledger(publicState.data);
  console.log("private", privateState);
});

subscription.unsubscribe();
```

If no `privateStateId` is supplied, the second tuple item is `null`.

## API Reference

### `DynamicContractAPI.deploy(options)`

Deploys a new contract instance and returns a `DynamicContractAPI`.

Important fields:

- `providers`: Midnight provider set
- `compiledContract`: compiled contract object
- `privateStateId`: optional private state identifier
- `initialPrivateState`: optional initial private state
- `args`: optional contract initialization arguments
- `logger`: optional `pino` logger

### `DynamicContractAPI.join(options)`

Attaches to an already deployed contract and returns a `DynamicContractAPI`.

Important fields:

- `providers`: Midnight provider set
- `compiledContract`: compiled contract object
- `contractAddress`: deployed contract address
- `privateStateId`: optional private state identifier
- `initialPrivateState`: optional initial private state
- `logger`: optional `pino` logger

### `api.callTx(circuitName, ...args)`

Calls a transaction circuit from the underlying deployed contract.

Behavior:

- throws if `circuitName` is not found
- forwards all arguments to the underlying circuit function
- allows zero arguments for circuits that do not accept parameters

### `api.contractState`

RxJS `Observable<[ContractState, PrivateState | null]>`

Behavior:

- subscribes to public contract state updates
- resolves private state once when `privateStateId` is present
- emits `null` for private state when no `privateStateId` is provided
- shaped/formated using the `ledger()` provided in compiled contract artifact 

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Watch tests:

```bash
npm run test:watch
```

## Publishing Checklist

Before publishing to npm, verify:

- `package.json` has correct `name`, `version`, `description`, `repository`, `homepage`, `bugs`, `keywords`, and `author`
- the build output in `dist/` is current
- `README.md` reflects the published API
- tests pass
- exported types and paths are correct

Recommended publish flow:

```bash
npm test
npm run build
npm version patch
npm publish
```

Notes:

- `npm version patch` requires a clean git working tree
- use `npm version minor` or `npm version major` when appropriate
- if you need to bump the version without creating a git tag or commit, use `npm version patch --no-git-tag-version`

## Notes

- This package is ESM-only.
- It is a thin wrapper over Midnight SDK contracts, so consumers still need the relevant Midnight runtime setup.
- `callTx` argument types come from the generated Midnight contract bindings, not from this package alone.

## License

MIT
# nite-api
