export default class Attribute {
  constructor(name, type, constraints = []) {
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
    const cddl = this.constraints.map(c => c.ddl).join(' ');
    return `${this.name} ${this.type}${cddl.length === 0 ? '' : ' ' + cddl}`;
  }

  toJSON() {
    const json = {
      name: this.name,
      type: this.type
    };

    if (this.constraints.length > 0) {
      json.constraints = this.constraints;
    }

    return json;
  }

  toString() {
    return this.ddl;
  }
}
