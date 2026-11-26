# FlagGuard — Flagsmith Configuration Safety & Forensics CLI

## 1. Project Overview

Build **FlagGuard**, an open-source, CLI-first developer tool that extends the Flagsmith ecosystem by combining three capabilities:

1. **Environment Drift Detection** — detect and explain configuration differences between Flagsmith environments such as Development, Staging and Production.
2. **Change Forensics** — investigate feature-flag configuration changes using available Flagsmith audit events, history and configuration snapshots.
3. **Safe Configuration Synchronization** — allow developers to selectively synchronize configuration between environments through a previewable, validated and human-approved workflow.

### Core Product Promise

"Know what changed, understand why your environments differ, and synchronize configuration safely — without accidentally breaking production."

FlagGuard should feel like a practical developer tool that engineers would actually install and use, not a generic dashboard or an AI-generated hackathon prototype.

## 2. The Problem We Are Solving

Teams using feature flags often maintain multiple environments.

For example:
- Development contains the latest feature configuration.
- Staging contains a slightly older configuration.
- Production contains a different set of enabled states, values or segment overrides.

This creates several problems:

- Developers don't always know which configurations differ between environments.
- A feature can behave unexpectedly because its production configuration differs from staging.
- Raw configuration JSON is difficult to inspect manually.
- Audit events may not clearly explain the actual configuration change.
- Synchronizing configuration manually can introduce accidental production changes.
- Developers need a safe way to inspect, understand and selectively apply changes.

Flagsmith provides the feature-flag management foundation. FlagGuard adds a developer-friendly safety and investigation workflow around it.

## 3. Product Vision

FlagGuard should become a reusable developer utility for Flagsmith users, especially teams operating self-hosted or multi-environment deployments.

The product should provide one connected workflow:

**Compare → Investigate → Plan → Preview → Approve → Synchronize → Verify**

It should be CLI-first, scriptable, documented and easy to run locally or through CI/CD.

## 4. Core Modules

### Module A — Environment Drift Detection

Compare two Flagsmith environments and identify configuration differences.

Example:

`flagguard compare staging production`

Expected output:

- Features missing from either environment.
- Enabled/disabled state differences.
- Feature value differences.
- Multivariate option and allocation differences, where supported.
- Segment-related configuration differences, where accessible.
- Other supported environment-level configuration differences.

Display differences in a readable, categorized format.

Every difference should clearly indicate:
- Configuration item.
- Source environment value.
- Target environment value.
- Difference type.
- Potential action.

Do not report unsupported or unavailable configuration as identical. Distinguish unavailable data from actual equality.

### Module B — Change Forensics

Help developers understand the history behind configuration differences.

Example:

`flagguard inspect checkout_redesign`

Where the Flagsmith API provides the required information, show:

- Feature or configuration item.
- Environment.
- Available change timestamp.
- Available actor information.
- Previous and current values.
- Relevant audit event.
- Related configuration differences.

Provide semantic diffs for nested configuration such as segment rules whenever sufficient previous and current snapshots are available.

Important: Do not invent historical values or actor identities. If Flagsmith does not expose enough information, clearly label the limitation.

### Module C — Safe Synchronization

Allow developers to prepare a controlled synchronization plan.

Example:

`flagguard plan staging production`

The tool should:

1. Compare the source and target.
2. Generate a list of proposed changes.
3. Allow developers to select specific changes.
4. Validate the proposed operations.
5. Detect conflicts or missing dependencies where possible.
6. Produce a reviewable plan.
7. Support dry-run without modifying the target.
8. Require explicit confirmation before applying changes.
9. Verify the resulting target configuration after applying.

Never silently overwrite production.

Never assume that every configuration object can be copied safely. Use only supported Flagsmith API operations and document limitations.

### Module D — Reports

Generate a human-readable investigation or drift report.

Support:
- Terminal output.
- JSON output for automation.
- Markdown report for sharing and debugging.

Reports should include timestamps, source and target environments, detected differences, proposed operations and execution results.

