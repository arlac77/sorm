/* jslint node: true, esnext: true */

const vows = require('vows'),
  assert = require('assert'),
  sqlite3 = require('sqlite3'),
  {
    Attribute, Table
  } = require('../dist/module');

vows.describe('Tables').addBatch({
  'Table Values': {
    topic: Table("t1", [Attribute("a1", "int", ["not null", "primary key"]), Attribute("a2",
      "char(10)")]),

    'name is present': function (topic) {
      assert.equal(topic.name, "t1");
    },
    'find attribute by name': function (topic) {
      assert.equal(topic.attribute("a2").name, "a2");
    },
    'attribute names array': function (topic) {
      assert.equal(topic.attribute_names()[0], "a1");
      assert.equal(topic.attribute_names()[1], "a2");
    },
    'primary key': function (topic) {
      assert.equal(topic.pk().length, 1);
      assert.equal(topic.pk()[0].name, "a1");
    },
    'sql create statement': function (topic) {
      assert.equal(topic.ddl_statement(), "CREATE TABLE t1(a1 int NOT NULL PRIMARY KEY,a2 char(10))");
    },
    'sql insert statement': function (topic) {
      assert.equal(topic.insert_sql(['a1', 'a2']), "INSERT INTO t1(a1,a2) VALUES(?,?)");
    },
    'sql update statement': function (topic) {
      assert.equal(topic.update_sql(['a1', 'a2']), "UPDATE t1 SET a2=? WHERE a1=?");
    }
  },
  'Table Values Advanced Primary Key': {
    topic: Table("t1", [Attribute("a1", "int", ["not null", "primary key asc"]), Attribute(
      "a2", "char(10)")]),

    'primary key': function (topic) {
      assert.equal(topic.pk().length, 1);
      assert.equal(topic.pk()[0].name, "a1");
    },
    'sql create statement': function (topic) {
      assert.equal(topic.ddl_statement(), "CREATE TABLE t1(a1 int NOT NULL PRIMARY KEY ASC,a2 char(10))");
    }
  }
}).export(module);
