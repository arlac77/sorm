/* jslint node: true, esnext: true */

'use strict';

import Table from './Table';
import Attribute from './Attribute';
import {
  parseConstraints
}
from './ConstraintSupport';
import {
  unquote
}
from './util';

export function tableFromDDL(ddl) {
  const sql = ddl.split(/\n/).join(' ');
  const m = sql.match(/CREATE\s+TABLE\s+((\"([^\"]+)\")|([a-z][a-z0-9_]*))\s*\((.*)/im);
  if (m) {
    const name = m[3] ? m[3] : m[4];
    let input = m[5];
    const attributes = [];

    do {
      //console.log(input);

      const ma = input.match(
        /^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]?(.*)/i);
      if (ma) {
        const aname = unquote(ma[1]);
        const type = ma[4];
        attributes.push(new Attribute(aname, type, parseConstraints(ma[6])));

        //console.log(ma);
        input = ma[6];
      } else if (input === ')') {
        break;
      }
    }
    while (input);

    return new Table(name, attributes);
  }
  return undefined;
}

/**
 * Reads Tables DDL from database
 * @pram {sqlite} db
 * @return {Table[]} of tables
 */
export function tablesFromDatabase(db) {
  return new Promise((fullfill, reject) => {
    db.all("SELECT name,sql FROM sqlite_master WHERE type='table'", (error, rows) => {
      if (error) {
        reject(error);
      } else {
        fullfill(rows.map(row => tableFromDDL(row.sql)));
      }
    });
  });
}
