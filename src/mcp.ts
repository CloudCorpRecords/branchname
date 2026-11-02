/**
 * branchname MCP server. Tools: make_branch_name.
 *
 * Why the low-level Server instead of McpServer: the high-level
 * helper converts zod schemas to JSON Schema and injects keys
 * not in this tool's defined spec ("$schema" and
 * "additionalProperties"), which breaks exact tool-list/schema
 * parity with the spec. This file serves tools/list with the
 * spec's exact input schema as an explicit literal, and every
 * tools/call is validated by the core, which names the
 * offending path on invalid input.
 *
 * The computation is pure and local: no upstream API, no
 * authentication, no configuration, and no repository is
 * touched — the tool only builds a name.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { formatPayload, makeBranchName, VERSION } from "./branchname.js";

const TOOLS = [
  {
    name: "make_branch_name",
    description:
      "Build a branch name from an issue title: slugify the title and compose it with the type and issue number in the repo's naming convention.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Issue title to slugify",
        },
        issue_number: {
          type: "integer",
          description: "Issue number (optional)",
        },
        type: {
          type: "string",
          description: "Change type prefix (optional)",
          enum: ["feat", "fix", "chore", "docs", "refactor", "test"],
        },
        convention: {
          type: "string",
          description:
            "Naming convention to compose (optional, default \"type-issue-slug\")",
          enum: ["type-issue-slug", "type-slug", "issue-slug", "slug"],
        },
        max_slug_length: {
          type: "integer",
          description:
            "Maximum slug length before truncation (optional, default 40)",
        },
      },
      required: ["title"],
    },
  },
];

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  return {
    content: [
      { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "branchname", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let out: unknown;
    if (name === "make_branch_name") {
      out = makeBranchName(args ?? {});
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return textResult(formatPayload(out));
  } catch (err) {
    if (err instanceof McpError) throw err;
    return errorResult(err);
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
