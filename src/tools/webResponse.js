const { tool } = require('ai');
const { z } = require('zod');

const webResponseTool = tool({
  description: 'Generate a web response with full control over status, headers, and body',
  inputSchema: z.object({
    statusCode: z.number().optional().describe('HTTP status code (default 200)'),
    contentType: z.string().optional().describe('Content-Type header value'),
    body: z.string().describe('Response body as a string (can be HTML, JSON string, plain text, etc.)'),
  }),
  execute: async ({ statusCode, contentType, body }) => {
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    return {
      statusCode: statusCode || 200,
      headers,
      body
    };
  },
});

module.exports = webResponseTool;