## 5. Example CLI Experience

The following is the intended product interface. Commands should be adapted to the actual implementation and supported operations.

```bash
# Check connection and configuration
flagguard doctor

# List accessible projects and environments
flagguard environments

# Compare staging with production
flagguard compare staging production

# Investigate one feature flag
flagguard inspect checkout_redesign

# Show available change history
flagguard history checkout_redesign

# Generate a synchronization plan
flagguard plan staging production

# Preview proposed changes without modifying anything
flagguard apply --dry-run

# Apply after explicit approval
flagguard apply

# Verify the resulting configuration
flagguard verify staging production

# Export a report
flagguard report --format markdown
```

## 6. Important Product Principles

### Safety first
- Read-only comparison must be safe by default.
- Dry-run must never modify Flagsmith.
- Production changes must require explicit approval.
- Never expose API keys or sensitive credentials in logs.
- Never apply changes based on an unreviewed or stale plan.
- Revalidate the target state before applying a plan.
- Handle partial failures and report exactly what succeeded or failed.

### Accuracy over feature count
- Use real Flagsmith data.
- Do not fabricate audit events or historical snapshots.
- Do not pretend unsupported API operations work.
- Clearly distinguish current configuration from historical information.
- Preserve unknown fields where safe and supported.

### Developer experience
- Clear terminal output.
- Helpful error messages.
- Useful exit codes.
- JSON output for scripting.
- Configuration through environment variables or a secure local configuration mechanism.
- Straightforward installation and setup.

### Reusability
- Open-source repository.
- Clean modular architecture.
- Well-documented commands.
- Automated tests.
- Docker support if appropriate.
- Example workflows for local development and CI/CD.

## 7. Suggested Technical Direction

First inspect the existing Flagsmith API, official CLI, SDKs, documentation and repository capabilities.

Proposed implementation direction:

- Language: TypeScript.
- Runtime: Node.js.
- CLI framework: choose a lightweight, maintained framework.
- HTTP client: use a reliable typed HTTP client.
- Validation: use schema validation for API responses and synchronization plans.
- Testing: unit tests and integration tests.
- Distribution: npm package.
- Optional visual report: a small, polished HTML or Markdown report; the CLI remains the primary product.

Do not select dependencies blindly. Check maintenance, compatibility and licensing before adding them.

Use official Flagsmith APIs wherever possible. Avoid depending on private or undocumented endpoints.

Support self-hosted Flagsmith instances through a configurable base URL, as well as Flagsmith Cloud where compatible.

## 8. Hackathon MVP — Strict Priorities

This is a short hackathon project. Do not build an unnecessarily broad platform.

### P0 — Must work

1. Connect to a real Flagsmith instance.
2. Discover projects and environments.
3. Retrieve supported configuration.
4. Compare two environments.
5. Show accurate, readable drift.
6. Generate a synchronization plan.
7. Dry-run the proposed changes.
8. Apply selected supported changes only after explicit confirmation.
9. Verify the result.
10. Include automated tests and clear setup instructions.

### P1 — Important differentiators

1. Audit event integration.
2. Feature-level investigation.
3. Actor attribution where available.
4. Semantic segment-rule differences.
5. Markdown and JSON reports.

### P2 — Only after the MVP works

1. Rich HTML investigation reports.
2. CI/CD integration.
3. Advanced filtering.
4. Historical comparison and trend views.

Do not begin P1 or P2 while P0 is broken.

## 9. Architecture Expectations

Keep the project modular.

Suggested structure:

```text
flagguard/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   └── output/
│   ├── flagsmith/
│   │   ├── client/
│   │   ├── projects/
│   │   ├── environments/
│   │   ├── features/
│   │   └── audit/
│   ├── drift/
│   │   ├── comparator/
│   │   ├── normalizer/
│   │   └── diff/
│   ├── forensics/
│   │   ├── history/
│   │   └── investigation/
│   ├── sync/
│   │   ├── planner/
│   │   ├── validator/
│   │   ├── executor/
│   │   └── verifier/
│   ├── reports/
│   ├── config/
│   └── utils/
├── tests/
├── examples/
├── README.md
├── package.json
└── tsconfig.json
```

