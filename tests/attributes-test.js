import test from 'ava';
import Attribute from '../src/attribute';
import Table from '../src/table';
import {
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

test('attribute basics with contraint', t => {
  const topic = new Attribute('a1', 'int', [NotNullConstraint]);

  t.is(topic.name, 'a1');
  t.is(topic.type, 'int');
  t.deepEqual(topic.constraints, [NotNullConstraint]);
  t.is(topic.ddl, 'a1 int NOT NULL');
  t.is(
    JSON.stringify(topic),
    '{"name":"a1","type":"int","constraints":[{"name":"NOT NULL"}]}'
  );
});

test('attribute basics with multiple contraint', t => {
  const topic = new Attribute('a1', 'int', [
    NotNullConstraint,
    new PrimaryKeyConstraint()
  ]);

  t.is(topic.name, 'a1');
  t.is(topic.type, 'int');
  t.is(topic.constraints[0], NotNullConstraint);
  t.is(topic.constraints[1].name, 'PRIMARY KEY');
  t.is(topic.ddl, 'a1 int NOT NULL PRIMARY KEY');
  t.is(
    JSON.stringify(topic),
    '{"name":"a1","type":"int","constraints":[{"name":"NOT NULL"},{"name":"PRIMARY KEY"}]}'
  );
});
