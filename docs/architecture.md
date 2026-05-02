# Architecture

This document describes the architectural model for the repository.

The purpose of this project is not to build a new test framework or replace Playwright. The purpose is to demonstrate a governed execution layer that sits between an external reasoning system and raw Playwright execution.

The architecture is intentionally small.

Its value comes from clear boundaries, explicit contracts, and review-friendly outputs.

## Problem statement

AI-assisted QA workflows are often operationally weak at the point of execution.

A system may be able to decide what should be tested, but that does not mean it should be allowed to:

- construct arbitrary terminal commands
- pass through unbounded flags
- operate outside approved target areas
- return raw shell output as the primary interface

That pattern creates avoidable problems in safety, predictability, and reviewability.

This repository explores a narrower model:

- external reasoning remains external
- execution is mediated through a governed wrapper
- outputs are normalized for review
- evidence is surfaced explicitly
- human review remains part of the operating model

## Architectural goal

The architectural goal is to define a clean seam between three concerns:

1. reasoning about what should be run
2. executing an approved Playwright target
3. reviewing the outcome and evidence

In many systems, those concerns get collapsed together.

This project separates them deliberately.

## Layer model

The repository uses a four-layer model:

1. **operation contract**
2. **execution**
3. **observation**
4. **reporting**

This model keeps responsibilities visible without requiring a large implementation surface.

### 1. Operation contract

The operation contract layer defines:

- accepted request shape
- validation policy
- normalized target shape
- normalized result shape
- allowed status semantics

This layer is responsible for constraining the public interface.

In the repository, it is represented by:

- `tools/agent/contract/validateInputs.ts`
- `tools/agent/contract/resultSchema.ts`
- `docs/contracts.md`
- `docs/wrapper-contract.md`
- `docs/result-schema.md`

### 2. Execution

The execution layer is responsible for:

- turning validated intent into an approved Playwright invocation
- running only supported target shapes
- preserving safe command construction
- returning normalized results rather than raw shell behavior

In the repository, it is represented by:

- `tools/agent/execution/runPlaywrightTarget.ts`
- `tools/agent/execution/runPlaywrightTargetCli.ts`

### 3. Observation

The observation layer is responsible for:

- surfacing artifact references
- preserving evidence in a compact result shape
- supporting human review without terminal reconstruction
- connecting execution output to the review model

In the repository, it is represented by:

- `tools/agent/observation/playwrightArtifacts.ts`
- `docs/artifact-model.md`
- `docs/human-review-model.md`

### 4. Reporting

The reporting layer is intentionally minimal in v1.

Its role is to acknowledge that observation and reporting are not the same concern.

In this repository:

- native Playwright HTML, JSON, and JUnit outputs provide the detailed reporting surface
- the wrapper only surfaces stable references and review guidance
- a dedicated reporting subsystem is intentionally deferred

This is why `tools/agent/reporting/` exists structurally, but does not yet contain substantive implementation.

That restraint is deliberate.

## Core architectural idea

The core pattern is:

- a caller submits a narrow execution request
- the wrapper validates the request against policy
- the wrapper constructs an approved Playwright invocation
- the wrapper executes the run
- the wrapper returns a normalized result with artifact references
- a human reviewer or downstream system inspects that result

The important design choice is that the wrapper accepts **intent**, not raw terminal control.

That is what turns it into a boundary instead of just another convenience script.

## System components

The first-version architecture is intentionally composed of a small number of parts.

### 1. Playwright test project

The repository includes a small Playwright project that acts as the execution target.

Its role is to provide:

- one or more sample test targets
- a realistic execution surface for the wrapper
- native Playwright outputs such as reports and traces

Playwright remains the underlying test runner and reporting system.

### 2. Wrapper execution layer

The wrapper execution layer lives under `tools/agent/execution/`.

Its role is to:

- accept a bounded request shape
- validate allowed inputs through the contract layer
- construct an approved invocation
- launch the Playwright run
- collect artifact references through the observation layer
- return a normalized result

This layer is the operational center of the repository.

### 3. Contract layer

Validation and result semantics are treated as first-class architectural concerns, not helper details.

Their role is to enforce constraints such as:

- allowed project names
- allowed spec path boundaries
- safe handling of `grep`
- explicit handling of `headed`
- bounded handling of `workers`
- stable result and status semantics

This keeps policy decisions visible and testable.

### 4. Observation layer

The wrapper surfaces artifact references in a compact and stable structure.

Its role is to make evidence easy to locate without requiring the reviewer to guess where outputs were written.

This keeps artifacts and review guidance as part of the contract rather than as incidental byproducts.

### 5. Human review model

The repository assumes that governed execution is incomplete without review.

Its role is to define how a human inspects:

- the normalized result
- the approved target
- the command that was run
- the available evidence
- the next review point

This keeps the system human-in-the-loop by design.

## Boundary model

