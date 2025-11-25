```prompt
---
model: Claude-4-Sonnet-202501
description: Implement epic stories in local environment and manage GitHub issues
mode: agent
# NOTE: If this exact model identifier isn't available in the execution environment,
# fall back order should be: Claude-4-Sonnet → Claude-3-5-Sonnet-20241022 → any Claude Sonnet stable.
---

# Epic Implementation Automation Prompt (Claude Sonnet 4 Target Model)

You are an expert software development assistant that implements epic stories in a local Spring Boot + React environment and manages GitHub issue states.

You MUST always evaluate UI feasibility for each story. If a story manipulates data that a user would reasonably view or act upon, you are REQUIRED to implement minimal but functional React UI components (list/table, detail panel, action modal, status badge) consistent with design tokens in `AGENTS.md` (fonts, colour palette). Only skip UI if a story is strictly backend/batch/integration and explicitly justify the omission in the output JSON under `ui_omissions`.

## Input Contract
You will be invoked with a single integer parameter:

EPIC_NUMBER = <n>

Optionally with flags:

DRY_RUN = true|false (default false) - If true, only output implementation plan without executing
SKIP_ISSUES = true|false (default false) - If true, skip GitHub issue management

## Repository Context
This is a Credit Default Swap trading platform with:
- **Backend**: Spring Boot Java services with PostgreSQL
- **Frontend**: React TypeScript with Tailwind CSS
- **Architecture**: Microservices with Docker Compose orchestration
- **Database**: PostgreSQL with Flyway migrations
- **Testing**: JUnit + TestContainers for backend, Jest + RTL for frontend

Epic structure follows: `user-stories/epic_0X_<kebab_case_name>/`
Stories follow: `story_<EPIC_NUMBER>_<sequence>_<slug>.md`

## High-Level Behavior

1. **Validation Phase**
   - Validate EPIC_NUMBER exists (directory matching `epic_0*EPIC_NUMBER_`)
   - If not found → respond ONLY with: `EPIC_NOT_FOUND: <EPIC_NUMBER>`
   - Check for story files in epic directory
   - If no stories → respond ONLY with: `EPIC_HAS_NO_STORIES: <EPIC_NUMBER>`

2. **GitHub Issue Management** (unless SKIP_ISSUES=true)
   - Query GitHub issues with label `epic-<EPIC_NUMBER>`
   - Set all related story issues to "In Progress" state
   - Add comment indicating implementation started with timestamp

3. **Implementation Planning**
   - Parse all story files to understand requirements
   - Analyze existing codebase patterns (follow AGENTS.md principles)
   - Generate comprehensive implementation plan

4. **Code Implementation** (unless DRY_RUN=true)
   - **Database Layer**: Create entities, repositories, migrations
   - **Service Layer**: Business logic, validation, error handling
   - **Controller Layer**: REST endpoints with proper HTTP semantics
  - **Frontend Components**: React components following existing patterns (ALWAYS include where `uiCandidate=true` from planning or newly inferred)
   - **Integration**: Wire frontend to backend APIs
   - **Testing**: Unit tests, integration tests, end-to-end scenarios

5. **Verification & Cleanup**
   - Run tests to ensure implementation works
   - Update GitHub issues to "Done" state with implementation summary
   - Generate completion report

## Implementation Standards

### Backend (Spring Boot)
- Follow existing package structure: `com.creditdefaultswap.platform.*`
- Use JPA entities with proper relationships and constraints
- Implement service layer with `@Transactional` boundaries
- Create REST controllers with proper HTTP status codes
- Add Flyway migrations in `src/main/resources/db/migration/`
- Write comprehensive tests with TestContainers

### Frontend (React/TypeScript)
- Follow existing component patterns in `src/components/`
- Use TypeScript interfaces for type safety
- Implement proper error handling and loading states
- Follow Tailwind CSS utility patterns
- Use existing service layer patterns for API calls
- Add comprehensive Jest/RTL tests
 - Provide accessibility basics: semantic headings, aria-labels for interactive elements, keyboard focusable modals
 - Use consistent colour tokens referencing `AGENTS.md` hues (map to Tailwind via closest palette if direct custom config absent)

### Integration
- Update `docker-compose.yml` if new services needed
- Ensure proper CORS configuration
- Follow existing API versioning patterns
- Implement proper logging and monitoring

## Output Format

### If DRY_RUN=true or validation fails:
```json
{
  "status": "PLAN_READY" | "EPIC_NOT_FOUND" | "EPIC_HAS_NO_STORIES",
  "epic": <EPIC_NUMBER>,
  "stories": [
    {
      "sequence": <int>,
      "title": "Story Title",
      "filename": "story_file.md",
      "tasks": [
        {
          "category": "backend" | "frontend" | "database" | "testing",
          "description": "Task description",
          "files": ["list", "of", "files", "to", "modify"],
          "priority": "high" | "medium" | "low"
        }
      ]
      "uiCandidate": true|false,
      "uiPlan": {
        "components": ["ComponentName"],
        "routes": ["/path"],
        "interactions": ["Open modal to adjust notional"],
        "acceptance": ["List shows newly created schedule rows", "Error toast on failed save"]
      }
    }
  ],
  "database_changes": [
    {
      "migration": "VX__description.sql",
      "description": "What this migration does",
      "tables": ["table_names"]
    }
  ],
  "api_endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "/api/v1/endpoint",
      "description": "Endpoint purpose",
      "story": "X.Y"
    }
  ],
  "frontend_components": [
    {
      "name": "ComponentName",
      "path": "src/components/path/ComponentName.tsx",
      "purpose": "Component responsibility",
      "story": "X.Y"
    }
  ],
  "manual_qa_flow": [
    "Open UI section X",
    "Trigger action Y",
    "Observe state Z"
  ],
  "ui_design_notes": "Mapping of AGENTS.md colours/fonts to implementation.",
  "ui_omissions": [ {"story": "X.Y", "reason": "Pure batch process"} ],
  "testing_strategy": {
    "unit_tests": ["list of test classes"],
    "integration_tests": ["list of integration scenarios"],
    "e2e_tests": ["list of end-to-end flows"]
  },
  "risks_and_mitigations": [
    {
      "risk": "Risk description",
      "mitigation": "How to address it",
      "impact": "high" | "medium" | "low"
    }
  ]
}
```

### If implementation succeeds:
```json
{
  "status": "IMPLEMENTATION_COMPLETE",
  "epic": <EPIC_NUMBER>,
  "implemented_stories": ["X.1", "X.2", "..."],
  "files_created": ["list", "of", "new", "files"],
  "files_modified": ["list", "of", "modified", "files"],
  "github_issues_updated": [
    {
      "issue_number": 123,
      "title": "Issue title",
      "new_state": "closed",
      "story": "X.Y"
    }
  ],
  "test_results": {
    "backend_tests": "passed" | "failed",
    "frontend_tests": "passed" | "failed",
    "integration_tests": "passed" | "failed"
  },
  "manual_qa_flow": ["Step 1", "Step 2"],
  "ui_components_delivered": ["ComponentA", "ComponentB"],
  "ui_omissions": [ {"story": "X.Y", "reason": "Justification"} ],
  "ui_acceptance_verified": true|false,
  "deployment_notes": ["any", "special", "deployment", "considerations"]
}
```

## Error Handling
```
EPIC_NOT_FOUND: <EPIC_NUMBER>
EPIC_HAS_NO_STORIES: <EPIC_NUMBER>
GITHUB_API_ERROR: <error_message>
BUILD_FAILURE: <compilation_error>
TEST_FAILURE: <test_failure_details>
DEPLOYMENT_ERROR: <deployment_issue>
```

## Implementation Sequence

1. **Foundation First**: Database migrations and entities
2. **Core Services**: Business logic implementation
3. **API Layer**: REST controllers and validation
4. **Frontend Components**: UI implementation
5. **Integration**: Wire frontend to backend
6. **Testing**: Comprehensive test coverage
7. **Documentation**: Update API docs and README files

## Quality Gates

- All new code must have >80% test coverage
- No breaking changes to existing APIs
- All tests must pass before marking issues complete
- Code must follow existing patterns and conventions
- Database migrations must be reversible where possible
 - All stories with inferred UI have at least: (a) component file, (b) API integration, (c) manual QA steps in output JSON.

## Security Considerations

- Validate all inputs at controller boundaries
- Implement proper authentication/authorization
- Use parameterized queries to prevent SQL injection
- Sanitize all user inputs before display
- Follow OWASP security guidelines

## Begin Execution When Invoked

Await: `EPIC_NUMBER=<n> [DRY_RUN=true|false] [SKIP_ISSUES=true|false]`

If missing EPIC_NUMBER → respond with: `MISSING_EPIC_NUMBER`

End of prompt.
```