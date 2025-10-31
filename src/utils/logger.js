/**
 * Enhanced logging utility with timestamps, areas, and structured output
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function formatTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 23);
}

function formatArea(area) {
  return `[${area.toUpperCase()}]`.padEnd(12);
}

class Logger {
  static info(area, message, data = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea(area);
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.cyan}${areaTag}${colors.reset} ${colors.white}${message}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static success(area, message, data = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea(area);
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.green}${areaTag}${colors.reset} ${colors.green}✅ ${message}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static error(area, message, error = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea(area);
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.red}${areaTag}${colors.reset} ${colors.red}❌ ${message}${colors.reset}`);
    if (error) {
      const errorData = error.stack || error.message || error;
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.red}${errorData.toString().split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static warn(area, message, data = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea(area);
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.yellow}${areaTag}${colors.reset} ${colors.yellow}⚠️  ${message}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static debug(area, message, data = null) {
    if (process.env.DEBUG !== 'true') return;
    const timestamp = formatTimestamp();
    const areaTag = formatArea(area);
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.magenta}${areaTag}${colors.reset} ${colors.dim}🔧 ${message}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static database(message, data = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea('database');
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.blue}${areaTag}${colors.reset} ${colors.blue}📊 ${message}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static request(method, path, data = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea('request');
    const methodColor = method === 'GET' ? colors.green : method === 'POST' ? colors.yellow : method === 'PUT' ? colors.blue : method === 'DELETE' ? colors.red : colors.white;
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.cyan}${areaTag}${colors.reset} ${methodColor}${method}${colors.reset} ${colors.white}${path}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static tool(toolName, message, data = null) {
    const timestamp = formatTimestamp();
    const areaTag = formatArea('tool');
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.magenta}${areaTag}${colors.reset} ${colors.bright}🔧 ${toolName}${colors.reset} ${colors.white}${message}${colors.reset}`);
    if (data) {
      console.log(`${colors.gray}${' '.repeat(24)}${colors.reset} ${colors.dim}${JSON.stringify(data, null, 2).split('\n').join(`\n${' '.repeat(25)}`)}${colors.reset}`);
    }
  }

  static separator(title = '') {
    const timestamp = formatTimestamp();
    const line = '═'.repeat(60);
    if (title) {
      const paddedTitle = ` ${title} `;
      const padding = Math.max(0, (line.length - paddedTitle.length) / 2);
      const leftPad = '═'.repeat(Math.floor(padding));
      const rightPad = '═'.repeat(Math.ceil(padding));
      console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.cyan}${leftPad}${paddedTitle}${rightPad}${colors.reset}`);
    } else {
      console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.cyan}${line}${colors.reset}`);
    }
  }
}

module.exports = Logger;