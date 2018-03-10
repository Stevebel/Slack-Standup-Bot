var path = require('path');
var sqlite3 = require('sqlite3').verbose();

var outputFile = process.argv[2] || path.resolve(__dirname, 'slackbot.db');
var db = new sqlite3.Database(outputFile);
