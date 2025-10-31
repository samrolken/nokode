# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**nokode** is an experimental web server that tests a simple question: what if you skip code generation entirely and let an LLM handle application logic directly?

This is an open source weekend experiment exploring what's possible with today's AI technology. No routes, no controllers, no business logic—just an HTTP server that hands every request to an LLM with three tools.

**Repository**: https://github.com/samrolken/nokode

## What This Tests

Everyone's focused on AI that *writes* code (Cursor, Copilot, etc.). This project tests something different: can an LLM *replace* application code by reasoning through requests and executing via tools?

Hypothesis: If the goal is fulfilling user intent, why generate code at all?

Current result: It works, but it's catastrophically slow (30-60s per request), absurdly expensive (100-1000x traditional compute), and has no UI consistency. The capability exists; performance is the limiting factor.

## Architecture

```
nokode/
├── src/
│   ├── server.js              # Express server
│   ├── config/index.js        # Model configuration
│   ├── middleware/
│   │   └── llm-handler.js     # Core: sends ALL requests to LLM
│   ├── tools/
│   │   ├── database.js        # SQL execution on SQLite
│   │   ├── webResponse.js     # HTTP response generation
│   │   └── updateMemory.js    # Feedback persistence
│   └── utils/
├── prompt.md                  # Defines what app to build
├── memory.md                  # User feedback and preferences
├── database.db                # SQLite database (AI-designed schema)
└── .env                       # API keys and model selection
```

## How It Works

Every HTTP request triggers this flow:

1. **Load Context**: Read `prompt.md` (app description) + `memory.md` (user preferences)
2. **LLM Reasoning**: AI decides what to do with the request
3. **Tool Execution**: AI calls tools as needed:
   - `database` - Execute SQL (AI designs schema, writes queries)
   - `webResponse` - Return HTML/JavaScript/JSON (AI generates content)
   - `updateMemory` - Save user feedback (natural language UI changes)
4. **Response**: Generated content sent to browser

The AI makes ALL decisions: database schema, HTML structure, API design, validation, error handling. Everything is emergent from the three tools and the prompt.

### The Feedback Loop

Every page includes a feedback widget. Users type "make buttons bigger" or "use dark theme" and the AI appends to `memory.md`, implementing changes on the next request. The app evolves based on natural language feedback.

## Commands

```bash
npm install           # Install dependencies
npm start             # Start server on :3001
```

## Environment Setup

Create `.env` file:

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

**Model Options:**
- `claude-3-haiku-20240307` - Recommended (fastest, cheapest)
- `claude-3-7-sonnet-20250219` - More capable, slower
- `gpt-4o-mini` - OpenAI alternative

**Don't use reasoning models** (like gpt-5-nano) unless you want 60+ second response times.

## Customizing the Application

**The entire interface is `prompt.md`.**

Edit `prompt.md` to change:
- What kind of app it builds (contact manager, todo list, blog, etc.)
- Features and capabilities
- UI preferences and frameworks
- Behavior and constraints

Out of the box it builds a contact manager, but you can make it build anything.

## Performance Characteristics

**Reality Check:**
- **Speed**: 30-60 seconds per request (vs 10-100ms traditional)
- **Cost**: $0.01-0.05 per request with reasoning models, $0.001-0.005 with fast models (vs ~$0.00001 traditional)
- **Consistency**: Zero. UI drifts between requests.
- **Reliability**: Hallucinated SQL = 500 error. No type safety.

**Time Breakdown:**
- 75-85% LLM reasoning
- 5-10% content generation
- <1% database operations
- 10-20% wasted tool calls

**But It Works:**
- Forms submit correctly
- Data persists across restarts
- APIs return valid JSON
- User feedback gets implemented
- AI invents sensible schemas, injection-safe SQL, REST-ish patterns, responsive layouts

## Development Notes

### This Is an Experiment

- Not production software. Not even close.
- Every request costs real API tokens. Budget accordingly.
- The AI has no memory of previous UI decisions. Colors drift, layouts change.
- Response times make it nearly unusable for real interaction.

### What Works

- CRUD operations (create, read, update, delete)
- Database schema design (emergent, sensible)
- Form validation (client and server)
- API responses (JSON, HTML, redirects)
- Natural language UI customization
- Error handling for edge cases

### What Doesn't Work

- Speed (300-6000x slower than traditional)
- Cost (100-5000x more expensive)
- UI consistency (no inter-request memory)
- Reliability (hallucinations cause runtime errors)

### Prompt Engineering Findings

**What doesn't help:**
- Instructions like "THINK QUICKLY" make it slower (model meta-reasons)
- Explicit tool call optimization gets ignored

**What helps:**
- Model selection (Haiku vs reasoning models = 2-3x faster)
- OpenAI's `reasoningEffort: minimal` (30-60% faster)
- Keeping prompts focused and specific

## The Bigger Picture

This project demonstrates:
1. Current AI can execute application logic (capability exists)
2. Performance is the limiting factor (speed, cost, consistency)
3. Problems are degree, not kind (improving ~10x/year)
4. Code might be transitional (intermediate representation we're about to outgrow)

In this project: infrastructure remains (HTTP, tools, database). Application logic is gone.

The ultimate vision: 120 inferences per second rendering displays with realtime input sampling. No HTTP, no databases, no infrastructure. Just intent and execution.

For this to be usable, inference needs to be 10x faster minimum. Maybe 2-3 years. Maybe never.

## Working with This Code

**If you're modifying the core:**
- `src/middleware/llm-handler.js` is where all requests are processed
- Tool definitions are in `src/tools/`
- Model configuration in `src/config/index.js`

**If you're experimenting:**
- Edit `prompt.md` to change behavior
- Watch `memory.md` to see how user feedback accumulates
- Check `database.db` to see what schemas the AI invented
- Monitor API costs in your provider dashboard

**If you're debugging:**
- Check console output for LLM reasoning steps
- Look for tool call patterns (are they efficient?)
- Examine generated SQL for quality
- Test with different models for speed/quality trade-offs

## Cost Warning

Each request costs money. With fast models (Haiku, GPT-4o-mini), expect $0.001-0.005 per request. With reasoning models, $0.01-0.05 per request.

A typical user session (10 requests) costs $0.01-0.50 depending on model choice. This is not cost-effective for real applications.

## License

MIT - See LICENSE file

## Contributing

This is an open experiment. PRs welcome, especially for:
- Performance optimizations
- Better tool designs
- Alternative architectures
- Documentation improvements

But remember: the goal is testing "can AI replace code," not "can we make this production-ready." The answer to the first question is more interesting than the second.
