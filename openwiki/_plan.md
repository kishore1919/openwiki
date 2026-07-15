# OpenWiki Documentation Plan

## Goals
Create a high-quality, agent-friendly wiki for the OpenWiki repository. Focus on architecture, CLI usage, connector mechanics, and the duality of "Code Mode" vs "Personal Mode".

## Proposed Structure

### 1. Quickstart (`/openwiki/quickstart.md`)
- **Purpose**: Entry point and high-level map.
- **Content**: 
    - What is OpenWiki? (CLI for agent wikis).
    - Core modes: Code Mode vs. Personal Mode.
    - Fast-track installation and initialization.
    - Links to all other sections.
    - Backlog of deferred areas.

### 2. Architecture (`/openwiki/architecture/overview.md`)
- **Purpose**: Explain the system design.
- **Content**:
    - Agentic Loop: How `deepagents` is used to drive the documentation process.
    - Data Flow: Connector $\rightarrow$ Raw Storage $\rightarrow$ Agent $\rightarrow$ Wiki.
    - State Management: Environment variables, `.env` handling, and `.last-update.json`.
    - Provider Logic: Support for Anthropic, OpenAI, OpenRouter, and Ollama Cloud.

### 3. CLI & Commands (`/openwiki/cli/usage.md`)
- **Purpose**: Technical reference for the CLI surface.
- **Content**:
    - Command reference: `--init`, `--update`, `personal`, `-p`.
    - Interactive mode vs. non-interactive (CI) mode.
    - Command routing in `src/commands.ts` and `src/cli.tsx`.

### 4. Connectors (`/openwiki/connectors/overview.md`)
- **Purpose**: Detail how external knowledge is ingested.
- **Content**:
    - Connector Registry: How sources are defined in `src/connectors/sources/`.
    - Built-in sources: Git-repo, Gmail, Slack, X, Web-search, HackerNews.
    - MCP Integration: Using MCP-backed connectors.
    - The "Write-Connector Skill": How the agent can actually build new connectors.

### 5. Operations & Maintenance (`/openwiki/operations/runbook.md`)
- **Purpose**: Guide for deploying and maintaining the wiki.
- **Content**:
    - Credentials setup and OAuth flows (specifically ChatGPT/OpenAI).
    - CI/CD integration (GitHub Actions, GitLab CI, Bitbucket Pipelines).
    - Environment variable management (`src/env.ts`).

### 6. Source Map (`/openwiki/source-map.md`)
- **Purpose**: Quickly link concepts to code.
- **Content**:
    - Mapping of core logic to files (e.g., Prompting $\rightarrow$ `src/agent/prompt.ts`).

## Source Evidence Mapping
- **Architecture**: `src/agent/index.ts`, `src/agent/prompt.ts`, `package.json`.
- **CLI**: `src/cli.tsx`, `src/commands.ts`, `README.md`.
- **Connectors**: `src/connectors/sources/`, `src/connectors/registry.ts`, `src/connectors/tools.ts`.
- **Ops/Auth**: `src/auth/`, `src/env.ts`, `examples/`.

## Open Questions
- How exactly does the "Personal Mode" differ in its filesystem constraints compared to "Code Mode" at the implementation level? (Need to check `src/openwiki-home.ts`).
- What is the exact trigger mechanism for the `openwiki-update.yml` workflow?
