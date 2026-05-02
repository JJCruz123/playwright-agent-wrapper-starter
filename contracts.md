# Contracts

This document defines the first-version TypeScript contract shapes for the wrapper layer.

The purpose of this file is to make the public contract more concrete without overbuilding the repository into a schema-heavy system too early.

These interfaces are intended to formalize three things:

- the request shape accepted by the wrapper
- the result shape returned by the wrapper
- the artifact references surfaced for review

## Why this document exists

The prose docs define the architecture and behavior of the system.

This document adds a more formal layer so the contract is easier to:

- implement consistently
- test directly
- review for ambiguity
- evolve with clearer change boundaries

For v1, TypeScript interface definitions are the right level of formality.

## Request contract

```ts
export interface PlaywrightTargetRequest {
  project: string;
  spec?: string;
  grep?: string;
  headed?: boolean;
  workers?: number;
}
```

## Artifact contract

```ts
export interface PlaywrightArtifacts {
  htmlReport: string | null;
  testResultsJson: string | null;
  testResultsXml: string | null;
  traceFiles: string[];
}
```

## Summary contract

```ts
export interface PlaywrightRunSummary {
  message: string;
  nextReviewPoint: string;
}
```

## Target echo contract

```ts
export interface NormalizedPlaywrightTarget {
  project: string;
  spec: string | null;
  grep: string | null;
  headed: boolean;
  workers: number | null;
}
```

## Status contract

```ts
export type PlaywrightRunStatus =
  | "passed"
  | "failed"
  | "validation_error"
  | "execution_error";
```

## Result contract

```ts
export interface PlaywrightRunResult {
  ok: boolean;
  status: PlaywrightRunStatus;
  target: NormalizedPlaywrightTarget | null;
  command: string | null;
  exitCode: number | null;
  artifacts: PlaywrightArtifacts;
  summary: PlaywrightRunSummary;
}
```

## Semantic rules

The interfaces above are intentionally small, but they still rely on a few important semantic rules.

### `ok` and `status`

Valid combinations for v1 are:

```ts
ok: true  + status: "passed"
ok: true  + status: "failed"
ok: false + status: "validation_error"
ok: false + status: "execution_error"
```

Invalid combinations for v1 are:

```ts
ok: true  + status: "validation_error"
ok: true  + status: "execution_error"
ok: false + status: "passed"
ok: false + status: "failed"
```

### `command`

- `command` is `null` when validation fails before command construction
- `command` contains a human-readable invocation when a command was constructed

### `exitCode`

- `exitCode` is `null` when execution never started
- `exitCode` contains the observed process exit code when a Playwright process was launched

### `target`

- `target` is the normalized echo of the approved request
- for v1, it may be `null` when a request fails too early to normalize reliably
- when present, its shape should remain stable and review-friendly

### `artifacts`

- the artifact object should always be present
- individual fields may be `null`
- `traceFiles` should always be an array, even when empty

This keeps the result shape predictable for both reviewers and downstream consumers.

## Example request object

```ts
const request: PlaywrightTargetRequest = {
  project: "smoke",
  spec: "tests/smoke/example.spec.ts",
  headed: false,
  workers: 1,
};
```

## Example result object

```ts
const result: PlaywrightRunResult = {
  ok: true,
  status: "passed",
  target: {
    project: "smoke",
    spec: "tests/smoke/example.spec.ts",
    grep: null,
    headed: false,
    workers: 1,
  },
  command: "npx playwright test --project smoke tests/smoke/example.spec.ts --workers 1",
  exitCode: 0,
  artifacts: {
    htmlReport: "artifacts/playwright-report/index.html",
    testResultsJson: "artifacts/test-results.json",
    testResultsXml: "artifacts/test-results.xml",
    traceFiles: [],
  },
  summary: {
    message: "Playwright run completed successfully.",
    nextReviewPoint: "Open the HTML report if deeper inspection is needed.",
  },
};
```

## Design stance

These contracts are intentionally narrow.

They are meant to formalize the first release of the wrapper pattern, not to anticipate every future execution option or reporting need.

The stronger design choice in v1 is to keep the contract small, stable, and easy to reason about.