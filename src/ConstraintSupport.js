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

const orderedConstraints = [];
const constraints = {};

export function createConstraint(definition) {
  orderedConstraints.push(definition);
  constraints[definition.name] = definition;
}

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


/**
 * Creates an instance of Constraint.
 *
 * @constructor
 * @this {Constraint}
 * @param {options} either a string or a object with name and attributes.
 */

function makeContraint(type, properties) {
  if (typeof type === 'string') {
    let c = constraints[type.toUpperCase()];
    if (c) {
      return c;
    }

    const cs = [];

    parseConstraints({
      input: type
    }, cs);

    c = cs[0];

    if (!c) {
      return undefined;
    }
    return c;
  } else if (properties === undefined) {
    properties = {};
    for (const key in type) {
      if (key !== 'name')
        properties[key] = type[key];
    }

    type = constraints[type.name.toUpperCase()];
  }
}

createConstraint({
  name: 'PRIMARY KEY',
  regex: /^primary\s+key(\s+(asc|desc))?\s*(\(([^/)]+)\))?(.*)/im,
  toJSON() {
    const o = {
      name: this.name
    };
    if (this.options) o.options = this.options.toUpperCase();
    if (this.attributes) o.attributes = this.attributes;
    return o;
  },
  ddl() {
    let s = this.name;
    if (this.options) {
      s += ' ' + this.options.toUpperCase();
    }
    if (this.attributes) {
      s += '(' + this.attributes.join(',') + ')';
    }
    return s;
  },
  parse(matches, cs, constraint) {
    const properties = {};
    if (matches[2]) properties.options = matches[2];
    if (matches[3]) {
      properties.attributes = matches[4].split(/,/).map(a => unquote(a));
    }
    cs.push(new Constraint(constraint, properties));
    return matches[5];
  }
});

createConstraint({
  name: 'DEFAULT',
  regex: /^default\s+(('[^']*')|("[^"]*")|(\d+)|(null))(.*)/im,
  toJSON() {
    return {
      name: this.name,
      value: this.value
    };
  },
  ddl() {
    let v = 'NULL';
    if (typeof this.value === 'string') v = quote(this.value);
    else if (typeof this.value === 'number') v = this.value;
    return this.name + ' ' + v;
  },
  parse(matches, cs, constraint) {
    const properties = {};
    if (matches[2]) properties.value = unquote(matches[2]);
    if (matches[3]) properties.value = unquote(matches[3]);
    if (matches[4]) properties.value = parseInt(matches[4]);
    cs.push(new Constraint(constraint, properties));
    return matches[6];
  }
});

createConstraint({
  name: 'FOREIGN KEY',
  regex: /^CONSTRAINT\s+((\'[^\']+\')|(\"[^\"]+\")|([a-z][a-z_0-9]*))\s+FOREIGN\s+KEY\s*\(([^\)]+)\)\s*REFERENCES\s*((\'[^\']+\')|(\"[^\"]+\")|([a-z][a-z_0-9]*))\s*\(([^\)]+)\)(.*)/im,
  toJSON() {
    return {
      name: this.name,
      id: this.id,
      attributes: this.attributes,
      foreign_table: this.foreign_table,
      foreign_attributes: this.foreign_attributes
    };
  },
  ddl() {
    return
      `CONSTRAINT ${quoteIfNeeded(this.id)} FOREIGN KEY(${this.attributes.join(',')}) REFERENCES ${quoteIfNeeded(this.foreign_table)}(${this.foreign_attributes.join(',')})`;
  },
  parse(matches, cs, constraint) {
    cs.push(new Constraint(constraint, {
      id: unquote(matches[1]),
      attributes: unquoteList(matches[5]),
      foreign_table: unquote(matches[6]),
      foreign_attributes: unquoteList(matches[10])
    }));
    return matches[11];
  }
});
