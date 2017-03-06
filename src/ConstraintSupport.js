/* jslint node: true, esnext: true */

'use strict';

import Constraint from './Constraint';

const orderedConstraints = [];

export function parseConstraints(ps, cs) {
  let gotSomething;
  let str = ps.input;

  if (str) {
    do {
      gotSomething = false;
      if (!str) break;

      for (const i in orderedConstraints) {
        const oc = orderedConstraints[i];
        const m = str.match(oc.regex);

        if (m) {
          gotSomething = true;
          if (oc.parse) {
            str = oc.parse(m, cs, oc);
          } else {
            str = m[1];
            cs.push(Constraint(oc));
          }

          break;
        }
      }
    }
    while (gotSomething);
  }

  ps.input = str;

  return gotSomething;
}
