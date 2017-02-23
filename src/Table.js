/* jslint node: true, esnext: true */

'use strict';


export class Table {
  constructor(name,attributes,constraints)
  {
    Object.defineProperty(this, 'name', { value: name });

    for (const i in attributes) {
      const a = attributes[i];
      if (!(a instanceof Attribute))
        attributes[i] = Attribute(a.name, a.type, a.constraints);
    }

    for (const i in constraints) {
      const c = constraints[i];
      if (!(c instanceof Constraint))
        constraints[i] = Constraint(c);
    }



    Object.defineProperty(this, 'attributes', { value: attributes });
    Object.defineProperty(this, 'constraints', { value: constraints });
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

    attribute_names() {
      const names = [];
      for (const i in this.attributes) names.push(this.attributes[i].name);
      return names;
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

    attribute(name) {
      for (const i in this.attributes) {
        const a = this.attributes[i];
        if (a.name === name) return a;
      }
      return undefined;
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
