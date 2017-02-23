/* jslint node: true, esnext: true */

const vows = require('vows'),
  assert = require('assert'),
  sqlite3 = require('sqlite3'),
  {
    Attribute, Constraint
  } = require('../dist/module');

vows.describe('Attribute').addBatch({
  'Attribute Values': {
    topic: Attribute("a1", "int"),

    'name is present': function (topic) {
      assert.equal(topic.name, "a1");
    },
    'type is present': function (topic) {
      assert.equal(topic.type, "int");
    },
    'no constraint': function (topic) {
      assert.equal(topic.constraints.length, 0);
    },
    'sql statement': function (topic) {
      assert.equal(topic.ddl_statement(), "a1 int");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"a1","type":"int"}');
    }
  },
  'Attribute Values With Constraint': {
    topic: Attribute("a1", "int", [Constraint("NOT NULL")]),

    'name is present': function (topic) {
      assert.equal(topic.name, "a1");
    },
    'type is present': function (topic) {
      assert.equal(topic.type, "int");
    },
    'constraint is present': function (topic) {
      assert.equal(topic.constraints[0].name, "NOT NULL");
    },
    'sql statement': function (topic) {
      assert.equal(topic.ddl_statement(), "a1 int NOT NULL");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"a1","type":"int","constraints":[{"name":"NOT NULL"}]}');
    }
  },
  'Attribute Values Multiple Constraints': {
    topic: Attribute("a1", "int", ["not null", "primary key"]),

    'name is present': function (topic) {
      assert.equal(topic.name, "a1");
    },
    'type is present': function (topic) {
      assert.equal(topic.type, "int");
    },
    '1. constraint is present': function (topic) {
      assert.equal(topic.constraints[0].name, "NOT NULL");
    },
    '2. constraint is present': function (topic) {
      assert.equal(topic.constraints[1].name, "PRIMARY KEY");
    },
    'sql statement': function (topic) {
      assert.equal(topic.ddl_statement(), "a1 int NOT NULL PRIMARY KEY");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic),
        '{"name":"a1","type":"int","constraints":[{"name":"NOT NULL"},{"name":"PRIMARY KEY"}]}');
    }
  }
}).export(module);