Adjust this structure if a simpler design is more appropriate. Avoid unnecessary abstractions.

## 10. Demo Scenario

The final demo should tell one complete story.

Scenario:

A team has a checkout redesign feature in both Staging and Production.

1. A developer runs FlagGuard.
2. FlagGuard detects that the feature's configuration differs between environments.
3. The developer investigates the feature and sees available change history.
4. FlagGuard explains the differences with a readable diff.
5. The developer generates a synchronization plan.
6. The developer previews the exact proposed changes.
7. The developer approves the operation.
8. FlagGuard applies the supported changes.
9. FlagGuard verifies that the target now matches the intended configuration.
10. A final report records the operation.

The demo must use actual Flagsmith data and real API operations. Clearly identify any simulated scenario data.

## 11. Hackathon Requirements

The project is being built for Toggle Wars, Track 03 — Build on Open Source Flagsmith.

Flagsmith must be central to the product, not an incidental API integration.

The submission should include:

- Public GitHub repository.
- Clear README.
- Installation and configuration instructions.
- Explanation of Flagsmith integration.
- Architecture overview.
- Working demo.
- Short demo video.
- Example commands and outputs.
- Tests and known limitations.

Prioritize a polished, complete, working solution over a large collection of unfinished features.

## 12. Important Research Before Implementation

Before writing application code, investigate:

1. What the official Flagsmith CLI already supports.
2. What the Flagsmith API supports for environment configuration retrieval and updates.
3. Existing environment-level and project-level export/import functionality.
4. Available audit-log endpoints and webhook payloads.
5. Whether previous and current values are available for each relevant audit event.
6. Whether segment rules and feature-state values can be retrieved and compared reliably.
7. Which operations are safe and supported for selective synchronization.
8. Whether there are existing open-source tools with overlapping functionality.

Create a capability matrix:

| Capability | Officially supported? | API/endpoint | Implementation decision |
|---|---|---|---|
| Environment discovery | To verify | To verify | Pending |
| Configuration retrieval | To verify | To verify | Pending |
| Feature comparison | To verify | To verify | Pending |
| Audit history | To verify | To verify | Pending |
| Segment rule history | To verify | To verify | Pending |
| Selective configuration updates | To verify | To verify | Pending |
| Post-sync verification | To verify | To verify | Pending |

Do not guess API endpoints or payload structures.

## 13. Instructions to the AI Coding Agent

Act as a senior developer and technical mentor.

Work incrementally:

1. Research the official Flagsmith API and existing CLI capabilities.
2. Identify overlaps and technical limitations.
3. Present a concise architecture and implementation plan.
4. Identify the smallest working MVP.
5. Implement one module at a time.
6. Write tests alongside implementation.
7. Run tests and fix errors before moving forward.
8. Explain important technical decisions.
9. Keep the project easy for a student developer to understand and maintain.
10. Maintain a checklist of completed and pending work.

Do not:
- Generate the entire project in one huge code dump.
- Invent API endpoints or response formats.
- Create a generic dashboard instead of a useful developer tool.
- Build an AI chatbot as the main feature.
- Add blockchain, tokens or unrelated technologies.
- Use fake data as proof of real integration.
- Claim a feature works without testing it.
- Over-engineer the MVP.
- Implement dangerous production changes without safeguards.

If a technical capability is uncertain, investigate it before implementing it.

## 14. Definition of Done

FlagGuard is ready for submission when a new developer can:

1. Install it.
2. Configure a real Flagsmith instance.
3. Discover their environments.
4. Compare two environments.
5. Understand detected differences.
6. Investigate relevant available changes.
7. Generate and review a sync plan.
8. Run a dry-run.
9. Approve and execute supported changes.
10. Verify the result.
11. Read the documentation and reproduce the demo.

**Final product identity:**

