# Contributing

## Scope

This package provides a thin TypeScript wrapper around Midnight contract deployment, contract joining, dynamic transaction calls, and combined contract-state observation.

Contributions should preserve that focus:

- keep the surface area small
- prefer typed wrappers over broad abstractions
- avoid introducing runtime behavior that hides Midnight SDK semantics

## Local Setup

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the package:

```bash
npm run build
```

## Project Layout

- `src/index.ts`: main public API
- `src/utils.ts`: helper utilities
- `src/common-types.ts`: shared types
- `src/test/`: unit tests
- `dist/`: generated build output

## Contribution Guidelines

- Keep changes focused and minimal.
- Preserve ESM compatibility.
- Keep exported APIs intentional and typed.
- Prefer unit tests for wrapper behavior over integration tests against live Midnight infrastructure.
- Do not commit unrelated formatting-only churn.

## Testing Expectations

Every change should include appropriate verification.

Examples:

- new wrapper logic should include unit tests
- branching behavior should cover both positive and negative paths
- observable behavior should be tested using deterministic mocked providers

Before opening a PR, run:

```bash
npm test
npm run build
```

## Documentation Expectations

If you change the public API, update:

- `README.md`
- exported type signatures where needed
- usage examples affected by the change

## Coding Notes

- Use TypeScript.
- Match the existing code style.
- Prefer explicit, readable types over clever abstractions.
- Use `apply_patch`-style minimal edits when changing files.

## Pull Requests

A good PR should include:

- a clear summary of the change
- the reason for the change
- any API or behavior impact
- tests for behavior changes

If a change is intentionally breaking, call that out explicitly.

## Release Notes

For npm releases, verify:

- version bump is correct
- package metadata is accurate
- `dist/` matches source
- README examples still reflect the package behavior
