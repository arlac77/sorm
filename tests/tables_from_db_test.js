/* jslint node: true, esnext: true */

import test from 'ava';
import { tablesFromDatabase } from '../src/tables_from_database';

test('foo', t => {
    t.pass();
});

test('bar', async t => {
    const bar = Promise.resolve('bar');

    t.is(await bar, 'bar');
});
