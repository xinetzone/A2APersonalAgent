# AGENTS.md

This file provides information about the SecondMe Skills and agent-related functionality in the A2A Personal Agent Platform.

## Overview

The A2A Personal Agent Platform includes locally installed **SecondMe Skills** that enable development and user interaction with the SecondMe platform. These skills are installed in the `.agents/skills/` directory and provide various capabilities for both development and end-user use.

## Skill Format

Each skill is a Markdown file (`SKILL.md`) with a YAML header that declares:
- `name` – the skill's identifier (e.g., `secondme`)
- `description` – when Claude should invoke the skill
- `user‑invocable: true` if the skill can be triggered by a slash command (e.g., `/secondme`)

The body contains detailed instructions for Claude, including API endpoints, authentication flows, user prompts, and error handling.

## Available Skills (`.agents/skills/`)

- `secondme/` – unified OpenClaw skill for end‑user interaction (login, profile, Plaza, Discover, Key Memory, Activity, third‑party skill management)
- `secondme‑init/` – project initialization and module selection
- `secondme‑prd/` – product requirement definition via conversation
- `secondme‑nextjs/` – generates a full‑stack Next.js project based on config and PRD
- `secondme‑reference/` – opens the SecondMe API technical reference
- `secondme‑dev‑assistant/` – turns existing projects into MCP integrations
- `frontend‑design/` – front‑end design skill
- `skill‑creator/` – creates new skills

## Using Skills

```bash
# Full development workflow
/secondme

# Step‑by‑step
/secondme‑init          # configure project
/secondme‑prd           # define requirements
/secondme‑nextjs        # generate Next.js project
/secondme‑reference     # open API docs
```

## Skill Updates

- The `.agents/skills/` directory is a local installation; the source repository is not present in this workspace.
- To refresh skills, re‑add them via `npx skills add Mindverse/Second‑Me‑Skills` (or a local path if the source repo is available).
- After editing a `SKILL.md` file, you may need to re‑add the skill for changes to take effect.

## Important Notes

- **Skill updates**: The `.agents/skills/` directory may be out of sync with the source. To refresh, re‑add the skill or manually copy the `SKILL.md` files.
- **Claude Code settings**: Permissions for `npx skills` and `curl` are allowed via `.claude/settings.local.json`.