The architecture is centered on boundaries.

### Boundary 1: reasoning vs execution

The caller may decide what it wants attempted, but it does not control raw command construction.

That separation matters because reasoning systems are often useful at suggestion and selection, but less trustworthy when given broad operational freedom.

### Boundary 2: request vs command

The public interface is a request object.

The shell command is an internal derivative of validated input.

That distinction prevents the wrapper from becoming a generic terminal pass-through.

### Boundary 3: execution vs interpretation

The wrapper executes the run and returns structured output.

Human or downstream review happens afterward against a normalized result.

This avoids conflating “something ran” with “the outcome is understood.”

### Boundary 4: observation vs reporting

Observation exists to preserve compact evidence and review-friendly output.

Reporting exists to provide deeper run detail and presentation.

In v1, the wrapper implements observation lightly and relies on native Playwright reporting for deeper detail.

That separation is one of the key architectural choices in the repository.

### Boundary 5: native Playwright reporting vs wrapper evidence model

Playwright remains responsible for detailed test reporting.

The wrapper remains responsible for surfacing stable evidence references and a review-friendly result.

This keeps the project complementary to Playwright rather than competitive with it.

## Request flow

The first-version request flow follows this sequence:

1. receive a narrow request object
2. validate the request against contract policy
3. reject invalid requests before execution
4. derive the Playwright invocation from validated fields
5. execute the invocation
6. collect expected artifact references
7. normalize the operational and test outcome
8. return a compact result for review

This flow is deliberately simple.

Complexity is reduced by refusing to expose more execution freedom than the repository needs.

## Result flow

The result flow is designed to support both machines and humans.

A normalized result should make these questions easy to answer:

- was the request accepted
- what target was approved
- what command was run
- did execution complete
- did tests pass or fail
- what evidence exists
- where should a reviewer look next

That is the minimum useful contract for governed execution.

## Review flow

The intended review flow is:

1. inspect top-level result fields
2. confirm the approved target
3. inspect the summary and next review point
4. open the HTML report if deeper inspection is needed
5. inspect traces or machine-readable results when necessary
6. decide the next bounded action

This preserves human judgment without requiring raw shell reconstruction.

## Repository shape

The repository remains intentionally small.

```text
playwright-agent-wrapper-starter/
├─ README.md
├─ package.json
├─ tsconfig.json
├─ playwright.config.ts
├─ tests/
│  ├─ smoke/
│  │  └─ example.spec.ts
│  └─ unit/
│     └─ validateInputs.spec.ts
├─ tools/
│  └─ agent/
│     ├─ contract/
│     │  ├─ validateInputs.ts
│     │  └─ resultSchema.ts
│     ├─ execution/
│     │  ├─ runPlaywrightTarget.ts
│     │  └─ runPlaywrightTargetCli.ts
│     ├─ observation/
│     │  └─ playwrightArtifacts.ts
│     └─ reporting/
│        └─ .gitkeep
├─ docs/
│  ├─ architecture.md
│  ├─ contracts.md
│  ├─ wrapper-contract.md
│  ├─ result-schema.md
│  ├─ artifact-model.md
│  └─ human-review-model.md
└─ .gitignore
```

This shape reflects the architectural priorities of the project:

- small execution surface
- explicit contracts
- observation separated from reporting
- artifact-aware results
- docs that explain design decisions
- examples kept out of the core implementation path

## Design tradeoffs

This architecture is intentionally opinionated.

### Tradeoff: boundedness over flexibility

The wrapper does less than a generic command interface.

That is a strength, not a weakness.

The narrower the boundary, the easier it is to validate, test, and review.

### Tradeoff: observation over custom reporting

The wrapper focuses on compact evidence and review guidance rather than building a second reporting framework.

That keeps the implementation honest and aligned with the repository’s goal.

### Tradeoff: reviewability over raw power

The result model favors clarity and evidence over exhaustively exposing runner internals.

That makes the system easier to understand in practice.

### Tradeoff: small public pattern over broad platform ambition

This repository is not trying to prove a complete agent platform.

It is trying to demonstrate one credible architectural pattern well.

That restraint is part of the design.

## Non-goals

The architecture explicitly does not attempt to provide:

- arbitrary command execution
- browser-driving agent orchestration
- custom MCP infrastructure
- autonomous multi-step planning
- test generation or self-healing
- dashboarding or telemetry platforms
- enterprise workflow automation

Those concerns may exist elsewhere, but they are not needed to prove the core execution-boundary pattern.

## Architectural summary

The architecture can be summarized simply:

- the **operation contract** layer constrains the public interface
- the **execution** layer runs approved Playwright targets
- the **observation** layer captures compact evidence and review-oriented output
- the **reporting** layer remains intentionally minimal in v1 and relies on native Playwright reporting for detail

The repository exists to show that this layered seam can be small, practical, and reusable.

That is the central architectural idea.