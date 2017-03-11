/* jslint node: true, esnext: true */

const sqlite3 = require('sqlite3'),
  path = require('path');

import test from 'ava';
import {
  tablesFromDatabase,
  tableFromDDL
}
from '../src/TableUtils';

test('foo', t => {
  t.pass();
});

test('tables from db', async t => {
  const db = new sqlite3.Database(path.join(__dirname, '../tests/fixtures/test2.db'));
  const tables = await tablesFromDatabase(db);
  const t1 = tables[0];

  t.is(t1.name, 't1');
  t.is(t1.attributes[0].name, 'a1');
  t.is(t1.attributes[0].type, 'char(16)');
});

test('tableFromDDL', t => {
  const table = tableFromDDL(
    `CREATE TABLE comment_date (
      date datetime,
      comment varchar(255))`
  );

  t.is(table.name, 'comment_date');
  t.is(table.attributes[0].name, 'date');
  t.is(table.attributes[0].type, 'datetime');

  t.is(table.attributes[1].name, 'comment');
  t.is(table.attributes[1].type, 'varchar(255)');
});
