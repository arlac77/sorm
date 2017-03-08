/* jslint node: true, esnext: true */

'use strict';


import Attribute from './Attribute';
import Constraint from './Constraint';


export default class Table {
  constructor(name, attributes = [], constraints = []) {
    Object.defineProperty(this, 'name', {
      value: name
    });

    Object.defineProperty(this, 'attributes', {
      value: attributes
    });

    Object.defineProperty(this, 'constraints', {
      value: constraints
    });
  }

  get ddl() {
    const a = this.attributes.map(a => a.ddl); /*, .. this.constraints.map(a => a.ddl) */
    return `CREATE TABLE ${this.name}(${ a.join(',')})`;
  }

  toJSON() {
    const o = {
      attributes: this.attributes
    };
    if (this.constraints && this.constraints.length > 0) o.constraints = this.constraints;
    return o;
  }

  toString() {
    return this.ddl;
  }

  insert(attributes) {
    const qm = [];

    for (const k in attributes) qm.push('?');

    return 'INSERT INTO ' + this.name + '(' + attributes.join(',') + ') VALUES(' + qm.join(',') + ')';
  }

  update(attributes) {
    const j = this.pk().length;
    const a = [];
    for (const i in attributes) {
      if (i >= j)
        a.push(attributes[i] + '=?');
    }

    if (a.length === 0) return undefined;
    return 'UPDATE ' + this.name + ' SET ' + a.join(',') + ' WHERE ' + this.pk_predicate();
  }

  get attributeNames() {
    return this.attributes.map(a => a.name);
  }

  attribute(name) {
    return this.attributes.find(a => a.name === name);
  }

  get pk() {
    const pk = [];

    for (const i in this.attributes) {
      const a = this.attributes[i];
      for (const j in a.constraints) {
        const c = a.constraints[j];
        if (c.name.search(/PRIMARY KEY/) >= 0) pk.push(a);
      }
    }

    for (const i in this.constraints) {
      const c = this.constraints[i];

      if (c.name.search(/PRIMARY KEY/) >= 0) {
        for (const j in c.attributes) pk.push(this.attribute(c.attributes[j]));
      }
    }

    return pk;
  }

  pk_predicate(alias, values) {
    const ps = [];
    const pk = this.pk();

    for (const i in pk) {
      ps.push((alias ? [alias, pk[i].name].join('.') : pk[i].name) + '=?');
    }

    return ps.join(' AND ');
  }

  next_pk(db, callback) {
    db.get('SELECT MAX(' + this.pk()[0].name + ') + 1 FROM ' + this.name, callback);
  }
}
