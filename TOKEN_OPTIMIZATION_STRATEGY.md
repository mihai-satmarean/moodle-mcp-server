# Token Optimization Strategy for Moodle MCP Server

## Problem Statement
Sorin's testing revealed token limit errors when querying Moodle data through Obot/EFES:
- `Rate limit reached for gpt-4.1... on tokens per min (TPM): Limit 30000`
- `Request too large... Requested 34477. The input or output tokens must be reduced`

## Research Findings

### 1. MCP Standard - Cursor-Based Pagination
The MCP specification defines **cursor-based pagination** as the standard approach:

```json
// Response format
{
  "jsonrpc": "2.0",
  "id": "123",
  "result": {
    "resources": [...],
    "nextCursor": "eyJwYWdlIjogM30="
  }
}

// Request format
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "params": {
    "cursor": "eyJwYWdlIjogMn0="
  }
}
```

**Key Points:**
- Cursor is an opaque string representing position in result set
- Page size is determined by server
- Clients should NOT assume fixed page size

**Source:** [MCP Specification - Pagination](https://mcp.gjxx.dev/specification/2025-03-26/server/utilities/pagination)

### 2. Real-World Implementation: mcp-ticketer
[mcp-ticketer](https://pypi.org/project/mcp-ticketer/) implements:
- **Automatic pagination** at 20,000 tokens threshold
- **Compact mode** for reduced token usage (essential info only)
- **Smart token counting** to prevent context overflow

### 3. Claude Code Approach
Claude Code uses environment variables:
- `MAX_MCP_OUTPUT_TOKENS` - limits tokens per MCP response (default warning: 10,000)
- `MAX_MCP_TOOL_SCHEMA_TOKENS` - limits tokens in tool schemas

**Source:** [Claude Code Issue #7732](https://github.com/anthropics/claude-code/issues/7732)

### 4. Best Practice: Lazy Tool Loading
Instead of loading all tool definitions upfront, load tools **on-demand**:
- Similar to file system exploration
- Agent loads only relevant tool definitions when needed
- Can reduce token usage by 80%

**Source:** [Medium - Token Reduction Using MCP](https://medium.com/@iamsahilshukla/how-i-reduced-my-ai-agents-token-usage-by-80-using-mcp-code-execution-94da67fe0712)

## Our Current Implementation

### ✅ Already Implemented
1. **Response Mode Parameter** (`summary` / `detailed`)
   - `MCP_RESPONSE_MODE` environment variable
   - Per-request `responseMode` parameter override
   - Filter functions for summary mode

2. **Pagination Support** (offset/limit based)
   - `get_students`: limit + offset
   - `get_courses`: limit + offset
   - Metadata: `total`, `returned`, `hasMore`

3. **Data Filtering**
   - HTML stripping in summary mode
   - Essential fields only in summary mode
   - Reduced descriptions (max 100-200 chars)

### 🔄 Recommended Improvements

#### A. Add Cursor-Based Pagination (MCP Standard)
**Current:** offset/limit (works but not MCP standard)  
**Proposed:** Add cursor support alongside offset/limit

```typescript
interface PaginationParams {
  // Existing
  limit?: number;
  offset?: number;
  
  // New - MCP standard
  cursor?: string;  // Opaque cursor from previous response
}

interface PaginatedResponse {
  items: any[];
  total: number;
  
  // Existing
  offset?: number;
  hasMore?: boolean;
  
  // New - MCP standard
  nextCursor?: string;  // For next page
}
```

**Implementation:**
```typescript
// Encode cursor as base64 JSON
function encodeCursor(offset: number, limit: number): string {
  return Buffer.from(JSON.stringify({ offset, limit })).toString('base64');
}

// Decode cursor
function decodeCursor(cursor: string): { offset: number, limit: number } {
  return JSON.parse(Buffer.from(cursor, 'base64').toString());
}
```

#### B. Add Token Estimation
Estimate response size before sending:

```typescript
function estimateTokens(data: any): number {
  // Rough estimate: 1 token ≈ 4 characters
  return JSON.stringify(data).length / 4;
}

function shouldPaginate(data: any, maxTokens: number = 5000): boolean {
  return estimateTokens(data) > maxTokens;
}
```

#### C. Add Automatic Pagination
If response exceeds threshold, auto-paginate:

```typescript
private formatResponse(data: any[], responseMode: string) {
  const estimated = estimateTokens(data);
  
  if (estimated > 5000 && responseMode !== 'summary') {
    console.warn(`Response size: ~${estimated} tokens. Consider using responseMode=summary or pagination`);
  }
  
  // Auto-switch to summary if too large
  if (estimated > 10000) {
    console.error(`Response too large (~${estimated} tokens). Forcing summary mode.`);
    return data.map(item => filterForSummary(item, 'auto'));
  }
  
  return data;
}
```

#### D. Add Token Budget Environment Variable
```yaml
env:
  - key: MCP_MAX_RESPONSE_TOKENS
    name: Max Response Tokens
    description: Maximum tokens per response (default 5000, auto-paginate above this)
```

#### E. Improve get_course_contents Summary Mode
Currently returns all sections, just filtered. Better approach:

```typescript
// In summary mode, return ONLY structure, not all data
if (responseMode === 'summary') {
  return {
    courseId: courseId,
    totalSections: sections.length,
    totalModules: totalModules,
    totalResources: totalResources,
    totalActivities: totalActivities,
    // Return ONLY section IDs and names, not full data
    sectionIds: sections.map(s => ({ id: s.id, name: s.name, moduleCount: s.modules?.length })),
    hint: "Use get_section_details(sectionId) for full section data"
  };
}
```

## Recommended Configuration for Obot

### For GPT-4.1 (30K TPM limit):
```yaml
env:
  MCP_RESPONSE_MODE: "summary"
  MCP_MAX_RESPONSE_TOKENS: "3000"  # Conservative, leaves room for context
```

### For Claude Opus/Sonnet (higher limits):
```yaml
env:
  MCP_RESPONSE_MODE: "detailed"
  MCP_MAX_RESPONSE_TOKENS: "10000"
```

## Testing Strategy

### Test Cases:
1. **Small course (< 100 items)** - Should work in both modes
2. **Medium course (100-500 items)** - Summary mode only
3. **Large course (> 500 items)** - Pagination required
4. **Course contents with 77 modules** - Currently fails, should auto-paginate

### Success Criteria:
- No token limit errors in Obot/EFES
- All 8 of Sorin's questions return results
- Response time < 5 seconds
- Maintain data completeness (paginate if needed)

## Next Steps

**Priority 1: Quick Wins (Already Done)**
- ✅ Response mode parameter
- ✅ Basic pagination (offset/limit)
- ✅ Summary filtering

**Priority 2: MCP Compliance**
- [ ] Add cursor-based pagination
- [ ] Add `nextCursor` to responses
- [ ] Support `cursor` parameter in requests

**Priority 3: Intelligence**
- [ ] Token estimation
- [ ] Auto-pagination at threshold
- [ ] Response size warnings in logs

**Priority 4: Documentation**
- [ ] Update README with token optimization tips
- [ ] Add examples for different models
- [ ] Document best practices per tool

## References
- [MCP Specification - Pagination](https://mcp.gjxx.dev/specification/2025-03-26/server/utilities/pagination)
- [mcp-ticketer Implementation](https://pypi.org/project/mcp-ticketer/)
- [Claude Code Token Limits](https://github.com/anthropics/claude-code/issues/7732)
- [Token Reduction Strategies](https://medium.com/@iamsahilshukla/how-i-reduced-my-ai-agents-token-usage-by-80-using-mcp-code-execution-94da67fe0712)
