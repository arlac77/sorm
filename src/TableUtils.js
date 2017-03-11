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
    const constraints = [];
    const name = m[3] ? m[3] : m[4];
    const ps = {
      input: m[5]
    };

    const attributes = [];

    do {
      const ma = ps.input.match(
        /^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]?(.*)/i);
      if (ma) {
        const aname = unquote(ma[1]);
        const type = ma[4];
        ps.input = ma[6];
        const constraints = [];

        //parseConstraints(ps, constraints);

        attributes.push(new Attribute(aname, type, constraints));

      } else if (ps.input === ')') {
        break;
      } else {
        console.log(ps.input);
        //break;
      }
    }
    while (ps.input.length > 0);

    return new Table(name, attributes);
  }
  return undefined;
}

/**
 * Reads Tables from database
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

  /*
              if (parse_constraints(ps, constraints)) {
              } else {
                const m = ps.input.match(
                  /^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]+(.*)/i);
                if (m) {

                  const cs = [];
                  parse_constraints(ps, cs);

                  const m2 = ps.input.match(/^\s*,\s*(.*)/);
                  if (m2) {
                    ps.input = m2[1];
                  }
  */
}
