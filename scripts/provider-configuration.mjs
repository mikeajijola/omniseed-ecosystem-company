#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const productionTransport = Object.freeze({ startupTimeoutMs: 15_000, requestTimeoutMs: 360_000 });

export function productionProviderConfiguration(env = process.env) {
  const root = resolve(env.OMNISEED_PROVIDER_ROOT ?? "../providers");
  const providers = [
    {
      id: "github",
      command: "python3",
      args: [resolve(root, "github/provider/github_provider.py")],
      ...productionTransport,
      configuration: {
        repository: "mikeajijola/omniseed-ecosystem-company",
        baseBranch: "main",
        branchPrefix: "omniseed/",
        mergePolicy: {
          requireApproval: true,
          requirePassingChecks: true,
          trustedApprovalChecks: [{ name: "governed-company-change-approval", appSlug: "github-actions" }],
          mergeMethod: "squash"
        }
      }
    },
    {
      id: "vercel",
      command: "python3",
      args: [resolve(root, "vercel/provider/vercel_provider.py")],
      ...productionTransport,
      configuration: compact({
        teamId: env.VERCEL_TEAM_ID,
        statusProjectId: env.VERCEL_STATUS_PROJECT_ID,
        desiredRevision: env.OMNISEED_DESIRED_REVISION,
        runtimeAuthTokenEnv: "LILY_RUNTIME_OBSERVATION_TOKEN"
      })
    },
    {
      id: "neon",
      command: "python3",
      args: [resolve(root, "neon/provider/neon_provider.py")],
      ...productionTransport,
      configuration: compact({
        projectName: env.NEON_PROJECT_NAME ?? "omniseed-ecosystem-runtime",
        projectId: env.NEON_PROJECT_ID,
        organisationId: env.NEON_ORGANISATION_ID,
        regionId: env.NEON_REGION_ID,
        postgresVersion: env.NEON_POSTGRES_VERSION ? Number(env.NEON_POSTGRES_VERSION) : undefined,
        apiKeyEnvironment: "NEON_API_KEY"
      })
    },
    {
      id: "omniseed",
      command: "python3",
      args: [resolve(root, "omniseed/provider/omniseed_provider.py")],
      ...productionTransport,
      configuration: {
        operationEndpoint: env.OMNISEED_OPERATION_ENDPOINT ?? "https://omniseed-ecosystem-os.vercel.app",
        desiredRevision: env.OMNISEED_DESIRED_REVISION,
        credentialEnvironment: "OMNISEED_PROVIDER_OPERATION_TOKEN"
      }
    }
  ];
  if (env.OMNICEDE_DATABASE_PATH) providers.push({
    id: "omnicede",
    command: resolve(root, "omnicede/target/release/omniseed_provider"),
    args: [],
    ...productionTransport,
    configuration: { databasePath: env.OMNICEDE_DATABASE_PATH }
  });
  return providers;
}

function compact(value) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== "")); }

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv[2];
  if (!output) throw new Error("Provider configuration output path is required.");
  await writeFile(resolve(output), `${JSON.stringify(productionProviderConfiguration(), null, 2)}\n`, { mode: 0o600 });
}
