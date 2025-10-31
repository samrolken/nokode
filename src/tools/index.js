const webResponseTool = require('./webResponse');
const memoryTool = require('./memory');
const databaseTool = require('./database');

module.exports = {
  webResponse: webResponseTool,
  updateMemory: memoryTool,
  database: databaseTool
};