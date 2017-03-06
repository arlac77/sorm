/* jslint node: true, esnext: true */

'use strict';


export default class Attribute {
  constructor(name, type, constraints) {
    Object.defineProperty(this, 'name', {
      value: name
    });
    Object.defineProperty(this, 'type', {
      value: type
    });
    Object.defineProperty(this, 'constraints', {
      value: constraints
    });
  }

  get ddl() {
    return `${this.name} ${this.type} ${this.constraints.map(c => c.ddl).join(' ')}`;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      constraints: this.constraints
    };
  }

  toString() {
    return this.ddl;
  }
}
