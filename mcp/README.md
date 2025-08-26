# SOAP Tools MCP Server

A Model Context Protocol (MCP) server that provides safe, structured tools for patient search and SOAP operations in the SOAP Manager application.

## Features

- **Patient Search**: Fuzzy search for patients by name with pg_trgm similarity
- **SOAP Operations**: Get latest SOAP records, append plan items, and recompute statuses  
- **Security**: Service-role key used server-side only, PHI redaction in logs
- **Rate Limiting**: 50 requests per minute per tool per user
- **Timezone**: All dates default to Asia/Jakarta timezone
- **Validation**: Zod schemas for all inputs and outputs

## Tools Available

### `patient_searchByName`
Search for patients by name (fuzzy matching)
- **Input**: `{ name: string }` (minimum 2 characters)
- **Output**: Array of up to 5 patient matches with `{ id, name, hospital, bangsal, room }`

### `soap_getLatest`  
Get the latest SOAP record for a patient
- **Input**: `{ patient_id: string, select?: ("a"|"p"|"summary")[] }`
- **Output**: SOAP data with selected fields (defaults to assessment and active plan items)

### `soap_appendPlanItem`
Add a new plan item to the latest SOAP record
- **Input**: `{ patient_id: string, item: { drug, route?, dose?, freq?, days?, start_date? } }`
- **Output**: `{ ok: true, soap_id, added: PlanItem }` with computed dates and status

### `soap_recomputePlanStatuses`
Recompute all plan item statuses based on current date
- **Input**: `{ patient_id: string }`
- **Output**: `{ ok: true, counts: { active, done } }`

## Environment Variables

Create a `.env` file with:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TZ=Asia/Jakarta  # Optional, defaults to Asia/Jakarta
```

**⚠️ SECURITY**: The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client-side code. This MCP server runs server-side only.

## Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`

3. Test the server:
   ```bash
   node mcp/soap-tools.mjs
   ```
   The server should start and respond to MCP protocol messages via stdio.

## Host Registration

### Claude Desktop

Add to your Claude Desktop configuration file (`~/.claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "soap-tools": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/mcp/soap-tools.mjs"],
      "env": {
        "SUPABASE_URL": "your_supabase_project_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key",
        "TZ": "Asia/Jakarta"
      }
    }
  }
}
```

### Generic MCP Host

If your MCP host supports npm packages:

```json
{
  "mcpServers": {
    "soap-tools": {
      "command": "npx",
      "args": ["soap-manager"],
      "env": {
        "SUPABASE_URL": "your_supabase_project_url", 
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key",
        "TZ": "Asia/Jakarta"
      }
    }
  }
}
```

## Usage Examples

Once registered with an MCP host, you can use natural language commands:

- "Search for patients named Bintang"
- "Get the latest diagnosis for patient [patient-id]"  
- "Add medication: Inj. Cefotaxime 1g IV q8h for 2 days to patient [patient-id]"
- "Update all plan statuses for patient [patient-id]"

## Plan Item Structure

Plan items have the following structure:
```typescript
{
  drug: string;           // Required: medication name
  route?: string;         // Optional: administration route (IV, PO, etc.)  
  dose?: string;          // Optional: dosage amount
  freq?: string;          // Optional: frequency (q8h, bid, etc.)
  days?: number;          // Optional: duration in days
  start_date: string;     // Auto-computed if not provided (YYYY-MM-DD)
  end_date: string;       // Auto-computed: start_date + days - 1
  status: "active"|"done" // Auto-computed based on end_date vs today
}
```

## Date Handling

- All dates are handled in `Asia/Jakarta` timezone
- Date format is `YYYY-MM-DD` 
- `start_date` defaults to today if not provided
- `end_date` is computed as `start_date + days - 1` (inclusive)
- `status` is `"done"` if `end_date < today`, otherwise `"active"`

## Security Features

- **Service Role Access**: Uses Supabase service role key for full database access
- **PHI Redaction**: Patient names and IDs are redacted in logs  
- **Rate Limiting**: 50 requests per minute per tool per user
- **Input Validation**: All inputs validated with Zod schemas
- **No Raw SQL**: Tools provide structured, safe database operations only

## Error Handling

The server returns structured errors with codes:
- `TOOL_ERROR`: General tool execution error
- `VALIDATION_ERROR`: Invalid input parameters  
- `DATABASE_ERROR`: Supabase operation failed
- `RATE_LIMIT_ERROR`: Too many requests

## Logging

Structured logs include:
- Timestamp and timezone
- Tool name and user ID  
- Redacted inputs (no PHI)
- Execution duration and result size
- Error details if applicable

Example log entry:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "tool": "patient_searchByName", 
  "userId": "demo-user",
  "inputs": {"name": "Bi***"},
  "duration": 150,
  "resultSize": 256,
  "timezone": "Asia/Jakarta"
}
```