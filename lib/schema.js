
"use strict";

var crypto   = require('crypto')
   ,fs       = require('fs')
   ,path     = require("path")
   ,async    = require("async");

var Constraint = function(options) {

    if(typeof options === 'string') {
        this.name = options;
    }
    else {
        this.name       = options.name;
        this.attributes = options.attributes;
    }

    this.create = function() {
        if(this.attributes) {
            return this.name + "(" + this.attributes.join(',') + ")";
        }

        return this.name;
    };
};

var Attribute = function(name,type,constraints) {
    this.name = name;
    this.type = type;

    if(constraints instanceof Array) {
        for (var i in constraints) {
            if(!(constraints[i] instanceof Constraint))
                constraints[i] = new Constraint(constraints[i]);
        }

        this.constraints = constraints;
    }
    else if(constraints == undefined) {
        this.constraints = [];
    }
    else {
        this.constraints = [new Constraint(constraints)];
    }

    this.create = function() {
        var c = [this.name,this.type];
        for (var i in this.constraints)
            c.push(this.constraints[i].create());

        return c.join(" ");
    };
};



var Table = function(name,attributes,constraints) {
    this.name       = name;
    this.attributes = attributes;
    this.constraints= constraints;

    for (var i in attributes) {
        var a = attributes[i];
        if(!(a instanceof Attribute))
            this.attributes[i] = new Attribute(a.name,a.type,a.constraints); }

    for (var i in constraints) {
        var c = constraints[i];
        if(!(c instanceof Constraint))
            this.constraints[i] = new Constraint(c); }

    this.create = function() {
        var atts = [];

        for (var i in this.attributes) {
            atts.push(this.attributes[i].create());
        }

        for (var i in this.constraints) {
            atts.push(this.constraints[i].create());
        }

        return "CREATE TABLE " + quote(this.name) + "(" + atts.join(',') + ")";
    };

    this.insert_sql = function(attributes) {
        var qm = [];

        for(var k in attributes) qm.push('?');

        return "INSERT INTO " + this.name + "(" + attributes.join(',') + ") VALUES(" + qm.join(',') + ")";
    }

    this.update_sql = function(attributes) {
        var j = this.pk().length;
        var a = [];
        for(var i in attributes) {
            if(i >= j)
                a.push(attributes[i] + "=?");
        }

        if(a.length == 0) return undefined;
        return "UPDATE " + this.name + " SET " +  a.join(',') +  " WHERE " + this.pk_predicate();
    };

    this.attribute = function(name) {
        for(var i in this.attributes) {
            var a = this.attributes[i];
            if(a.name == name) return a;
        }
        return undefined;
    };

    this.pk = function() {
        var pk = [];
        for(var i in this.attributes) {
            var a = this.attributes[i];
            for(var j in a.constraints) {
                var c = a.constraints[j];
                if(c.name == "primary key") pk.push(a);
            }
        }

        for(var i in this.constraints) {
            var c = this.constraints[i];

            if(c.name == "primary key") {
                for(var j in c.attributes) pk.push(this.attribute(c.attributes[j]));
            }
        }

        return pk;
    };

    this.pk_predicate = function(alias,values) {
        var ps = [];
        var pk = this.pk();

        for(var i in pk) {
            ps.push(( alias ? [alias,pk[i].name].join(".") : pk[i].name ) + "=?");
        }

        return ps.join(' AND ');
    };

    this.next_pk = function(db,callback) {
        db.get("SELECT MAX(" +  this.pk()[0].name + ") + 1 FROM " + this.name, callback);
    }
};

var Schema = function(options) {

    this.tables = [];

    if(typeof options === 'string') {
        this.basedir = options;
        options    = JSON.parse(fs.readFileSync(path.join(this.basedir,'schema.json')));
        this.name  = options.name;
    }

    if(options instanceof Array) {
        this.tables = options;
    }
    else {
        for (var i in options.tables) {
            var t = options.tables[i];
            this.tables[i] = new Table(t.name,t.attributes,t.constraints); }
    }

    this.table = function(name) {
        for(var i in this.tables) {
            if(this.tables[i].name === name) return this.tables[i];
        }
        return undefined;
    }

    this.create = function(db,createOptions,callback) {
        if(!callback) {
            callback = function(error,schema) { if(error) console.log(error); };
        }
        if(!createOptions) {
            createOptions = { "load_data" : true };
        }

        var create_tables = {};
        var alter_tables  = [];

        for (var j in this.tables) {
            var t = this.tables[j];
            create_tables[t.name] = t; }

        var presentHash = crypto.createHash('sha1');
        var desiredHash = crypto.createHash('sha1');

        var basedir = this.basedir;

        var schema = this;

        db.all("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
            if (error) { throw error; }

            var steps = [];

            for (var i in rows) {
                var row = rows[i];

                presentHash.update(row.sql);

                var t = create_tables[row.name];
                if(t) {
                    var csql = t.create();
                    desiredHash.update(csql);

                    if(csql === row.sql) {
                        create_tables[t.name] = undefined; }
                    else {
                        steps.push("ALTER TABLE " + t.name + " RENAME TO " + t.name + "-old");
                    }
                }
            }

            for (var j in create_tables) {
              var t = create_tables[j];
              if(t) { steps.push(t.create()); }
        }

        this.presentSchemaVersion = presentHash.digest("hex");
        this.desiredSchemaVersion = desiredHash.digest("hex");

        if(this.presentSchemaVersion !== this.desiredSchemaVersion) {
            console.log("currentSchemaVersion: " + this.presentSchemaVersion);
            console.log("desiredSchemaVersion: " + this.desiredSchemaVersion);
            callback("schema migration required",this);
        }

        async.map(steps, function(sql,cb) { db.run(sql,cb); }, function(error) {
            if(error) { callback(error,this); return; }

            if(createOptions.load_data) {
                var djs = path.join(basedir,'data.json');
                fs.stat(djs, function(error,stats) {
                    if(error) return;
                    schema.migrate_data(db, JSON.parse(fs.readFileSync(djs)), callback);
                    });
                }
            else {
                callback(undefined,schema);
                return;
                }
            });
        });
    };

    this.migrate_data = function(db,data_sets,callback) {
        for (var i in data_sets) {
            var data = data_sets[i];
            var t = this.table(data.table);

            var update = function(sql,values) {
                var v = [];
                var l = t.pk().length;

                for (var i = l; i < values.length; i++) v.push(values[i]);
                for (var i = 0; i < l; i++) v.push(values[i]);

                db.get(sql, v, function(error) {
                    if(error) { 
                        console.log(sql + " : " + v.join(','));
                        console.log(error);
                    }
                });
            };

            var insert = function(sql1,sql2,values) {
                db.get(sql1, values, function(error) {
                    if(error) {
                        if(sql2 != undefined) update(sql2,values);
                    }
                });
            };

            var updateSql = t.update_sql(data.attributes);
            var insertSql = t.insert_sql(data.attributes);

            for (var j in data.values) {
                insert(insertSql,updateSql,data.values[j]);
            }
        }
        callback(undefined,this);
    };
};

function quote(name) { return name; }

exports.schema              = Schema;
exports.table               = Table;
exports.attribute           = Attribute;
exports.constraint          = Constraint;
