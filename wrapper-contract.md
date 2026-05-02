# Wrapper contract

This document defines the narrow execution contract for the first version of the repo.

## Purpose

The wrapper exists to provide a bounded interface between an external reasoning system and raw Playwright execution.

It should make Playwright runs:

- easier to validate
- safer to construct
- easier to review
- easier to consume from another system

The wrapper is not a general command runner.

## First-version input contract

The first version accepts a small allowlisted object with these fields:

- `project` required
- `spec` optional
- `grep` optional
- `headed` optional
- `workers` optional

Example:

```json
{
  "project": "smoke",
  "spec": "tests/smoke/example.spec.ts",
  "grep": "@smoke",
  "headed": false,
  "workers": 1
}
```

## Input rules

### `project`

Required.

Must match one of the allowlisted Playwright project names defined by the repo.

The wrapper should reject unknown project names.

### `spec`

Optional.

If provided, it must point to an allowed repo-relative spec path.

For v1, the path should remain inside `tests/`.

The wrapper should reject path traversal and absolute paths.

### `grep`

Optional.

If provided, it should be treated as a bounded Playwright filter value, not as raw shell text.

The wrapper should pass it as a discrete Playwright argument.

### `headed`

Optional.

Boolean only.

Defaults should stay simple and explicit.

### `workers`

Optional.

Must be a small positive integer.

The wrapper should reject unexpected values and should not allow arbitrary flag injection.

## Command construction principles

The wrapper should construct Playwright commands from validated arguments only.

It should not accept raw command strings.

It should not concatenate user input into a shell command unsafely.

It should build a controlled argument list for Playwright execution.

## Execution boundaries

The wrapper is responsible for:

- validating inputs
- constructing an approved Playwright invocation
- running the invocation
- collecting expected artifact paths
- returning a normalized result

The wrapper is not responsible for:

- test generation
- browser-driving planning
- autonomous retry loops
- reasoning about what to run next
- external workflow orchestration

## Result contract goals

The result should be easy for both humans and systems to inspect.

At minimum, the result should communicate:

- whether the wrapper completed successfully
- normalized execution status
- the constructed Playwright command
- process exit code
- artifact references
- enough context for human review

## First-version result example

```json
{
  "ok": true,
  "status": "passed",
  "command": "npx playwright test --project smoke tests/smoke/example.spec.ts --workers 1",
  "exitCode": 0,
  "artifacts": {
    "htmlReport": "artifacts/playwright-report/index.html",
    "testResultsJson": "artifacts/test-results.json",
    "testResultsXml": "artifacts/test-results.xml",
    "traceFiles": []
  }
}
```

## Design posture

This contract is intentionally small.

Its purpose is to show one believable pattern for governed Playwright execution, not to model every Playwright option or every future integration need.

The contract can expand later, but the first version should stay narrow enough to remain understandable and reviewable.
