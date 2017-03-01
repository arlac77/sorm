/* jslint node: true, esnext: true */

import test from 'ava';
import { tablesFromDatabase } from '../src/tables_from_database';

test('foo', t => {
    t.pass();
});

test('tables', async t => {
    const tables = await tablesFromDatabase();
    t.is(tables.get('t1').name, 't1' );
});
