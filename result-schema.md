# Result schema

This document defines the normalized result shape returned by the wrapper.

## Purpose

The wrapper should return a result that is easy to inspect in two ways:

- a human should be able to understand what happened quickly
- another system should be able to consume the output reliably

The result schema is intentionally compact.

It is not trying to mirror every Playwright internal detail.

## First-version result goals

The first version should make these questions easy to answer:

- did execution complete
- what status best describes the run
- what command was constructed
- what exit code was returned
- what target was requested
- what artifacts are available
- what should a reviewer inspect next

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

## Top-level fields

### `ok`

Boolean.

Indicates whether the wrapper completed its own job successfully.

This is slightly different from whether tests passed.

For example:

- a valid Playwright run with failing tests can still return a completed wrapper result
- an input validation failure should return `ok: false`

### `status`

A normalized execution status.

For v1, keep this small and readable.

Recommended values:

- `passed`
- `failed`
- `validation_error`
- `execution_error`

This should describe the result in a way that is easy for a human reviewer to scan.

### `target`

A normalized echo of the accepted input.

This makes it easy to confirm exactly what the wrapper attempted to run.

Expected fields:

- `project`
- `spec`
- `grep`
- `headed`
- `workers`

### `command`

The constructed Playwright command in human-readable form.

This improves reviewability.

It should reflect the actual validated invocation shape, not arbitrary raw shell input.

### `exitCode`

The process exit code from the Playwright run when execution occurred.

For validation failures, this may be omitted or set to a conventional non-zero value later if desired.

For v1, the main point is clarity, not over-modeling.

### `artifacts`

A compact object containing expected artifact references.

This should use repo-relative paths.

The artifact model can expand later, but v1 should keep this simple.

### `summary`

A small human-review-oriented summary object.

For v1, this can stay minimal.

Recommended fields:

- `message`
- `nextReviewPoint`

This helps the wrapper produce outputs that are immediately useful to reviewers instead of just technically structured.

## Status normalization guidance

The result schema should not expose raw process behavior only.

It should normalize outcomes into a few review-friendly categories.

Suggested interpretation:

- `passed` = wrapper executed and tests passed
- `failed` = wrapper executed and tests failed
- `validation_error` = wrapper rejected the input before execution
- `execution_error` = wrapper attempted execution but the run could not complete normally

That small set is enough for the first release.

## Reviewability principles

The result should help a reviewer answer:

- what was requested
- what was run
- what happened
- where the evidence is
- what to inspect next

That is more important for v1 than exhaustive machine modeling.

## Design posture

This schema is intentionally modest.

The first release should avoid inventing a large reporting framework.

A compact result with clear status, target, command, artifacts, and a short review summary is enough to demonstrate the pattern well.
