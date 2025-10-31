# nokode

**A web server with no application logic. Just an LLM with three tools.**

## The Shower Thought

One day we won't need code. LLMs will output video at 120fps, sample inputs in realtime, and just... be our computers. No apps, no code, just intent and execution.

That's science fiction.

But I got curious: with a few hours this weekend and today's level of tech, how far can we get?

## The Hypothesis

I expected this to fail spectacularly.

Everyone's focused on AI that writes code. You know the usual suspects, Claude Code, Cursor, Copilot, all that. But that felt like missing the bigger picture. So I built something to test a different question: what if you skip code generation entirely? A web server with zero application code. No routes, no controllers, no business logic. Just an HTTP server that asks an LLM "what should I do?" for every request.

The goal: prove how far away we really are from that future.

## The Target

Contact manager. Basic CRUD: forms, database, list views, persistence.

Why? Because most software is just CRUD dressed up differently. If this works at all, it would be something.

## The Experiment

```javascript
// The entire backend
const result = await generateText({
  model,
  tools: {
    database,      // Run SQL queries
    webResponse,   // Return HTML/JSON
    updateMemory   // Save user feedback
  },
  prompt: `Handle this HTTP request: ${method} ${path}`,
});
```

Three tools:
- **`database`** - Execute SQL on SQLite. AI designs the schema.
- **`webResponse`** - Return any HTTP response. AI generates the HTML, JavaScript, JSON or whatever fits.
- **`updateMemory`** - Persist feedback to markdown. AI reads it on next request.

The AI infers what to return from the path alone. Hit `/contacts` and you get an HTML page. Hit `/api/contacts` and you get JSON:

```javascript
// What the AI generates for /api/contacts
{
  "contacts": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
  ]
}
```

Every page has a feedback widget. Users type "make buttons bigger" or "use dark theme" and the AI implements it.

## The Results

It works. That's annoying.

Every click or form submission took 30-60 seconds. Traditional web apps respond in 10-100 milliseconds. That's 300-6000x slower. Each request cost $0.01-0.05 in API tokens—100-1000x more expensive than traditional compute. The AI spent 75-85% of its time reasoning, forgot what UI it generated 5 seconds ago, and when it hallucinated broken SQL that was an immediate 500 error. Colors drifted between requests. Layouts changed. I tried prompt engineering tricks like "⚡ THINK QUICKLY" and it made things slower because the model spent more time reasoning about how to be fast.

But despite all that, forms actually submitted correctly. Data persisted across restarts. The UI was usable. APIs returned valid JSON. User feedback got implemented. The AI invented, without any examples, sensible database schemas with proper types and indexes, parameterized SQL queries that were safe from injection, REST-ish API conventions, responsive Bootstrap layouts, form validation, and error handling for edge cases. All emergent behavior from giving it three tools and a prompt.

So yes, the capability exists. The AI can handle application logic. It's just catastrophically slow, absurdly expensive, and has the memory of a goldfish.

## Screenshots

<table>
  <tr>
    <td><img src="screenshots/1.png" alt="Fresh empty home" width="300"/></td>
    <td><img src="screenshots/2.png" alt="Filling out a contact form" width="300"/></td>
    <td><img src="screenshots/3.png" alt="Contact detail view" width="300"/></td>
  </tr>
  <tr>
    <td><img src="screenshots/4.png" alt="Home with three contacts" width="300"/></td>
    <td><img src="screenshots/5.png" alt="Another contact detail" width="300"/></td>
    <td><img src="screenshots/6.png" alt="Home with ten contacts" width="300"/></td>
  </tr>
  <tr>
    <td><img src="screenshots/7.png" alt="After deleting a contact" width="300"/></td>
    <td><img src="screenshots/8.png" alt="Home after delete" width="300"/></td>
    <td><img src="screenshots/9.png" alt="Evolved contact app" width="300"/></td>
  </tr>
</table>

## The Conclusion

The capability exists. The AI can handle application logic.

The problems are all performance: speed (300-6000x slower), cost (100-1000x more expensive), consistency (no design memory), reliability (hallucinations → errors).

But these feel like problems of degree, not kind:
- Inference: improving ~10x/year
- Cost: heading toward zero
- Context: growing (eventual design memory?)
- Errors: dropping

But the fact that I built a working CRUD app with zero application code, despite it being slow and expensive, suggests we might be closer to "AI just does the thing" than "AI helps write code."

In this project, what's left is infrastructure: HTTP setup, tool definitions, database connections. The application logic is gone. But the real vision? 120 inferences per second rendering displays with constant realtime input sampling. That becomes the computer. No HTTP servers, no databases, no infrastructure layer at all. Just intent and execution.

I think we don't realize how much code, as a thing, is mostly transitional.


---

```bash
npm install
```

`.env`:
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

```bash
npm start
```

Visit `http://localhost:3001`. First request: 30-60s.

**What to try:**

Check out `prompt.md` and customize it. Change what app it builds, add features, modify the behavior. That's the whole interface.

Out of the box it builds a contact manager. But try:
- `/game` - Maybe you get a game?
- `/dashboard` - Could be anything
- `/api/stats` - Might invent an API
- Type feedback: "make this purple" or "add a search box"

⚠️ **Cost warning**: Each request costs $0.001-0.05 depending on model. Budget accordingly.

MIT License
