#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==="object"?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
export const evidenceDigest=value=>createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");

export function evaluateRelease(intent,evidence){
  const contradictions=[];
  const differs=(actual,expected)=>actual!==undefined&&actual!==null&&actual!==expected;
  if(differs(evidence.repository,intent.repository))contradictions.push("repository_mismatch");
  if([evidence.sourceRevision,evidence.workflow?.headSha,evidence.registry?.gitHead].some(value=>differs(value,intent.sourceRevision)))contradictions.push("source_revision_mismatch");
  if([evidence.artifact,evidence.registry?.name].some(value=>differs(value,intent.artifact)))contradictions.push("artifact_mismatch");
  if([evidence.version,evidence.registry?.version].some(value=>differs(value,intent.version)))contradictions.push("version_mismatch");
  if(differs(evidence.workflow?.filename,intent.workflow))contradictions.push("workflow_mismatch");
  if(differs(evidence.registry?.integrity,intent.expectedIntegrity))contradictions.push("integrity_mismatch");
  if(differs(evidence.registry?.channel,intent.channel))contradictions.push("channel_mismatch");
  if(evidence.workflow?.conclusion&&evidence.workflow.conclusion!=="success")contradictions.push("workflow_failed");
  if(evidence.source?.checks&&evidence.source.checks!=="successful")contradictions.push("source_checks_failed");
  if(evidence.source?.reviewed===false)contradictions.push("source_review_missing");
  if(evidence.approval?.exactIntent===false||evidence.approval?.ownerAuthorized===false)contradictions.push("owner_approval_invalid");
  if(differs(evidence.provenance?.predicateType,"https://slsa.dev/provenance/v1")||differs(evidence.provenance?.repository,intent.repository)||differs(evidence.provenance?.sourceRevision,intent.sourceRevision)||differs(evidence.provenance?.workflow,intent.workflow))contradictions.push("provenance_mismatch");
  if(evidence.consumer?.resolvedVersion&&evidence.consumer.resolvedVersion!==intent.version)contradictions.push("consumer_version_mismatch");
  if(evidence.consumer?.contractValid===false)contradictions.push("consumer_incompatible");
  if(contradictions.length)return outcome("FAIL",contradictions,evidence);
  const required=[evidence.repository,evidence.sourceRevision,evidence.artifact,evidence.version,evidence.source?.reviewed,evidence.source?.checks,evidence.approval?.exactIntent,evidence.approval?.ownerAuthorized,evidence.workflow?.runId,evidence.workflow?.filename,evidence.workflow?.headSha,evidence.workflow?.conclusion,evidence.registry?.name,evidence.registry?.version,evidence.registry?.channel,evidence.registry?.gitHead,evidence.registry?.integrity,evidence.registry?.attestationUrl,evidence.provenance?.predicateType,evidence.provenance?.repository,evidence.provenance?.sourceRevision,evidence.provenance?.workflow,evidence.consumer?.resolvedVersion,evidence.consumer?.contractValid,evidence.observedAt];
  if(required.some(value=>value===undefined||value===null||value===""))return outcome("INDETERMINATE",["required_evidence_incomplete"],evidence);
  return outcome("PASS",["exact_release_verified"],evidence);
}

function outcome(result,reasons,evidence){return{result,reasons,evidenceDigest:evidenceDigest(evidence),reconciliation:result==="PASS"?"none":result==="INDETERMINATE"?"reobserve_before_retry":"stop_and_require_investigation_or_new_plan"}}

if(import.meta.url===pathToFileURL(process.argv[1]).href){const input=JSON.parse(await readFile(process.argv[2],"utf8"));process.stdout.write(`${JSON.stringify(evaluateRelease(input.intent,input.evidence),null,2)}\n`)}
