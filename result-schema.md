# Result schema

This document defines the normalized result model returned by the wrapper layer.

The purpose of the result schema is not to expose every detail of Playwright internals. Its purpose is to return a compact, review-friendly execution record that another system can consume reliably and a human can inspect quickly.

## Why this schema exists

Raw process output is rarely a good interface.

Terminal logs, runner output, and scattered artifacts may be sufficient for debugging, but they are not a strong contract for governed execution.

This schema exists to solve a different problem:

- make wrapper outcomes easy to interpret
- distinguish operational failures from test failures
- preserve the requested target alongside the executed command
- surface artifact references as first-class evidence
- support human review without requiring shell reconstruction

The result model is therefore part of the execution boundary, not just a convenience after the fact.

## Design goals

The first version of the result schema is designed to do a few things well:

- communicate whether the wrapper completed its own job
- normalize execution status into a small readable set
- echo the approved target in structured form
- expose the constructed command for review
- include artifact references in a stable location
- provide a short summary that helps a reviewer know where to look next

It is intentionally compact.

## Example result

```json
{
  "ok": true,
  "status": "passed",
  "target": {
    "project": "smoke",
    "spec": "tests/smoke/example.spec.ts",
    "grep": null,
    "headed": false,
    "workers": 1
  },
  "command": "npx playwright test --project smoke tests/smoke/example.spec.ts --workers 1",
  "exitCode": 0,
  "artifacts": {
    "htmlReport": "artifacts/playwright-report/index.html",
    "testResultsJson": "artifacts/test-results.json",
    "testResultsXml": "artifacts/test-results.xml",
    "traceFiles": []
  },
  "summary": {
    "message": "Playwright run completed successfully.",
    "nextReviewPoint": "Open the HTML report if deeper inspection is needed."
  }
}
```

## Schema overview

The first-version result shape is expected to contain:

- `ok`
- `status`
- `target`
- `command`
- `exitCode`
- `artifacts`
- `summary`

Each field exists to answer a different review question.

## Field definitions

### `ok`

Type: boolean

This field answers the wrapper-level question:

**Did the wrapper complete its own responsibility successfully?**

This is not identical to test success.

Examples:

- a valid Playwright run with failing tests can still return `ok: true`
- an input validation failure should return `ok: false`
- a process launch failure should return `ok: false`

This distinction is important because the wrapper is responsible for governed execution, not for forcing tests to pass.

### `status`

Type: string

This field provides a normalized execution status.

For v1, the allowed set should stay deliberately small:

- `passed`
- `failed`
- `validation_error`
- `execution_error`

These values should be interpreted as follows:

- `passed` means the wrapper executed successfully and the test run passed
- `failed` means the wrapper executed successfully and the test run completed with failing tests
- `validation_error` means the request was rejected before execution
- `execution_error` means the wrapper attempted execution but could not complete the run normally

This field is designed for quick human scanning and simple downstream handling.

### `target`

Type: object

This field is a normalized echo of the accepted request.

Its purpose is to preserve exactly what the wrapper believed it was asked to run.

Expected v1 fields:

- `project`
- `spec`
- `grep`
- `headed`
- `workers`

This matters for review because the target is the approved request shape, while the command is the derived invocation.

Those two should be related, but not conceptually merged.

### `command`

Type: string

This field is a human-readable representation of the constructed Playwright invocation.

It improves reviewability by making the execution shape visible without exposing raw caller-supplied shell text as part of the public interface.

This field should reflect validated and normalized input only.

The command is evidence of what the wrapper ran, not a pass-through execution request.

### `exitCode`

Type: number or null

This field captures the process exit code when execution occurred.

For validation failures, this may be omitted or represented as `null` in v1.

The main goal is to preserve clarity:

- if execution happened, the exit code helps explain the outcome
- if execution never started, the absence of an exit code should be understandable

The schema should avoid implying process semantics where no process was launched.

### `artifacts`

Type: object

This field contains compact references to evidence produced or expected from the run.

For v1, the structure should remain small and predictable.

Example fields:

- `htmlReport`
- `testResultsJson`
- `testResultsXml`
- `traceFiles`

Artifact values should use repo-relative paths.

This field exists because evidence is a first-class part of the review model, not an afterthought.

### `summary`

Type: object

This field provides a small human-review-oriented summary.

Recommended v1 fields:

- `message`
- `nextReviewPoint`

This is intentionally modest.

The goal is not to create a verbose reporting layer. The goal is to make the result immediately useful to a reviewer who wants to know what happened and what to inspect next.

## Outcome normalization model

A strong result model should distinguish at least three different ideas:

### 1. Request validity

Was the request accepted under wrapper policy?

This is captured primarily through `ok` and `status`.

### 2. Execution success

Was the Playwright process launched and completed in a normal way?

This is reflected through `ok`, `status`, and `exitCode`.

### 3. Test outcome

Did the selected Playwright target pass or fail?

This is reflected through `status`.

Those distinctions prevent the schema from collapsing everything into a vague success/failure flag.

That is one of the main senior-level qualities of the model.

## Review-oriented interpretation

A reviewer looking at one result should be able to answer:

- what was requested
- whether the request was accepted
- what the wrapper actually ran
- whether the run completed normally
- whether tests passed or failed
- where the evidence lives
- what they should inspect next

If the schema supports those questions well, it is doing its job.

## Example interpretation scenarios

### Passing run

```json
{
  "ok": true,
  "status": "passed"
}
```

Interpretation:

- the wrapper accepted the request
- execution completed
- the tests passed

### Failing test run

```json
{
  "ok": true,
  "status": "failed"
}
```

Interpretation:

- the wrapper did its job correctly
- Playwright ran
- the test target failed

This is not an execution-boundary failure.

### Validation rejection

```json
{
  "ok": false,
  "status": "validation_error"
}
```

Interpretation:

- the wrapper rejected the request before attempting execution
- the failure occurred at the trust boundary
- this is a policy or input issue, not a test result

### Execution problem

```json
{
  "ok": false,
  "status": "execution_error"
}
```

Interpretation:

- the wrapper accepted or partially accepted the request
- execution could not complete normally
- the problem is operational, not just a failing assertion

## Non-goals

This schema is not trying to be:

- a complete Playwright report format
- a telemetry platform
- a historical analytics model
- a replacement for native Playwright artifacts
- a generic result contract for every possible tool

It exists for one bounded purpose: governed Playwright execution with review-friendly outputs.

## Extension posture

The first version should resist the urge to over-model.

Possible future additions might include:

- duration fields
- timestamps
- richer validation detail
- structured error objects
- artifact counts or classifications

Those may be useful later, but they are not required to prove the core pattern.

The stronger design choice in v1 is to keep the schema small, interpretable, and stable.

## Design stance

This result schema is deliberately shaped around reviewability.

It assumes that successful agent-assisted execution is not just about running a command. It is about producing a result that can be trusted, understood, and acted on.

That is the standard this repository is trying to demonstrate.
