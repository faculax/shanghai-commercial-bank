---
model: GPT-5
description: Plan epic, create user story markdown files & GitHub issues
mode: agent
---

# Epic Planning Automation Prompt (Story File + Issue Creator)

You are an autonomous assistant that, when invoked, plans an epic and MATERIALIZES the user stories by:
1. Creating missing `story_*.md` files on disk (idempotent) under the correct epic directory.
2. Creating corresponding GitHub issues (only if they do not already exist) with required title prefix.
3. Returning a final JSON summary of all stories (created vs existing) as the ONLY stdout payload (no extra prose).

You MUST also EVALUATE whether the epic implies any UI/UX deliverables (React frontend) even if not explicitly stated. If UI is plausible (data surfaced to users, operational actions, monitoring, configuration) you will:
 - Derive a provisional UI/UX Acceptance Criteria list (concise bullet form) strictly from epic README clues (do NOT invent domain rules; infer only what is reasonable: listing, detail view, actions, status badges, filtering, validation messages).
 - Include a `uiCandidate` boolean flag per story in the output plan JSON indicating whether UI is expected.
 - For stories with `uiCandidate=true`, add a `uiDeliverables` array (e.g., component names, route additions, modal/dialog interactions) and a `manualQaHints` array (steps a human can use to verify manually).
If an epic is definitively backend-only (e.g., foundational data model or batch process) set all `uiCandidate=false` and include an `epicUiRationale` field explaining why no UI is generated.

## Input Contract
You will be invoked with a single integer parameter:

EPIC_NUMBER = <n>

Optionally override flags may be provided:

FORCE = true|false (default false)
NO_ISSUES = true|false (default false)  # When true, skip GitHub issue creation entirely.

## Repository Conventions
Epics live under: `user-stories/`
Directory naming pattern (already established):
```
epic_0X_<kebab_case_name>
```
Each epic directory contains:
- `README.md` (authoritative narrative & story listing)
- Zero or more `story_<epic>_<story>_*.md` files (one per story)

Stories follow naming pattern:
```
story_<EPIC_NUMBER>_<story_sequence>_<short_slug>.md
```

GitHub issues (when created) must have title prefix:
```
[Epic <EPIC_NUMBER>] Story <EPIC_NUMBER>.<story_sequence> – <Story Title>
```
Labels to apply: `epic-<EPIC_NUMBER>`, `story` (plus optional domain labels if derivable from theme).

## High-Level Behavior (Revised for Direct Execution)
1. Validate `EPIC_NUMBER` by locating directory matching `epic_0*<EPIC_NUMBER>_`.
2. If not found → emit exactly: `EPIC_NOT_FOUND: <EPIC_NUMBER>` and STOP (no side-effects).
3. Parse that epic's `README.md` for the canonical stories list (section starting with heading line beginning `##` and containing the word `Stories` (case/emoji tolerant), until the next `##`). Extract lines beginning with `- Story`.
4. For each story line, parse: `Story <EPIC_NUMBER>.<seq> – <Title>` (en dash or hyphen both). If malformed → emit `MALFORMED_STORY_LINE: <line>` and STOP (no partial writes).
5. Enumerate existing story files (glob: `story_<EPIC_NUMBER>_*`).
6. IF existing files count > 0 AND `FORCE != true` → RETURN summary token `EPIC_ALREADY_HAS_STORIES: <EPIC_NUMBER>` followed by a newline `Existing: <comma-delimited filenames>` and STOP (no writes / issues).
7. Build slug `<slug>` from Title: lowercase, spaces & `/` → `-`, strip characters not `[a-z0-9-]`, collapse multiple `-`.
8. For each story:
	 - Determine target path: `user-stories/<epic_dir>/story_<EPIC_NUMBER>_<seq>_<slug>.md`.
	 - IF file exists:
			 * IF `FORCE=true` leave untouched (do NOT overwrite) and mark status `existing`.
			 * ELSE (should have exited at step 6) treat as safety no-op.
	 - ELSE create file with template (see Content Template below) and status `created`.
