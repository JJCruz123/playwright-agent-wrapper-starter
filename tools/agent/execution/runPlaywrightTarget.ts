import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  InputValidationError,
  type NormalizedPlaywrightTarget,
  type PlaywrightTargetRequest,
  validateAndNormalizeTarget,
} from "../contract/validateInputs";
import { collectPlaywrightArtifacts } from "../observation/playwrightArtifacts";
import {
  createExecutionErrorResult,
  createFailedResult,
  createPassedResult,
  createValidationErrorResult,
  type PlaywrightRunResult,
} from "../contract/resultSchema";

function buildPlaywrightCliArgs(target: NormalizedPlaywrightTarget): string[] {
  const args = ["test", `--project=${target.project}`];

  if (target.spec) {
    args.push(target.spec);
  }

  if (target.grep) {
    args.push("--grep", target.grep);
  }

  if (target.headed) {
    args.push("--headed");
  }

  if (target.workers !== null) {
    args.push(`--workers=${target.workers}`);
  }

  return args;
}

function buildCommandString(cliArgs: string[]): string {
  return ["npx", "playwright", ...cliArgs].join(" ");
}

function fallbackNormalizedTarget(input: Partial<PlaywrightTargetRequest>): NormalizedPlaywrightTarget {
  return {
    project: input.project === "smoke" ? "smoke" : "smoke",
    spec: typeof input.spec === "string" ? input.spec : null,
    grep: typeof input.grep === "string" ? input.grep : null,
    headed: typeof input.headed === "boolean" ? input.headed : false,
    workers: typeof input.workers === "number" && Number.isInteger(input.workers) ? input.workers : null,
  };
}

function resolvePlaywrightCliScriptPath(): string {
  const cliPath = path.join(process.cwd(), "node_modules", "playwright", "cli.js");

  if (!fs.existsSync(cliPath)) {
    throw new Error(`Could not find local Playwright CLI at ${cliPath}`);
  }

  return cliPath;
}

export function runPlaywrightTarget(input: PlaywrightTargetRequest): PlaywrightRunResult {
  let target: NormalizedPlaywrightTarget;

  try {
    target = validateAndNormalizeTarget(input);
  } catch (error) {
    const artifacts = collectPlaywrightArtifacts();

    if (error instanceof InputValidationError) {
      return createValidationErrorResult({
        target: fallbackNormalizedTarget(input),
        artifacts,
        code: error.code,
        detail: error.message,
      });
    }

    return createValidationErrorResult({
      target: fallbackNormalizedTarget(input),
      artifacts,
      code: "INVALID_PROJECT",
      detail: error instanceof Error ? error.message : "Unknown validation error.",
    });
  }

  let cliArgs: string[];
  let cliScriptPath: string;

  try {
    cliArgs = buildPlaywrightCliArgs(target);
    cliScriptPath = resolvePlaywrightCliScriptPath();
  } catch (error) {
    return createExecutionErrorResult({
      target,
      command: null,
      exitCode: null,
      artifacts: collectPlaywrightArtifacts(),
      code: "COMMAND_CONSTRUCTION_FAILED",
      detail: error instanceof Error ? error.message : "Failed to construct Playwright command.",
    });
  }

  const command = buildCommandString(cliArgs);

  const result = spawnSync(process.execPath, [cliScriptPath, ...cliArgs], {
    stdio: "inherit",
    shell: false,
  });

  const artifacts = collectPlaywrightArtifacts();

  if (result.error) {
    return createExecutionErrorResult({
      target,
      command,
      exitCode: null,
      artifacts,
      code: "PROCESS_LAUNCH_FAILED",
      detail: result.error.message,
    });
  }

  const exitCode = result.status;

  if (exitCode === null) {
    return createExecutionErrorResult({
      target,
      command,
      exitCode: null,
      artifacts,
      code: "PROCESS_COMPLETION_FAILED",
      detail: "Playwright process did not report an exit code.",
    });
  }

  if (exitCode === 0) {
    return createPassedResult({
      target,
      command,
      exitCode,
      artifacts,
    });
  }

  if (exitCode === 1) {
    return createFailedResult({
      target,
      command,
      exitCode,
      artifacts,
    });
  }

  return createExecutionErrorResult({
    target,
    command,
    exitCode,
    artifacts,
    code: "PROCESS_COMPLETION_FAILED",
    detail: `Playwright process exited with unexpected code ${exitCode}.`,
  });
}