/* jslint node: true, esnext: true */

'use strict';

import Table from './Table';
import Attribute from './Attribute';
import {
  unquote
}
from './util';

export function tablesFromDatabase(db) {
  return new Promise((fullfill, reject) => {
    const tables = new Map();

    db.all("SELECT name,sql FROM sqlite_master WHERE type='table'", (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      rows.forEach(row => {
        const sql = row.sql.split(/\n/).join(' ');
        const m = sql.match(/CREATE\s+TABLE\s+((\"([^\"]+)\")|([a-z][a-z0-9_]*))\s*\((.*)/im);
        if (m) {
          const constraints = [];
          const name = m[3] ? m[3] : m[4];
          const ps = {
            input: m[5]
          };

          const attributes = [];

          const m2 = ps.input.match(
            /^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]+(.*)/i);
          if (m2) {
            const aname = unquote(m2[1]);
            //console.log(aname);
            attributes.push(new Attribute(aname));
          }

          tables.set(name, new Table(name, attributes));
        }
      });

      fullfill(tables);
    });

    /*
              do {
                if (parse_constraints(ps, constraints)) {
                } else {
                  const m = ps.input.match(
                    /^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]+(.*)/i);
                  if (m) {
                    const aname = unquote(m[1]);
                    const type = m[4];
                    ps.input = m[6];

                    const cs = [];
                    parse_constraints(ps, cs);

                    const m2 = ps.input.match(/^\s*,\s*(.*)/);
                    if (m2) {
                      ps.input = m2[1];
                    }

                    attributes.push(Attribute(aname, type, cs));
                  } else if (ps.input === ')') {
                    break;
                  } else {
                    break;
                  }
                }
              }
              while (ps.input.length > 0);
    */
  });
}