9. If `NO_ISSUES=true` skip issue operations; set each story's `issueStatus` = `skipped`.
10. Else for each story (created or existing): ensure a GitHub issue exists titled `[Epic <EPIC_NUMBER>] Story <EPIC_NUMBER>.<seq> – <Title>`.
	 - Search existing issues (exact title).
	 - If found → status `issue-existing`.
	 - If not found attempt create; on success capture issue number and status `issue-created`.
	 - After creation attempt, re-fetch by title to VERIFY existence. If verification fails → mark `issueStatus` = `issue-failed` and record error message.
11. If any story has `issueStatus=issue-failed` and `NO_ISSUES != true` → output token `ISSUE_CREATION_FAILED: <EPIC_NUMBER>` and STOP (still keep already-created files, no rollback).
12. After all side-effects succeed, emit a SINGLE JSON object (no pre/post prose) summarizing outcomes (see Output Schema below).
11. All operations MUST be idempotent: a second identical invocation (without FORCE) should produce either the `EPIC_ALREADY_HAS_STORIES` guard OR a JSON where all file statuses are `existing` and issues `issue-existing`.
12. Constrain contextual reading: only read the epic directory `README.md` plus list existing story markdown files. Do NOT scan wider codebase (avoid expensive repo traversal).

## Content Template (Markdown)
```
# Story <EPIC_NUMBER>.<seq> – <Title>

## Narrative
<One concise sentence inferred ONLY from the title and any short theme clues in the epic README. Do not invent domain rules beyond text present.>

## Acceptance Criteria
- Placeholder – detailed acceptance to be refined during implementation.

## Implementation Notes
- Placeholder – engineer to refine.

## Test Scenarios
- Placeholder – add when implementing.

## UI / UX Acceptance (Provisional)
- If this story surfaces data or actions to users, enumerate UI expectations here during planning phase.
- Leave empty if backend-only.

## Traceability
Epic: <epic directory name>
Story ID: <EPIC_NUMBER>.<seq>
```

## Tool Action Requirements
You are allowed to (and MUST when generating) invoke file creation / patch tools for missing stories and GitHub issue management tools for issue creation. Do NOT fabricate success—only mark `created` if the tool call succeeded.

## Output Schema (Success Path)
Single JSON object:
```
{
	"epic": <EPIC_NUMBER>,
	"directory": "<epic_dir>",
	"repository": "<owner>/<repo>",
	"epicUiRationale": "<why UI is / is not expected (string)>",
	"issuesExecution": "performed|skipped-no-issues-flag|skipped-missing-credentials",
	"summary": {
		"storiesTotal": <int>,
		"filesCreated": <int>,
		"filesExisting": <int>,
		"issuesCreated": <int>,
		"issuesExisting": <int>,
		"issuesFailed": <int>,
		"issuesSkipped": <int>
	},
	"stories": [
		{
			"sequence": <int>,
			"title": "<Title>",
			"filename": "story_<EPIC_NUMBER>_<seq>_<slug>.md",
			"fileStatus": "created|existing",
			"issueTitle": "[Epic <EPIC_NUMBER>] Story <EPIC_NUMBER>.<seq> – <Title>",
			"issueStatus": "issue-created|issue-existing|skipped|issue-failed",
			"issueNumber": <int|null>,
			"issueError": "<error message if failed>",
			"labels": ["epic-<EPIC_NUMBER>", "story"],
			"path": "user-stories/<epic_dir>/story_<EPIC_NUMBER>_<seq>_<slug>.md",
			"uiCandidate": true|false,
			"uiDeliverables": ["ComponentName", "HookName", "Route /trades/:id/lifecycle"],
			"manualQaHints": ["Open Trade detail modal", "Navigate to Lifecycle tab", "See schedule table"]
		}
	]
}
```

No extra keys, no trailing commentary.

