# Wrapper contract

This document defines the public execution contract for the wrapper layer in this repository.

The purpose of the wrapper is not to replace Playwright. The purpose is to define a governed boundary around Playwright execution that another system can call and a human can review.

## Why this contract exists

AI-assisted workflows are often weakest at the execution boundary.

A reasoning system may be useful for deciding what to run, but that does not mean it should be allowed to construct arbitrary terminal commands or operate directly against the environment without constraints.

This wrapper contract exists to enforce a narrower model:

- the caller provides a small validated request
- the wrapper decides whether that request is allowed
- the wrapper constructs an approved Playwright invocation
- the wrapper returns a normalized result and artifact references
- a human or another system can review the outcome without reconstructing raw shell behavior

The contract is intentionally small because boundedness is part of the design.

## Trust boundary

The wrapper is the trust boundary between external reasoning and local execution.

That boundary exists to prevent a caller from:

- requesting arbitrary shell execution
- injecting unapproved Playwright flags
- escaping approved repo-relative test paths
- treating raw command construction as part of the public interface
- bypassing result normalization and evidence collection

The wrapper accepts intent in a narrow request shape.

It does not accept raw shell text.

It does not expose a generic terminal interface.

It does not treat caller-supplied command fragments as trusted input.

## Contract goals

The first version of the contract is designed to satisfy a small number of goals well:

- constrain what can be executed
- make validation rules explicit
- keep command construction deterministic
- separate execution concerns from reasoning concerns
- produce a result that is useful for both systems and reviewers
- preserve room for later extension without over-designing v1

This is a wrapper contract, not a workflow engine contract.

## Accepted request shape

The wrapper accepts a narrow allowlisted request object.

### First-version fields

- `project` required
- `spec` optional
- `grep` optional
- `headed` optional
- `workers` optional

Example request:

```json
{
  "project": "smoke",
  "spec": "tests/smoke/example.spec.ts",
  "grep": "@smoke",
  "headed": false,
  "workers": 1
}
```

## Validation posture

Validation is part of the contract, not an implementation detail.

The wrapper should reject invalid or out-of-policy requests before attempting execution.

That is important for both safety and reviewability.

### `project`

Required.

Must match one of the explicitly allowlisted Playwright project names defined by the repository.

Unknown project names must be rejected.

The wrapper should not infer project names and should not fall back silently.

### `spec`

Optional.

If present, it must be a repo-relative path within the approved test area.

For v1, that means the path must remain inside `tests/`.

The wrapper must reject:

- absolute paths
- parent-directory traversal
- paths outside the approved test area
- malformed or ambiguous paths

The spec value is part of a bounded target selector, not a free-form file input.

### `grep`

Optional.

If present, it must be handled as a discrete Playwright filter argument.

It must not be treated as raw shell text.

The wrapper may later impose additional restrictions on `grep`, but v1 should at minimum preserve argument-level safety and reject attempts to use it as a command injection surface.

### `headed`

Optional.

Boolean only.

The wrapper should not accept equivalent string variants such as `"true"` or `"false"` unless the CLI layer explicitly normalizes them before contract validation.

The contract itself should remain type-clear.

### `workers`

Optional.

Must be a positive integer within a deliberately small allowed range.

The exact range may be implementation-defined for v1, but the contract should remain intentionally restrictive.

This field exists to allow a bounded degree of execution control, not to expose unrestricted runtime tuning.

## Command construction policy

The wrapper constructs the Playwright invocation from validated fields only.

That means:

- no raw command string input
- no caller-supplied shell fragments
- no pass-through flag bag
- no concatenation model that treats caller input as trusted command text

The public interface is the request object.

The shell command is an internal derivative of validated input.

That distinction matters.

It keeps the wrapper contract stable even if the exact execution implementation changes later.

## Execution responsibilities

The wrapper layer is responsible for:

- validating the request against contract policy
- constructing an approved Playwright invocation
- executing the run through the local Playwright installation
- collecting expected artifact references
- returning a normalized result object

This keeps the wrapper focused on bounded execution.

## Explicit non-responsibilities

The wrapper layer is not responsible for:

- deciding what test should be run next
- generating tests
- healing failing tests
- planning browser interactions
- orchestrating external systems
- performing broad environment automation
- acting as a generic command runner

These are important non-goals.

Without them, the boundary becomes vague and the wrapper loses credibility.

## Operational outcome model

The contract should distinguish between at least two different classes of outcome:

### 1. Wrapper-level outcome

Did the wrapper successfully validate, construct, and attempt the run according to policy?

This is an operational question.

### 2. Test-run outcome

Did the Playwright execution pass or fail?

This is a test result question.

Those are related, but they are not the same.

A correctly governed wrapper can still return a valid completed result for a failing test run.

Likewise, an invalid request can fail at the wrapper boundary without any Playwright execution occurring at all.

That distinction should remain clear throughout the result model.

## Review-oriented design

This contract is designed for human review as much as execution.

A reviewer should be able to answer these questions without reverse-engineering shell history:

- what was requested
- whether the request was allowed
- what was actually run
- what the outcome was
- what evidence was produced
- where to inspect next

That is why normalized results and artifact references are part of the design, not optional extras.

## Example result expectation

A successful wrapper execution is expected to produce a normalized result with fields such as:

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

The exact result schema is defined separately in `docs/result-schema.md`.

## Extension posture

This contract is intentionally narrow in v1.

That is a design choice, not an omission.

A strong first version should prove that a governed execution seam can be:

- understandable
- enforceable
- reviewable
- reusable

Only after that is clear should the contract expand.

Likely future extensions may include additional selectors, richer artifact references, or more explicit policy controls, but none of those are necessary to validate the core pattern.

## Design stance

This repository is not trying to show that an agent can do everything.

It is trying to show that a high-trust execution boundary can be designed deliberately.

That is the point of the wrapper contract.
