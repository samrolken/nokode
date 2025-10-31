const fs = require('fs');
const path = require('path');

function loadMemory() {
  const memoryPath = path.join(__dirname, '../../memory.md');

  try {
    if (fs.existsSync(memoryPath)) {
      const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
      return memoryContent;
    }
    return '';
  } catch (error) {
    console.error('Error loading memory.md:', error);
    return '';
  }
}

module.exports = loadMemory;