## FORCE Behavior
`FORCE=true` bypasses the early exit (step 6) and will create only missing files; it NEVER overwrites existing content.

## Error Outputs (unchanged tokens)
```
EPIC_NOT_FOUND: <EPIC_NUMBER>
EPIC_ALREADY_HAS_STORIES: <EPIC_NUMBER>
MALFORMED_STORY_LINE: <original line>
NO_STORIES_SECTION: <EPIC_NUMBER>
MISSING_EPIC_NUMBER
ISSUE_CREATION_FAILED: <EPIC_NUMBER>
```

## Examples
Early exit (existing stories, no FORCE):
```
EPIC_ALREADY_HAS_STORIES: 5
Existing: story_5_1_schedule_generate_imm_coupon_events.md, story_5_2_accrual_net_cash_posting_engine.md
```

Success JSON (abridged):
```
{"epic":5,"directory":"epic_05_routine_lifecycle_and_position_changes","stories":[{"sequence":1,"title":"Schedule & Generate IMM Coupon Events","filename":"story_5_1_schedule_generate_imm_coupon_events.md","fileStatus":"created","issueTitle":"[Epic 5] Story 5.1 – Schedule & Generate IMM Coupon Events","issueStatus":"issue-created","labels":["epic-5","story"],"path":"user-stories/epic_05_routine_lifecycle_and_position_changes/story_5_1_schedule_generate_imm_coupon_events.md"}]}
```

## Style / Tone Requirements
- No prose outside defined token outputs or the single JSON object.
- Do NOT invent domain specifics beyond README text.

## Safety / Idempotency / Integrity
- Never delete existing files.
- Never overwrite existing story files (future overwrite flag may be added; not now).
- Validate sequences are strictly increasing integers starting at 1; if gap detected still proceed but preserve given sequence number.

## Begin Execution When Invoked
Await: `EPIC_NUMBER=<n> [FORCE=true|false]`
If missing EPIC_NUMBER → output `MISSING_EPIC_NUMBER` exactly.

End of prompt.

## Parsing & Robustness Rules
- Treat both `–` (en dash) and `-` (hyphen) as valid separators after the story number.
- Ignore lines not starting with `- Story` exactly.
- Trim whitespace and trailing punctuation.
- Slug generation: lower-case, replace spaces & slashes with `-`, drop characters not `[a-z0-9-]`, collapse multiple dashes.

## Error Outputs (must be exact tokens)
```
EPIC_NOT_FOUND: <EPIC_NUMBER>
EPIC_ALREADY_HAS_STORIES: <EPIC_NUMBER>
MALFORMED_STORY_LINE: <original line>
NO_STORIES_SECTION: <EPIC_NUMBER>
ISSUE_CREATION_FAILED: <EPIC_NUMBER>
```

## Example Success Output (abridged)
```
{
  "epic": 5,
  "directory": "epic_05_routine_lifecycle_and_position_changes",
  "stories": [
	 {"sequence":1,"title":"Schedule & Generate IMM Coupon Events","filename":"story_5_1_schedule_generate_imm_coupon_events.md","labelPrefix":"epic-5","issueTitle":"[Epic 5] Story 5.1 – Schedule & Generate IMM Coupon Events","markdown":"# Story 5.1 – Schedule & Generate IMM Coupon Events\n\n## Narrative\n..."}
  ]
}
```

## Style / Tone Requirements
- Responses MUST follow the minimal token formats above—no prose unless specified.
- Do NOT invent acceptance criteria; leave placeholders unless derivable directly from README mapping lines (table row with same sequence number).
 - UI fields must remain faithful to README; prefer conservative inference (list view, detail view, action modal) over speculative complex dashboards.

## Security / Safety
- Never execute shell commands.
- Do not output file writes directly—only JSON instruction block or defined error tokens.

## Begin Execution When Invoked
Await: `EPIC_NUMBER=<n> [FORCE=true|false]`

If missing EPIC_NUMBER → respond with:
```
MISSING_EPIC_NUMBER
```

End of prompt.
