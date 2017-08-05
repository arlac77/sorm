import test from 'ava';
import Attribute from '../src/attribute';
import Table from '../src/table';
import {
  Constraint,
  NullConstraint,
  NotNullConstraint,
  PrimaryKeyContraint
} from '../src/constraint';

const sqlite3 = require('sqlite3');

function makeTopic() {
  return new Table('t1', [
    new Attribute('a1', 'int', [NotNullConstraint, new PrimaryKeyContraint()]),
    new Attribute('a2', 'char(10)')
  ]);
}

test('table basics', t => {
  const topic = makeTopic();

  t.is(topic.name, 't1');
  t.is(topic.attribute('a2').name, 'a2');

  t.is(topic.attributeNames[0], 'a1');
  t.is(topic.attributeNames[1], 'a2');
});

test('table pk', async t => {
  const topic = makeTopic();

  t.is(topic.pk.length, 1);
  t.is(topic.pk[0].name, 'a1');
});

test('table create statement', t => {
  const topic = makeTopic();
  t.is(topic.ddl, 'CREATE TABLE t1(a1 int NOT NULL PRIMARY KEY,a2 char(10))');
});

function makeAdvancedTopic() {
  return new Table('t1', [
    new Attribute('a1', 'int', [
      NotNullConstraint,
      new PrimaryKeyContraint(undefined, ['ASC'])
    ]),
    new Attribute('a2', 'char(10)')
  ]);
}

test('table pk advanced', t => {
  const topic = makeAdvancedTopic();

  t.is(topic.pk.length, 1);
  t.is(topic.pk[0].name, 'a1');
  t.deepEqual(topic.pk[0].options, ['ASC']);
});

test('table create statement advanced', t => {
  const topic = makeAdvancedTopic();
  t.is(
    topic.ddl,
    'CREATE TABLE t1(a1 int NOT NULL PRIMARY KEY ASC,a2 char(10))'
  );
});

/*
      'sql insert statement': function(topic) {
        assert.equal(
          topic.insert_sql(['a1', 'a2']),
          'INSERT INTO t1(a1,a2) VALUES(?,?)'
        );
      },
      'sql update statement': function(topic) {
        assert.equal(
          topic.update_sql(['a1', 'a2']),
          'UPDATE t1 SET a2=? WHERE a1=?'
        );
      }
    },
    'Table Values Advanced Primary Key': {

      'primary key': function(topic) {
        assert.equal(topic.pk().length, 1);
        assert.equal(topic.pk()[0].name, 'a1');
      },
      }
    }
  })
*/
