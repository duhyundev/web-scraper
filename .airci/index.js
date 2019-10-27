var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  'appZ7Dh598tvlkK1x'
);

module.exports = base;
