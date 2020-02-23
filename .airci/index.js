var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.PRIVATE_AIRTABLE_KEY }).base(
  'appNsRDe0DyAccVoe'
);

module.exports = base;
