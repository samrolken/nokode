const { tool } = require('ai');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const memoryTool = tool({
  description: 'Update persistent memory to store user feedback, preferences, and instructions that shape the application. Memory content becomes active directives for the system. ALWAYS use this for: 1) User feedback about UI/UX preferences, 2) Feature requests, 3) Style preferences, 4) Behavioral changes requested. The memory content is injected into your prompt and becomes part of your instructions.',
  inputSchema: z.object({
    content: z.string().describe('User preferences, feedback, or instructions to save (markdown format) - these become active directives'),
    mode: z.enum(['append', 'rewrite']).describe('Whether to append to existing memory or rewrite the entire file'),
  }),
  execute: async ({ content, mode }) => {
    const memoryPath = path.join(__dirname, '../../memory.md');

    try {
      if (mode === 'append') {
        // Append mode: add to existing content
        let existingContent = '';
        if (fs.existsSync(memoryPath)) {
          existingContent = fs.readFileSync(memoryPath, 'utf-8');
        }
        // Add a newline if existing content doesn't end with one
        if (existingContent && !existingContent.endsWith('\n')) {
          existingContent += '\n';
        }
        fs.writeFileSync(memoryPath, existingContent + content, 'utf-8');
        return {
          success: true,
          message: 'Memory appended successfully'
        };
      } else {
        // Rewrite mode: replace entire file
        fs.writeFileSync(memoryPath, content, 'utf-8');
        return {
          success: true,
          message: 'Memory rewritten successfully'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update memory: ${error.message}`
      };
    }
  },
});

module.exports = memoryTool;