FlagGuard is a Flagsmith ecosystem developer tool for configuration safety, environment consistency and change forensics.

It helps developers answer three questions:

- What is different between my environments?
- What changed, and who or what changed it?
- How can I synchronize the intended configuration without accidentally breaking production?

Build this as one cohesive, reliable, reusable open-source product.




Read the complete FlagGuard project brief carefully.

Do not write code yet.

First, perform a technical feasibility investigation using official Flagsmith documentation, API references, official CLI documentation and the relevant open-source repository.

I specifically need you to identify:
1. Existing functionality that overlaps with FlagGuard.
2. Exact API endpoints and response structures needed for environment comparison.
3. Available audit-log data and historical limitations.
4. Supported configuration update operations for safe synchronization.
5. What can realistically be implemented and tested within this hackathon.

Create a capability matrix with verified sources and classify each feature as:
- Confirmed supported
- Partially supported
- Not supported
- Needs further investigation

Then recommend a realistic MVP architecture and implementation sequence.

Do not invent endpoints, claim unverified capabilities or start implementation before presenting the findings.


## Track 03 Alignment — Critical Project Instructions

You are building FlagGuard specifically for **Toggle Wars Track 03: Build on Open Source Flagsmith**.

The objective is to create a genuinely useful, reusable developer tool built around the open-source Flagsmith platform.

### 1. Follow the judging criteria

Optimize the project for:

- **Flagsmith integration:** Flagsmith must be central to the product, not an optional API integration.
- **Real-world impact:** Solve a genuine developer problem that Flagsmith users experience.
- **Creativity:** Deliver meaningful functionality beyond existing Flagsmith CLI, dashboard, export/import and API capabilities.
- **Demo quality:** Make the problem, workflow, and practical value immediately understandable.

### 2. Research before implementation

Before writing code:

- Inspect the official Flagsmith documentation, CLI, API and GitHub repository.
- Identify existing functionality that overlaps with FlagGuard.
- Investigate relevant GitHub issues and feature requests.
- Verify every API endpoint and its actual request/response structure.
- Identify which operations are officially supported.
- Clearly distinguish confirmed capabilities from assumptions.

Never invent endpoints, features, audit history or API responses.

### 3. Build around real Flagsmith

- Connect to a real Flagsmith instance.
- Prioritize self-hosted Flagsmith compatibility.
- Use supported APIs and documented authentication methods.
- Demonstrate actual environment comparison.
- Make drift detection accurate and reproducible.
- Generate selective synchronization plans.
- Support dry-run, explicit approval and post-sync verification.
- Handle errors, partial failures and stale plans safely.

### 4. Maintain strict scope

Prioritize a small, complete and reliable MVP.

Do not waste time on:
- Unnecessary AI features.
- Decorative dashboards.
- Features unrelated to configuration safety.
- Reimplementing existing Flagsmith functionality.
- Unsupported or speculative integrations.

Do not expand scope without explaining the judging value and implementation cost.

### 5. Product quality

FlagGuard should feel like a real developer tool:

- Clear CLI commands and helpful terminal output.
- Consistent error messages.
- Secure credential handling.
- Useful documentation and copy-paste setup instructions.
- Automated tests with realistic fixtures.
- Reusable architecture and npm packaging.
- A working demonstration using real Flagsmith data.

### 6. Demo-first engineering

Design the MVP around one compelling scenario:

A developer discovers that staging and production have different feature-flag configurations. FlagGuard identifies the drift, explains the differences, generates a selective sync plan, previews the changes, requests approval, applies supported changes and verifies the result.

Every major feature should strengthen this demonstration.

### 7. Decision-making rule

Before implementing any feature, answer:

1. Does it solve a real Flagsmith developer problem?
2. Is it already available in Flagsmith?
3. Does it improve the Track 03 judging criteria?
4. Can we implement and demonstrate it reliably before the deadline?

If the answer is unclear, investigate before coding.

**Final objective:** Ship a polished, working, open-source Flagsmith developer tool—not merely a prototype that looks impressive.