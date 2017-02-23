/* jslint node: true, esnext: true */

'use strict';

const crypto = require('crypto'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  async = require('async');

  //import Table from './Table';
  import { quote, quoteIfNeeded, unquoteList, unquote } from './util';



export class Schema {
  constructor()
  {
    const tables = [];
    Object.defineProperty(this, 'tables', { value: tables });
  }

  save() {
    return new Promise((fullfill,reject) => {
      mkdirp(t.basedir, '0755', error => fs.writeFile(this.schema_json_file, JSON.stringify(t, undefined, '\t'),
        callback));
    });
  }
  
  load(object) {
    const tables = {};

    for (const i in object.tables) {
      const t = object.tables[i];
      tables[i] = new Table(i, t.attributes, t.constraints);
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
  }

  get ddlHash() {
    const hash = crypto.createHash('sha1');
    this.tables.forEach(t => hash.update(t.ddl));
    return hash.digest('hex');
    }

  toJSON() {
    return {
      versions: this.versions,
      migrations: this.migrations,
      tables: this.tables
    };
  }
}

  load(cb) {
    fs.readFile(this.schema_json_file, (error, data) => {
      if (error) {
        if (cb) cb(error);
        return;
      }
      this.load_from_object(JSON.parse(data));
      if (cb) cb(undefined, this);
    });
  }


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
  }

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
                const djs = path.join(basedir, 'data.json');
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
    tables: {
      value: {},
      writeable: true,
      enumerable: true,
      configurable: true
    }
  }
});
