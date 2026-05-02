# playwright-agent-wrapper-starter

A public engineering showcase for bounded, reviewable Playwright execution in AI-assisted QA workflows.

This project demonstrates a practical pattern for placing a governed wrapper layer between an AI system and raw Playwright execution.

The focus is on execution boundaries: validating what can be run, constraining how it is run, capturing evidence, and returning structured results that a human can review.

## The problem

AI-assisted tooling can accelerate QA workflows, but many integrations still rely on a weak operational boundary: letting an assistant run broad terminal commands and hoping the outcome is understandable afterward.

That approach creates predictable problems:

- execution scope is too loose
- inputs are not constrained enough
- command construction is hard to trust
- outputs are optimized for machines, not reviewers
- evidence is scattered across raw tool output
- reasoning and execution are too tightly coupled

The useful idea is real, but the execution boundary is often under-designed.

## What this project demonstrates

This repo uses a narrower and more governable model.

Instead of exposing arbitrary terminal access, it introduces a small wrapper layer around Playwright execution that is designed to:

- accept a bounded set of allowlisted inputs
- construct Playwright runs safely from validated arguments
- normalize execution outcomes into a compact result shape
- capture artifact references for later inspection
- support evidence-oriented, human-review-friendly workflows
- preserve a clean separation between reasoning and execution
- define formal request and result contracts for implementation and review

The goal is to demonstrate a reusable QA/tooling pattern, not to build a full agent platform.

## Why this matters

There is growing interest in agent-assisted development and QA, but many implementations jump too quickly from “AI can help” to “AI should directly operate the environment.”

A more credible path is:

1. define the execution contract
2. bound the allowed inputs
3. normalize what comes back
4. preserve evidence for review
5. keep a human in the loop

That design is more reliable in real engineering environments.

## Architectural idea

The core pattern is simple:

- Playwright remains the execution engine
- a wrapper layer sits in front of it
- the wrapper validates and shapes the run request
- the wrapper executes only approved target forms
- the wrapper returns a normalized result plus artifact references

This creates a cleaner boundary between:

- **reasoning systems** that decide what should be attempted
- **execution systems** that perform a controlled run
- **review systems or humans** that inspect the result and evidence

## Layer model

The repository is organized around four layers:

1. **operation contract**
2. **execution**
3. **observation**
4. **reporting**

In the first release:

- **operation contract** is implemented through validation rules, normalized types, and contract docs
- **execution** is implemented through the bounded Playwright runner and CLI entry point
- **observation** is implemented through normalized run results, artifact references, and review-oriented summaries
- **reporting** is minimal in v1; native Playwright reports remain the detailed reporting layer

## First-release shape

The first release stays narrow.

It includes:

- a small Playwright sample project
- a bounded wrapper function for Playwright execution
- a CLI entry point for the wrapper
- validation for a small allowlist of execution inputs
- safe command construction
- normalized result output
- artifact path collection
- lightweight design documentation for review and teaching

The initial input surface is small:

- `project`
- optional `spec`
- optional `grep`
- optional `headed`
- optional `workers`

## What this repo is not

This repo is not:

- a prompt library
- a replacement for Playwright CLI
- a replacement for Playwright MCP
- a browser-driving agent framework
- an autonomous QA system
- a generic “AI for testing” concept repo

## Public scope

This repository is intentionally public-facing and documentation-forward.

Its role is to showcase:

- architectural thinking
- execution-boundary design
- wrapper contracts
- normalized result design
- artifact and evidence modeling
- human-review-oriented workflow design

Some implementation details remain simplified in public form to keep the repo focused, teachable, and appropriate for portfolio use.

## Repository structure

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

## Structure notes

This structure is intentionally small and layered.

- `tests/` contains the sample Playwright suite and targeted validation tests.
- `tools/agent/contract/` contains input validation and normalized result definitions.
- `tools/agent/execution/` contains the bounded runner and CLI entry point.
- `tools/agent/observation/` contains artifact collection for review-oriented outputs.
- `tools/agent/reporting/` makes the fourth layer visible, while detailed reporting remains deferred in v1.
- `docs/` explains the architectural model, contracts, schema, evidence handling, and review workflow.

## Wrapper contract preview

Example input:

```json
{
  "project": "smoke",
  "spec": "tests/smoke/example.spec.ts",
  "headed": false,
  "workers": 1
}
```

Example result:

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
  "command": "npx playwright test --project=smoke tests/smoke/example.spec.ts --workers=1",
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

The public contract is defined in both prose and formal TypeScript form.

The prose docs explain the architectural boundary and review model. The contracts doc defines the request, result, artifact, and status shapes more explicitly so the wrapper can be implemented and tested against a stable interface.

## Design principles

This repo is shaped around a few explicit principles:

- bounded execution is more credible than arbitrary command access
- validation should happen before invocation
- execution output should be normalized for review
- artifact references should be first-class
- reasoning and execution should remain separate concerns
- human review should remain part of the model

## Explicitly out of scope for v1

To keep the first release believable, the following are out of scope:

- browser-driving agent workflows
- custom MCP server implementation
- autonomous orchestration loops
- test generation or self-healing
- Slack, Jira, or GitHub automation
- dashboards and telemetry platforms
- enterprise approval systems
- distributed execution infrastructure

## Status

This project is in the first public implementation phase.

The current version demonstrates:

- contract-layer validation
- execution-layer target running
- observation-layer artifact and result capture
- minimal reporting posture built on native Playwright outputs