# playwright-agent-wrapper-starter

A public engineering showcase for bounded, reviewable Playwright execution in AI-assisted QA workflows.

This project demonstrates a practical pattern for placing a governed wrapper layer between an AI system and raw Playwright execution.

The focus is not on autonomous agents or prompt tricks. The focus is on execution boundaries: validating what can be run, constraining how it is run, capturing evidence, and returning structured results that a human can review.

## The problem

AI-assisted tooling can accelerate QA workflows, but most integrations still rely on a weak operational boundary: letting an assistant run broad terminal commands and hoping the outcome is understandable afterward.

That approach creates predictable problems:

- execution scope is too loose
- inputs are not constrained enough
- command construction is hard to trust
- outputs are optimized for machines, not reviewers
- evidence is scattered across raw tool output
- reasoning and execution are too tightly coupled

In other words, the useful idea is real, but the execution boundary is often under-designed.

## What this project demonstrates

This repo explores a narrower and more governable model.

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

This project takes the opposite stance.

The more credible path is often:

1. define the execution contract
2. bound the allowed inputs
3. normalize what comes back
4. preserve evidence for review
5. keep a human in the loop

That design is slower to hype, but stronger in real engineering environments.

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

## Intended first-release shape

The first release is intentionally narrow.

It is expected to include:

- a small Playwright sample project
- a bounded wrapper function for Playwright execution
- a CLI entry point for the wrapper
- validation for a small allowlist of execution inputs
- safe command construction
- normalized result output
- artifact path collection
- lightweight design documentation for review and teaching

The initial input surface is intentionally small:

- `project`
- optional `spec`
- optional `grep`
- optional `headed`
- optional `workers`

This is enough to demonstrate the pattern without pretending to solve every workflow in v1.

## What this repo is not

This repo is not:

- a Cursor-specific project
- a prompt library
- a replacement for Playwright CLI
- a replacement for Playwright MCP
- a browser-driving agent framework
- an autonomous QA system
- a generic “AI for testing” concept repo

Cursor may appear later as one example integration surface, but the core design is tool-agnostic.

## Public scope

This repository is intentionally public-facing and documentation-forward.

Its role is to showcase:

- architectural thinking
- execution-boundary design
- wrapper contracts
- normalized result design
- artifact and evidence modeling
- human-review-oriented workflow design

Some implementation details may remain simplified in public form to keep the repo focused, teachable, and appropriate for open portfolio use.

## Planned folder structure

```text
playwright-agent-wrapper-starter/
├─ README.md
├─ package.json
├─ playwright.config.ts
├─ tests/
│  └─ smoke/
│     └─ example.spec.ts
├─ tools/
│  └─ agent/
│     ├─ runPlaywrightTarget.ts
│     ├─ runPlaywrightTargetCli.ts
│     ├─ validateInputs.ts
│     ├─ playwrightArtifacts.ts
│     └─ resultSchema.ts
├─ artifacts/
│  └─ .gitkeep
├─ docs/
│  ├─ architecture.md
│  ├─ contracts.md
│  ├─ wrapper-contract.md
│  ├─ result-schema.md
│  ├─ artifact-model.md
│  └─ human-review-model.md
└─ examples/
   ├─ generic/
   └─ cursor/
```

## Folder structure notes

This structure is intentionally minimal.

- `tests/` holds a very small Playwright suite used to demonstrate wrapper behavior.
- `tools/agent/` holds the bounded execution layer, validation, artifact collection, and result shaping.
- `artifacts/` is the local evidence/output area for runs.
- `docs/` explains the contract and review model in plain language and formal TypeScript shapes.
- `examples/` is secondary material, not the center of the repo.

The wrapper layer is the main subject of the project.

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

The public contract is defined in both prose and formal TypeScript form.

The prose docs explain the architectural boundary and review model. The contracts doc defines the request, result, artifact, and status shapes more explicitly so the wrapper can be implemented and tested against a stable interface.

## Design principles

This repo is being shaped around a few explicit principles:

- bounded execution is more credible than arbitrary command access
- validation should happen before invocation, not after failure
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

These may be explored later, but they are not necessary to prove the core pattern.

## Status

This project is currently in the design and public-structure phase.

The first milestone is to define a clean wrapper contract, result schema, artifact model, formal contract shapes, and review model before implementation expands.