/* jslint node: true, esnext: true */

'use strict';


export class Constraint {
  constructor(name, attributes, constraints) {
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
