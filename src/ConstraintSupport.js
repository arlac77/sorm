/* jslint node: true, esnext: true */

'use strict';

import {
  Constraint,
  NullConstraint,
  NotNullConstraint
}
from './Constraint';
import {
  unquote, quote, quoteIfNeeded, unquoteList
}
from './util';

export function parseConstraints(str) {
  const constraints = [];

  const notNullMatch = str.match(/^not\s+null\s*(.*)/im);
  if (notNullMatch) {
    str = notNullMatch[1];
    constraints.push(NotNullConstraint);
  }

  const nullMatch = str.match(/^null\s*(.*)/im);

  if (nullMatch) {
    str = nullMatch[1];
    constraints.push(NullConstraint);
  }

  return constraints;
}
