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
  t.is(tables.get('t1').name, 't1');
});
