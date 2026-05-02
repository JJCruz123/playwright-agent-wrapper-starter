# Contracts

This document defines the first-version TypeScript contract shapes for the wrapper layer.

The purpose of this file is to make the public contract concrete enough to implement, test, and review without turning the repository into a schema-heavy system too early.

These contracts formalize three things:

- the request shape accepted by the wrapper
- the normalized result shape returned by the wrapper
- the artifact references surfaced for review

## Why this document exists

The prose docs define the architecture, trust boundary, and review model.

This document adds a more formal layer so the contract is easier to:

- implement consistently
- test directly
- review for ambiguity
- evolve with clearer change boundaries

For v1, TypeScript interface definitions are the right level of formality.

## Design posture

These contracts are intentionally narrow.

They are meant to formalize the first release of the wrapper pattern, not to anticipate every future execution option or reporting need.

The stronger design choice in v1 is to keep the contract small, stable, and easy to reason about.

## Request contract

```ts
export type PlaywrightProjectName = "smoke";
```

```ts
export interface PlaywrightTargetRequest {
  project: PlaywrightProjectName;
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

## Error contract

```ts
export type PlaywrightRunErrorCode =
  | "INVALID_PROJECT"
  | "INVALID_SPEC"
  | "INVALID_GREP"
  | "INVALID_HEADED"
  | "INVALID_WORKERS"
  | "COMMAND_CONSTRUCTION_FAILED"
  | "PROCESS_LAUNCH_FAILED"
  | "PROCESS_COMPLETION_FAILED";
```

```ts
export interface PlaywrightRunError {
  code: PlaywrightRunErrorCode;
  detail: string;
}
```

## Target echo contract

```ts
export interface NormalizedPlaywrightTarget {
  project: PlaywrightProjectName;
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
  target: NormalizedPlaywrightTarget;
  command: string | null;
  exitCode: number | null;
  artifacts: PlaywrightArtifacts;
  summary: PlaywrightRunSummary;
  error?: PlaywrightRunError;
}
```

## Semantic rules

The interfaces above are intentionally small, but they still rely on a few important semantic rules.

### `project`

- `project` is an allowlisted value, not an arbitrary string
- for v1, the documented public sample allowlist is intentionally small
- if more Playwright projects are introduced later, the union type should expand deliberately

### `spec`

- `spec` is optional in the request contract
- when present, it must be repo-relative and remain inside `tests/`
- absolute paths, parent traversal, and paths outside the approved test area are invalid

### `grep`

- `grep` is optional in the request contract
- if present, it must be a non-empty string after trimming
- `grep` must not exceed 200 characters
- `grep` is passed as a discrete Playwright argument
- `grep` is never treated as raw shell text

### `headed`

- `headed` is optional in the request contract
- when normalized into the result target, omitted `headed` becomes `false`

### `workers`

- `workers` is optional in the request contract
- if present, it must be an integer in the inclusive v1 range of `1` to `4`
- `0`, negative numbers, non-integers, and values above `4` are invalid
- when omitted, normalized `workers` becomes `null`

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

### `target`

- `target` is always present in the result
- `target` is the normalized echo of the request as interpreted by the wrapper
- optional request fields are normalized into explicit values

Normalized defaults for v1 are:

- `spec` becomes `null` when omitted
- `grep` becomes `null` when omitted
- `headed` becomes `false` when omitted
- `workers` becomes `null` when omitted

This keeps the result stable and review-friendly.

### `command`

- `command` is `null` when validation fails before command construction
- `command` contains a human-readable invocation when a command was constructed
- `command` is derived from validated input only
- `command` is never treated as caller-supplied raw shell text

### `exitCode`

- `exitCode` is `null` when execution never started
- `exitCode` contains the observed process exit code when a Playwright process was launched

Typical interpretation:

- `exitCode: 0` usually corresponds to a passing run
- non-zero `exitCode` may correspond to failing tests or execution problems
- `exitCode: null` means no process was launched

### `artifacts`

- the artifact object is always present
- `htmlReport`, `testResultsJson`, and `testResultsXml` are `string | null`
- `traceFiles` is always an array, even when empty
- missing artifact files are represented by `null` or `[]`
- artifact keys are never omitted

This keeps the result shape predictable for both reviewers and downstream consumers.

### `error`

- `error` is optional
- `error` should be present for `validation_error` and `execution_error`
- `error` should typically be omitted for `passed` and `failed`

This allows the contract to carry useful failure detail without forcing a larger error framework into v1.

## Outcome compatibility model

The contract is intentionally designed to separate:

1. wrapper outcome
2. execution outcome
3. test outcome

That means:

- a failing test run can still return `ok: true`
- a validation rejection must return `ok: false`
- an execution problem must return `ok: false`
- test failure is not the same thing as wrapper failure

This distinction is one of the main reasons the result contract exists.

## Example request object

```ts
const request: PlaywrightTargetRequest = {
  project: "smoke",
  spec: "tests/smoke/example.spec.ts",
  headed: false,
  workers: 1,
};
```

## Example passing result object

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

## Example validation error result object

```ts
const result: PlaywrightRunResult = {
  ok: false,
  status: "validation_error",
  target: {
    project: "smoke",
    spec: null,
    grep: null,
    headed: false,
    workers: null,
  },
  command: null,
  exitCode: null,
  artifacts: {
    htmlReport: null,
    testResultsJson: null,
    testResultsXml: null,
    traceFiles: [],
  },
  summary: {
    message: "Wrapper rejected the request during validation.",
    nextReviewPoint: "Inspect the validation error and correct the request shape.",
  },
  error: {
    code: "INVALID_SPEC",
    detail: "Spec path must remain inside tests/ and be repo-relative.",
  },
};
```

## Example execution error result object

```ts
const result: PlaywrightRunResult = {
  ok: false,
  status: "execution_error",
  target: {
    project: "smoke",
    spec: "tests/smoke/example.spec.ts",
    grep: null,
    headed: false,
    workers: 1,
  },
  command: "npx playwright test --project smoke tests/smoke/example.spec.ts --workers 1",
  exitCode: 1,
  artifacts: {
    htmlReport: "artifacts/playwright-report/index.html",
    testResultsJson: "artifacts/test-results.json",
    testResultsXml: "artifacts/test-results.xml",
    traceFiles: [],
  },
  summary: {
    message: "Playwright execution did not complete normally.",
    nextReviewPoint: "Inspect execution context and available artifacts.",
  },
  error: {
    code: "PROCESS_LAUNCH_FAILED",
    detail: "The Playwright process could not be launched successfully.",
  },
};
```

## Change posture

This contract should evolve deliberately.

A contract change is justified when it improves one of these:

- execution safety
- review clarity
- implementation consistency
- downstream usability

A contract change is not justified simply because Playwright exposes more options.

The wrapper exists to preserve a bounded interface, not to mirror the full Playwright surface area.