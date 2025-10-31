const fs = require('fs');
const path = require('path');

function loadPrompt() {
  const promptPath = path.join(__dirname, '../../prompt.md');

  try {
    const promptContent = fs.readFileSync(promptPath, 'utf-8');
    return promptContent;
  } catch (error) {
    console.error('Error loading prompt.md:', error);
    // Fallback prompt if file can't be loaded
    return `You are a web server. Generate an appropriate response for this HTTP request using the webResponse tool.

Request Information:
Method: {{METHOD}}
Path: {{PATH}}
URL: {{URL}}
Query Parameters: {{QUERY}}
Headers: {{HEADERS}}
Body: {{BODY}}
Client IP: {{IP}}
Timestamp: {{TIMESTAMP}}

Use the webResponse tool to generate an appropriate response.`;
  }
}

module.exports = loadPrompt;