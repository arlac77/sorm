/* jslint node: true, esnext: true */

'use strict';

var crypto = require('crypto'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  async = require('async'),
  winston = require('winston');


Object.defineProperty(Object.prototype, 'spawn', {
  value: function (props) {
    const defs = {};
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        defs[key] = {
          value: props[key],
          enumerable: true
        };
      }
    }
    return Object.create(this, defs);
  }
});

function quote(str) {
  return `"${str}"`;
}

function optional_quote(str) {
  if (str.match(/^[a-z_][a-z0-9_]*$/i))
    return str;
  else
    return `"${str}"`;
}

function unquote_list(str) {
  return str.split(',').map(
    e => e.replace(/^[\'\"]/, '').replace(/[\'\"]$/, ''));
}

function unquote(str) {
  return str.replace(/^[\'\"]/, '').replace(/[\'\"]$/, '');
}

const orderedConstraints = [];
const constraints = {};

const RootConstraint = {
  ddl_statement() {
      return this.name;
    },
    toJSON() {
      return {
        name: this.name
      };
    },
    toString() {
      return this.ddl_statement();
    }
};

function parse_constraints(ps, cs) {
  let gotSomething;
  let str = ps.input;

  if (str) {
    do {
      gotSomething = false;
      if (!str) break;

      for (const i in orderedConstraints) {
        const oc = orderedConstraints[i];
        const m = str.match(oc.regex);

        //winston.log(str + " <> " + oc.regex + " ::: "  + m);

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

function create_constraint(definition) {
  const c = RootConstraint.spawn(definition);
  orderedConstraints.push(c);
  constraints[c.name] = c;
}

create_constraint({
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
  ddl_statement() {
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
      properties.attributes = matches[4].split(/,/);
      for (var i in properties.attributes) {
        properties.attributes[i] = unquote(properties.attributes[i]);
      }
    }
    cs.push(Constraint(constraint, properties));
    return matches[5];
  }
});

create_constraint({
  name: 'NOT NULL',
  regex: /^not\s+null\s*(.*)/im
});

create_constraint({
  name: 'NULL',
  regex: /^null\s*(.*)/im
});

create_constraint({
  name: 'DEFAULT',
  regex: /^default\s+(('[^']*')|("[^"]*")|(\d+)|(null))(.*)/im,
  toJSON() {
    return {
      name: this.name,
      value: this.value
    };
  },
  ddl_statement() {
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
    cs.push(Constraint(constraint, properties));
    return matches[6];
  }
});

create_constraint({
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
  ddl_statement() {
    return 'CONSTRAINT ' + optional_quote(this.id) +
      ' FOREIGN KEY(' + this.attributes.join(',') + ') REFERENCES ' +
      optional_quote(this.foreign_table) + '(' + this.foreign_attributes.join(',') + ')';
  },
  parse(matches, cs, constraint) {
    cs.push(Constraint(constraint, {
      id: unquote(matches[1]),
      attributes: unquote_list(matches[5]),
      foreign_table: unquote(matches[6]),
      foreign_attributes: unquote_list(matches[10])
    }));
    return matches[11];
  }
});

/**
 * Creates an instance of Constraint.
 *
 * @constructor
 * @this {Constraint}
 * @param {options} either a string or a object with name and attributes.
 */
const Constraint = function (type, properties) {

  if (typeof type === 'string') {
    let c = constraints[type.toUpperCase()];
    if (c) {
      return c;
    }

    const cs = [];

    parse_constraints({
      input: type
    }, cs);

    c = cs[0];

    if (!c) {
      winston.warn('Unknown constraint', type);
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

  return type.spawn(properties);
};


const RootAttribute = {
  ddl_statement() {
      const c = [this.name, this.type];
      for (const i in this.constraints)
        c.push(this.constraints[i].ddl_statement());

      return c.join(' ');
    },
    toJSON() {
      const o = {
        name: this.name,
        type: this.type
      };
      if (this.constraints.length > 0) o.constraints = this.constraints;
      return o;
    },
    toString() {
      return this.ddl_statement();
    }
};

/**
 * Creates an instance of Attribute.
 *
 * @constructor
 * @this {Attribute}
 * @param {name} attribute name.
 * @param {type} attribute type.
 * @param {constraints} Array of Constraints.
 */
const Attribute = function (name, type, cs) {

  const constraints = [];

  if (cs instanceof Array) {
    for (const i in cs) {
      const csi = cs[i];
      constraints[i] = csi instanceof Constraint ? csi : Constraint(csi);
    }
  } else {
    parse_constraints({
      input: cs
    }, constraints);
  }

  return RootAttribute.spawn({
    name: name,
    type: type,
    constraints: constraints
  });
};


const RootTable = {
  ddl_statement() {
      const atts = this.attributes.map(a => a.ddl_statement());

      for (const i in this.constraints) {
        atts.push(this.constraints[i].ddl_statement());
      }

      return 'CREATE TABLE ' + this.name + '(' + atts.join(',') + ')';
    },
    toJSON() {
      const o = {
        attributes: this.attributes
      };
      if (this.constraints && this.constraints.length > 0) o.constraints = this.constraints;
      return o;
    },
    toString() {
      return this.ddl_statement();
    },
    attribute_names() {
      const names = [];
      for (const i in this.attributes) names.push(this.attributes[i].name);
      return names;
    },
    insert_sql(attributes) {
      const qm = [];

      for (const k in attributes) qm.push('?');

      return 'INSERT INTO ' + this.name + '(' + attributes.join(',') + ') VALUES(' + qm.join(',') + ')';
    },
    update_sql(attributes) {
      const j = this.pk().length;
      const a = [];
      for (const i in attributes) {
        if (i >= j)
          a.push(attributes[i] + '=?');
      }

      if (a.length === 0) return undefined;
      return 'UPDATE ' + this.name + ' SET ' + a.join(',') + ' WHERE ' + this.pk_predicate();
    },
    attribute(name) {
      for (const i in this.attributes) {
        const a = this.attributes[i];
        if (a.name === name) return a;
      }
      return undefined;
    },
    pk() {
      const pk = [];

      for (const i in this.attributes) {
        var a = this.attributes[i];
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
    },
    pk_predicate(alias, values) {
      const ps = [];
      const pk = this.pk();

      for (const i in pk) {
        ps.push((alias ? [alias, pk[i].name].join('.') : pk[i].name) + '=?');
      }

      return ps.join(' AND ');
    },
    next_pk(db, callback) {
      db.get('SELECT MAX(' + this.pk()[0].name + ') + 1 FROM ' + this.name, callback);
    }
};

/**
 * Creates an instance of Table.
 *
 * @constructor
 * @this {Table}
 * @param {name} attribute name.
 * @param {type} attribute type.
 * @param {constraints} Array of Constraints.
 */
const Table = function (name, attributes, constraints) {

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

  return RootTable.spawn({
    name: name,
    attributes: attributes,
    constraints: constraints
  });
};


function tables_from_db(db, callback) {
  db.all("SELECT name,sql FROM sqlite_master WHERE type='table'", (error, rows) => {
    if (error) {
      callback(error);
      return;
    }

    let tables = {};
    for (const i in rows) {
      const row = rows[i];
      const sql = row.sql.split(/\n/).join(' ');
      //console.log("input          : " + sql);

      const m = sql.match(/CREATE\s+TABLE\s+((\"([^\"]+)\")|([a-z][a-z0-9_]*))\s*\((.*)/im);
      if (m) {
        const attributes = [];
        const constraints = [];
        const name = m[3] ? m[3] : m[4];
        const ps = {
          input: m[5]
        };

        do {
          if (parse_constraints(ps, constraints)) {
            //console.log("after constra A: " + ps.input);
          } else {
            const m = ps.input.match(
              /^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]+(.*)/i);
            if (m) {
              const aname = unquote(m[1]);
              const type = m[4];
              ps.input = m[6];

              const cs = [];
              parse_constraints(ps, cs);

              const m2 = ps.input.match(/^\s*,\s*(.*)/);
              if (m2) {
                ps.input = m2[1];
              }

              attributes.push(Attribute(aname, type, cs));
            } else if (ps.input === ')') {
              break;
            } else {
              winston.error('Unknown table ddl content', {
                input: ps.input
              });
              break;
            }
          }
        }
        while (ps.input.length > 0);

        tables[name] = Table(name, attributes, constraints);
      }
    }

    callback(null, tables);
  });
}

const RootSchema = Object.create({
  migrations: {},
  load(cb) {
    fs.readFile(this.schema_json_file, (error, data) => {
      if (error) {
        if (cb) cb(error);
        return;
      }
      this.load_from_object(JSON.parse(data));
      if (cb) cb(undefined, this);
    });
  },
  save(callback) {
    mkdirp(t.basedir, '0755', error => fs.writeFile(this.schema_json_file, JSON.stringify(t, undefined, '\t'),
      callback));
  },
  load_from_object(object) {
    const tables = {};

    for (const i in object.tables) {
      const t = object.tables[i];
      tables[i] = Table(i, t.attributes, t.constraints);
    }

    for (const j in object) {
      this[j] = object[j];
    }

    this.tables = tables;

    if (!this.versions) {
      this.versions = {};
      this.versions[this.schemaHash] = {
        tag: 1
      };
    }
  },
  load_ddl_from_db(db, callback) {
    tables_from_db(db, (error, tables) => {
      if (error) {
        callback(error);
        return;
      }
      this.tables = tables;

      if (!this.versions) {
        this.versions = {};
        this.versions[this.schemaHash] = {
          tag: 1
        };
      }

      callback(error, this);
    });
  },
  toJSON() {
    return {
      versions: this.versions,
      migrations: this.migrations,
      tables: this.tables
    };
  },

  exec_ddl(db, createOptions, callback) {

    if (!createOptions)
      createOptions = {
        'load_data': true
      };

    const create_tables = {};
    const alter_tables = [];

    for (const j in this.tables) {
      const t = this.tables[j];
      create_tables[t.name] = t;
    }

    const presentHash = crypto.createHash('sha1');
    const basedir = this.basedir;
    const schema = this;

    tables_from_db(db, (error, present_tables) => {
      if (error) {
        callback(error);
        return;
      }

      winston.info('present tables', Object.keys(present_tables));
      winston.info('desired tables', Object.keys(create_tables));

      const steps = [];
      const pre_steps = [];
      const post_steps = [];

      for (const i in present_tables) {
        const pt = present_tables[i];

        presentHash.update(pt.ddl_statement());

        const t = create_tables[pt.name];
        if (t) {
          const csql = t.ddl_statement();

          if (csql === pt.ddl_statement()) {
            delete create_tables[t.name];
          } else {
            // for now simply skip already existing table
            delete create_tables[t.name];

            //var backup_name = t.name + '_' + (schema.version - 1);
            //pre_steps.push("ALTER TABLE " + t.name + " RENAME TO " + backup_name);
            // TODO select all former attributes
            //post_steps.push("INSERT INTO " + t.name + "(" + t.attribute_names().join(',') + ") SELECT " + t.attribute_names().join(',') + " FROM " + backup_name);
            //post_steps.push("DROP TABLE " + backup_name);
          }
        }
      }

      for (const j in create_tables) {
        const t = create_tables[j];
        winston.info('ddl', {
          sql: t.ddl_statement()
        });
        steps.push(t.ddl_statement());
      }

      /*
        this.presentSchemaVersion = presentHash.digest("hex");

        var desiredSchemaVersion = schema.schemaHash;

        if(this.presentSchemaVersion !== desiredSchemaVersion) {
            winston.log("currentSchemaVersion: " + this.presentSchemaVersion);
            winston.log("desiredSchemaVersion: " + desiredSchemaVersion);

			if(schema.migrations) {
				var mig = schema.migrations[this.presentSchemaVersion];
				if(mig) {
		            winston.log("migrations: " + mig.statements.length);

				for(var i in mig.statements)
                	post_steps.push(mig.statements[i]);
				}
			}
			else
            	callback("schema migration required: " + this.presentSchemaVersion + " -> " + desiredSchemaVersion,this,db);
        }
		*/

      async.map(pre_steps, (sql, cb) => db.run(sql, cb),
        error => {
          if (error) {
            callback(error, this);
            return;
          }

          async.map(steps.concat(post_steps), (sql, cb) => db.run(sql, cb),
            error => {
              if (error) {
                callback(error, this);
                return;
              }

              if (createOptions.load_data) {
                var djs = path.join(basedir, 'data.json');
                fs.stat(djs, (error, stats) => {
                  if (error) return;
                  schema.migrate_data(db, JSON.parse(fs.readFileSync(djs)), callback);
                });
              } else {
                callback(undefined, schema, db);
                return;
              }
            });
        });
    });
  },
  migrate_data(db, data_sets, callback) {
    const update = function (table, sql, values) {
      const v = [];
      const l = table.pk().length;

      for (let i = l; i < values.length; i++) v.push(values[i]);
      for (let i = 0; i < l; i++) v.push(values[i]);

      db.get(sql, v, error => {
        if (error) {
          winston.error(error, {
            sql: sql + ' : ' + v.join(',')
          });
        }
      });
    };

    const insert = function (table, sql1, sql2, values) {
      db.get(sql1, values, error => {
        if (error) {
          if (sql2 !== undefined) update(table, sql2, values);
        }
      });
    };

    for (const i in data_sets) {
      const data = data_sets[i];
      const t = this.table(data.table);

      const updateSql = t.update_sql(data.attributes);
      const insertSql = t.insert_sql(data.attributes);

      for (const j in data.values) {
        insert(t, insertSql, updateSql, data.values[j]);
      }
    }
    callback(undefined, this, db);
  }
}, {
  schema_json_file: {
    get: function () {
      return path.join(this.basedir, 'schema.json');
    }
  },
  schemaHash: {
    get: function () {
      var hash = crypto.createHash('sha1');
      for (var j in this.tables) {
        hash.update(this.tables[j].ddl_statement());
      }
      return hash.digest('hex');
    },
    tables: {
      value: {},
      writeable: true,
      enumerable: true,
      configurable: true
    }
  }
});

/**
 * Creates an instance of Schema.
 *
 * @constructor
 * @this {Schema}
 * @param {options} string value holding schmema fs directory.
 */
const Schema = function (options, callback) {

  if (typeof options === 'string') {
    const schema = RootSchema.spawn({
      basedir: options
    });
    schema.load(callback);
    return schema;
  } else {
    const schema = RootSchema.spawn({});

    schema.load_from_object(options);

    if (callback) {
      callback(undefined, schema);
    }

    return schema;
  }
};

exports.Schema = Schema;
exports.Table = Table;
exports.Attribute = Attribute;
exports.Constraint = Constraint;
