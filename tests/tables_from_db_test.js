/* jslint node: true, esnext: true */

const sqlite3 = require('sqlite3'),
  path = require('path');

import test from 'ava';
import {
  tablesFromDatabase
}
from '../src/tables_from_database';

test('foo', t => {
  t.pass();
});

test('tables', async t => {
  const db = new sqlite3.Database(path.join(__dirname, '../tests/fixtures/test2.db'));
  const tables = await tablesFromDatabase(db);
  const t1 = tables.get('t1');

  t.is(t1.name, 't1');
  t.is(t1.attributes[0].name, 'a1');
  t.is(t1.attributes[0].type, 'char(16)');
});
