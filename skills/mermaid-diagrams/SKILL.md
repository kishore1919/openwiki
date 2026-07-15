---
name: mermaid-diagrams
description: Author and validate Mermaid diagrams inside OpenWiki documentation. Use when a documentation page needs an architecture, flow, sequence, ER, class, or state diagram.
---

# Mermaid Diagrams in OpenWiki

OpenWiki documentation is Markdown rendered for both humans and future agents. Mermaid diagrams make architecture, data flow, and interactions scannable. Use them when a picture clarifies structure better than prose.

## When To Use A Diagram

- **Architecture / component layout** — how services, modules, or repos fit together.
- **Control or data flow** — `graph` / `flowchart` for pipelines, request paths, build steps.
- **Interactions** — `sequenceDiagram` for multi-actor or multi-service call flows.
- **Data models** — `classDiagram` or `erDiagram` for entities and relationships.
- **State machines** — `stateDiagram` for lifecycle or status transitions.

Do not force a diagram where a short paragraph is clearer, and never put secrets, tokens, or credentials in a diagram.

## Required Shape

- Use exactly one fenced block per diagram with the `mermaid` info string:

  ````markdown
  ```mermaid
  graph TD
    A[Source] --> B[Agent]
    B --> C[Wiki]
  ```
  ````

- Keep each diagram focused. Prefer several small diagrams over one giant all-in-one diagram.
- Always add a human-readable title for accessibility:

  ````markdown
  ```mermaid
  flowchart LR
    title Onboarding flow
    U[User] --> L[Login]
    L --> W[Wiki]
  ```
  ````

- Explain the key takeaway in the surrounding prose. The diagram supplements, it does not replace, the explanation.

## Syntax Rules

- Declare every node before referencing it.
- Keep labels plain; avoid characters that break Mermaid parsing.
- Use supported diagram types only (graph, flowchart, sequenceDiagram, classDiagram, erDiagram, stateDiagram, gantt, pie, mindmap, timeline, gitGraph, and similar stable types). Avoid deprecated or experimental syntax.
- Prefer `graph`/`flowchart` for flows, `sequenceDiagram` for interactions, and `erDiagram`/`classDiagram` for data models.

## Validation

OpenWiki validates every Mermaid block after generation. A broken diagram fails the run and must be fixed.

- Validate one or more files or directories:

  ```bash
  openwiki mermaid openwiki/architecture
  openwiki mermaid path/to/page.md
  ```

- With no arguments it scans the repository `openwiki/` directory and the local personal wiki (`~/.openwiki/wiki`).
- The command exits non-zero when any diagram is invalid, printing the file and the 1-based line of the offending fence.

If a diagram fails validation, fix the Mermaid source (usually an undeclared node, a typo in the diagram type, or unsupported syntax) and re-run `openwiki mermaid` until it passes.
