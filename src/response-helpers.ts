// Response helpers - extracted for testing
export type TextContent = {
  type: "text";
  text: string;
};

export type ContentItem = TextContent;

export type McpResponse = {
  content: ContentItem[];
  _meta?: Record<string, unknown>;
  isError?: boolean;
  [key: string]: unknown;
};

export function createResponse(text: string): McpResponse {
  return {
    content: [{ type: "text", text }]
  };
}

export function createErrorResponse(error: Error | string): McpResponse {
  const errorMessage = typeof error === 'string' ? error : error.message;
  console.error(`Error: ${errorMessage}`);
  return {
    content: [{ type: "text", text: `Failed: ${errorMessage}` }],
    isError: true
  };
}