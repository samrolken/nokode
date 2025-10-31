const { generateText, tool, stepCountIs } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai } = require('@ai-sdk/openai');
const config = require('../config');
const tools = require('../tools');
const loadPrompt = require('../utils/prompt-loader');
const loadMemory = require('../utils/memory-loader');
const Logger = require('../utils/logger');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database and cache schema on startup
const dbPath = path.join(__dirname, '../../database.db');
const db = new Database(dbPath);
let cachedSchema = '';

// Load schema once on startup
function loadDatabaseSchema() {
  try {
    const schemaQuery = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL");
    const tables = schemaQuery.all();

    cachedSchema = '\n## DATABASE SCHEMA (Use these exact column names!)\n\n';

    tables.forEach(table => {
      if (table.sql) {
        cachedSchema += table.sql + ';\n\n';
      }
    });

    Logger.success('startup', 'Database schema cached for performance');
  } catch (error) {
    Logger.error('startup', 'Failed to load database schema', error);
    cachedSchema = '';
  }
}

// Load schema on module initialization
loadDatabaseSchema();

async function handleLLMRequest(req, res) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  console.log(`[${new Date().toISOString()}] === REQUEST START: ${req.method} ${req.path} ===`);

  try {
    // Enhanced request logging
    Logger.request(req.method, req.path, {
      requestId,
      query: req.query,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
      ip: req.ip
    });

    // Prepare request context for the LLM
    const requestContext = {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: req.headers,
      body: req.body,
      url: req.url,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      requestId
    };

    // Determine which model to use
    let model;
    if (config.provider === 'openai') {
      model = openai(config.openai.model);
    } else {
      model = anthropic(config.anthropic.model);
    }

    // Load memory and prompt
    console.log(`[${new Date().toISOString()}] Loading memory and prompt...`);
    const memoryStartTime = Date.now();
    const memory = loadMemory();
    const systemPromptTemplate = loadPrompt();
    const memoryDuration = Date.now() - memoryStartTime;
    console.log(`[${new Date().toISOString()}] Memory and prompt loaded in ${memoryDuration}ms`);

    // Pre-fetch database context (contact count) to give AI awareness of what exists
    let databaseContext = '';
    try {
      const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
      if (contactCount && contactCount.count > 0) {
        databaseContext = `\n## DATABASE CONTEXT\n\nThe database currently contains ${contactCount.count} contact(s). Use the database tool to query them if needed for this request.\n\n`;
      }
    } catch (error) {
      // Ignore if contacts table doesn't exist yet
    }

    // Replace template variables in the prompt
    const prompt = systemPromptTemplate
      .replace('{{METHOD}}', requestContext.method)
      .replace('{{PATH}}', requestContext.path)
      .replace('{{URL}}', requestContext.url)
      .replace('{{QUERY}}', JSON.stringify(requestContext.query))
      .replace('{{HEADERS}}', JSON.stringify(requestContext.headers))
      .replace('{{BODY}}', JSON.stringify(requestContext.body))
      .replace('{{IP}}', requestContext.ip)
      .replace('{{TIMESTAMP}}', requestContext.timestamp)
      .replace('{{MEMORY}}', memory + cachedSchema + databaseContext);

    // Log model selection
    Logger.info('llm', `Using ${config.provider} provider with model ${config.provider === 'openai' ? config.openai.model : config.anthropic.model}`, {
      requestId,
      provider: config.provider
    });

    // Debug logging for prompt analysis
    console.log(`[${new Date().toISOString()}] === PROMPT ANALYSIS ===`);
    console.log(`[${new Date().toISOString()}] Request: ${req.method} ${req.path}`);
    console.log(`[${new Date().toISOString()}] Prompt size: ${prompt.length} characters`);
    console.log(`[${new Date().toISOString()}] Memory size: ${memory.length} characters`);
    console.log(`[${new Date().toISOString()}] Schema size: ${cachedSchema.length} characters`);

    // Log if this is an HTML or API request
    const isApiRequest = req.path.startsWith('/api/');
    const expectsHtml = !isApiRequest && req.method === 'GET';
    console.log(`[${new Date().toISOString()}] Request type: ${isApiRequest ? 'API (JSON)' : expectsHtml ? 'HTML Page' : 'Other'}`);

    console.log(`[${new Date().toISOString()}] Starting LLM call...`);
    const llmStartTime = Date.now();

    // Generate response with tools
    const result = await generateText({
      model,
      tools,
      prompt,
      maxTokens: 50000, // High limit - let the AI generate what it needs
      stopWhen: stepCountIs(10), // Allow more steps for complex operations
      // For reasoning models like gpt-5-nano, minimize thinking time
      ...(config.provider === 'openai' && {
        reasoningEffort: 'minimal', // Minimize internal reasoning for faster responses
        maxCompletionTokens: 8000 // Separate limit for output tokens
      }),
      onStepFinish: (stepResult) => {
        const stepTime = Date.now() - llmStartTime;
        console.log(`[${new Date().toISOString()}] Step completed at ${stepTime}ms`);
        if (stepResult.toolCalls?.length > 0) {
          stepResult.toolCalls.forEach(tc => {
            const argsStr = tc.args ? JSON.stringify(tc.args) : '{}';
            console.log(`[${new Date().toISOString()}]   - Tool: ${tc.toolName} (${argsStr.length} chars args)`);
          });
        }
      }
    });

    const llmDuration = Date.now() - llmStartTime;
    console.log(`[${new Date().toISOString()}] LLM call completed in ${llmDuration}ms`);

    // Enhanced step-by-step logging
    Logger.separator(`LLM EXECUTION COMPLETE (${llmDuration}ms)`);
    Logger.info('llm', `Request ${req.method} ${req.path} completed`, {
      requestId,
      totalSteps: result.steps ? result.steps.length : 0,
      llmDuration,
      hasBody: !!req.body && Object.keys(req.body).length > 0
    });

    if (result.steps && result.steps.length > 0) {
      console.log(`[${new Date().toISOString()}] Processing ${result.steps.length} tool steps...`);
      result.steps.forEach((step, idx) => {
        const stepStartTime = Date.now();
        Logger.debug('llm', `Step ${idx + 1} execution`);

        if (step.toolCalls && step.toolCalls.length > 0) {
          step.toolCalls.forEach(tc => {
            console.log(`[${new Date().toISOString()}] Tool call: ${tc.toolName}`);
            Logger.tool(tc.toolName, 'called', {
              requestId,
              step: idx + 1,
              args: tc.args ? Object.keys(tc.args) : []
            });
          });
        }

        if (step.toolResults && step.toolResults.length > 0) {
          step.toolResults.forEach(tr => {
            const result = tr.result || tr.output;
            const resultSize = result ? JSON.stringify(result).length : 0;
            const stepDuration = Date.now() - stepStartTime;
            console.log(`[${new Date().toISOString()}] Tool ${tr.toolName} completed in ${stepDuration}ms`);
            Logger.tool(tr.toolName, `completed (${resultSize} chars)`, {
              requestId,
              step: idx + 1,
              success: !tr.result?.error,
              resultType: typeof result
            });
          });
        }
      });
    }
    Logger.separator();

    // Look for webResponse tool across ALL steps
    let webResponseResult = null;
    let lastToolResult = null;

    if (result.steps && result.steps.length > 0) {
      // Search all steps for webResponse tool
      for (const step of result.steps) {
        if (step.toolResults && step.toolResults.length > 0) {
          // Keep track of the last tool result as fallback
          lastToolResult = step.toolResults[step.toolResults.length - 1];

          // Check if this step has webResponse
          const webResponse = step.toolResults.find(tr => tr.toolName === 'webResponse');
          if (webResponse) {
            webResponseResult = webResponse;
            break; // Found webResponse, stop searching
          }
        }
      }
    }

    // Process the response with enhanced logging
    const totalRequestDuration = Date.now() - requestStartTime;
    console.log(`[${new Date().toISOString()}] Preparing response after ${totalRequestDuration}ms...`);

    if (webResponseResult) {
      // Use webResponse tool output
      const output = webResponseResult.result || webResponseResult.output;
      console.log(`[${new Date().toISOString()}] Sending webResponse with status ${output.statusCode || 200}`);
      Logger.success('response', `Sending webResponse (${output.statusCode || 200})`, {
        requestId,
        statusCode: output.statusCode || 200,
        bodySize: output.body ? output.body.length : 0,
        hasHeaders: !!output.headers,
        totalDuration: totalRequestDuration
      });

      // Set status code
      res.status(output.statusCode || 200);

      // Set custom headers if provided
      if (output.headers) {
        Object.entries(output.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // Send the body
      res.send(output.body || '');
      console.log(`[${new Date().toISOString()}] === REQUEST COMPLETE in ${totalRequestDuration}ms ===`);
    } else if (lastToolResult) {
      // No webResponse found, use last tool result as fallback
      const output = lastToolResult.result || lastToolResult.output;
      Logger.warn('response', `No webResponse found, using ${lastToolResult.toolName} output as fallback`, {
        requestId,
        toolName: lastToolResult.toolName,
        outputSize: JSON.stringify(output).length,
        totalDuration: totalRequestDuration
      });

      // Return as JSON
      res.json(output);
    } else {
      // No tools were called, return the text response
      Logger.warn('response', 'No tools called, returning text response', {
        requestId,
        textLength: result.text ? result.text.length : 0,
        totalDuration: totalRequestDuration
      });
      res.send(result.text || 'No response generated');
    }

  } catch (error) {
    const totalRequestDuration = Date.now() - requestStartTime;
    Logger.error('request', `Request failed after ${totalRequestDuration}ms`, {
      requestId,
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path
    });

    res.status(500).send(`
      <html>
        <body>
          <h1>Server Error</h1>
          <p>An error occurred while processing your request.</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <pre>${error.message}</pre>
        </body>
      </html>
    `);
  }
}

module.exports = handleLLMRequest;