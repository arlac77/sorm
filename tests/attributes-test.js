import test from 'ava';
import Attribute from '../src/attribute';
import Table from '../src/table';
import {
  Constraint,
  NullConstraint,
  NotNullConstraint,
  PrimaryKeyConstraint
} from '../src/constraint';

test('attribute basics', t => {
  const topic = new Attribute('a1', 'int');

  t.is(topic.name, 'a1');
  t.is(topic.type, 'int');
  t.deepEqual(topic.constraints, []);
  t.is(topic.ddl, 'a1 int');
  t.is(JSON.stringify(topic), '{"name":"a1","type":"int"}');
});

/*
vows.describe('Attribute').addBatch({
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
*/
