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
