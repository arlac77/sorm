/* jslint node: true, esnext: true */

'use strict';

import {
  unquote, quote, quoteIfNeeded, unquoteList
}
from './util';

export class Constraint {
  constructor(name) {
    Object.defineProperty(this, 'name', {
      value: name
    });
  }

  get ddl() {
    return this.name;
  }

  toJSON() {
    return {
      name: this.name
    };
  }

  toString() {
    return this.ddl;
  }
}

export const NotNullConstraint = new Constraint('NOT NULL');
export const NullConstraint = new Constraint('NULL');

export class DefaultValueContraint extends Constraint {
  constructor(value = 'NULL') {
    super('DEFAULT');
    Object.defineProperty(this, 'value', {
      value: value
    });
  }

  get ddl() {
    return `${this.name} ${this.value}`;
  }

  toJSON() {
    return {
      name: this.name,
      value: this.value
    };
  }

  /*
  regex: /^default\s+(('[^']*')|("[^"]*")|(\d+)|(null))(.*)/im,
    parse(matches, cs, constraint) {
      const properties = {};
      if (matches[2]) properties.value = unquote(matches[2]);
      if (matches[3]) properties.value = unquote(matches[3]);
      if (matches[4]) properties.value = parseInt(matches[4]);
      cs.push(new Constraint(constraint, properties));
      return matches[6];
    } * /
}

export class PrimaryKeyContraint extends Constraint {
  constructor(attributes, options) {
    super('PRIMARY KEY');
    Object.defineProperty(this, 'attributes', {
      value: attributes
    });
    Object.defineProperty(this, 'options', {
      value: options
    });
  }

  /*
    static parse(matches, cs, constraint) {
      let options;
      if (matches[2]) options = matches[2];

      if (matches[3]) {
        properties.attributes = matches[4].split(/,/).map(a => unquote(a));
      }

      cs.push(new PrimaryKeyContraint(constraint, properties));
      return matches[5];
    }
  */

  //regex: /^primary\s+key(\s+(asc|desc))?\s*(\(([^/)]+)\))?(.*)/im,

  get ddl() {
    return `${this.name} ${this.options} (${this.attributes.map(a => a.name)})`;
  }

  toJSON() {
    return {
      name: this.name,
      attributes: this.attributes,
      options: this.options
    };
  }
}

export class ForeignKeyContraint extends Constraint {
  constructor(attributes, foreignTable, foreingAttributes) {
    super('FOREIGN KEY');
    Object.defineProperty(this, 'attributes', {
      value: attributes
    });
    Object.defineProperty(this, 'foreignTable', {
      value: foreignTable
    });
    Object.defineProperty(this, 'foreingAttributes', {
      value: foreingAttributes
    });
  }

  get ddl() {
    return `CONSTRAINT ${quoteIfNeeded(this.id)} FOREIGN KEY(${this.attributes.map(a => a.name).join(',')}) REFERENCES ${quoteIfNeeded(this.foreignTable.name)}(${this.foreignAttributes.map(a => a.name).join(',')})`;
  }

  toJSON() {
    return {
      name: this.name,
      id: this.id,
      attributes: this.attributes,
      foreignTable: this.foreignTable.name,
      foreignAttributes: this.foreignAttributes
    };
  }
}

//  regex: /^CONSTRAINT\s+((\'[^\']+\')|(\"[^\"]+\")|([a-z][a-z_0-9]*))\s+FOREIGN\s+KEY\s*\(([^\)]+)\)\s*REFERENCES\s*((\'[^\']+\')|(\"[^\"]+\")|([a-z][a-z_0-9]*))\s*\(([^\)]+)\)(.*)/im,
