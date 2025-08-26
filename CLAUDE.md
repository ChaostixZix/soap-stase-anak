# Claude Code Instructions

## Database - Supabase
**This project uses Supabase as the database. For any database operations, queries, migrations, or schema changes, ALWAYS use the Supabase MCP tools instead of generic SQL or database approaches.**

Available Supabase MCP tools:
- Database operations: `execute_sql`, `apply_migration`, `list_tables`, `list_migrations`
- Project management: `list_branches`, `create_branch`, `merge_branch`, `delete_branch`
- Development tools: `generate_typescript_types`, `get_project_url`, `get_anon_key`
- Monitoring: `get_logs`, `get_advisors`
- Documentation: `search_docs`

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
[byterover-mcp]

# important 
always use byterover-retrieve-knowledge tool to get the related context before any tasks 
always use byterover-store-knowledge to store all the critical informations after sucessful tasks