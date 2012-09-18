
"use strict";

var crypto   = require('crypto')
   ,fs       = require('fs')
   ,path     = require("path")
   ,async    = require("async");

/**
 * Creates an instance of Constraint.
 *
 * @constructor
 * @this {Constraint}
 * @param {options} either a string or a object with name and attributes.
 */
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

var constraints = [
	{
		regex: /^primary\s+key\s*(.*)/im,
		name: "PRIMARY KEY" },
	{
		regex: /^not\s+null\s*(.*)/im,
		name: "NOT NULL" },
	{
		regex: /^null\s*(.*)/im,
		name: "NULL" },
	{
		regex: /^default\s+(('[^']*')|(null))(.*)/im,
		parse: function(matches,cs) {
			cs.push(new Constraint("DEFAULT " + (matches[2] ? matches[2] : matches[3])));
			return matches[4];
		} }
	];

function parse_contraints(s) {
	var cs = [];
	var gotSomething;

	if(s) {
		do {
			gotSomething = false;
			for(var i in constraints) {
				var m = s.match(constraints[i].regex);
				if(m) {
					gotSomething = true;
					if(constraints[i].parse) {
						s = constraints[i].parse(m,cs);						
					}
					else {
						s = m[1];
						cs.push(new Constraint(constraints[i].name));
					}
				}
 			}
		}
		while(gotSomething);
	}

	return cs;
}

/**
 * Creates an instance of Attribute.
 *
 * @constructor
 * @this {Attribute}
 * @param {name} attribute name.
 * @param {type} attribute type.
 * @param {constraints} Array of Constraints.
 */
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
    else {
        this.constraints = parse_contraints(constraints);
    }

    this.create = function() {
        var c = [this.name,this.type];
        for (var i in this.constraints)
            c.push(this.constraints[i].create());

        return c.join(" ");
    };
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
var Table = function(name,attributes,constraints) {
    this.name       = name;
    this.attributes = attributes;
    this.constraints= constraints;

    var i;
    
    for (i in attributes) {
        var a = attributes[i];
        if(!(a instanceof Attribute))
            this.attributes[i] = new Attribute(a.name,a.type,a.constraints); }

    for (i in constraints) {
        var c = constraints[i];
        if(!(c instanceof Constraint))
            this.constraints[i] = new Constraint(c); }

    this.create = function() {
        var atts = [];
        var i;

        for (i in this.attributes) {
            atts.push(this.attributes[i].create());
        }

        for (i in this.constraints) {
            atts.push(this.constraints[i].create());
        }

        return "CREATE TABLE " + this.name + "(" + atts.join(",") + ")";
    };

    this.attribute_names = function() {
        var names = [];
        var i;
        for(i in this.attributes) names.push(this.attributes[i].name);
        return names;
    };
    
    this.insert_sql = function(attributes) {
        var qm = [];

        for(var k in attributes) qm.push('?');

        return "INSERT INTO " + this.name + "(" + attributes.join(',') + ") VALUES(" + qm.join(',') + ")";
    };

    this.update_sql = function(attributes) {
        var j = this.pk().length;
        var a = [];
        for(var i in attributes) {
            if(i >= j)
                a.push(attributes[i] + "=?");
        }

        if(a.length === 0) return undefined;
        return "UPDATE " + this.name + " SET " +  a.join(',') +  " WHERE " + this.pk_predicate();
    };

    this.attribute = function(name) {
        for(var i in this.attributes) {
            var a = this.attributes[i];
            if(a.name === name) return a;
        }
        return undefined;
    };

    this.pk = function() {
        var pk = [];
        var i,j,c;
        
        for(i in this.attributes) {
            var a = this.attributes[i];
            for(j in a.constraints) {
                c = a.constraints[j];
                if(c.name.search(/primary key/) >= 0) pk.push(a);
            }
        }

        for(i in this.constraints) {
            c = this.constraints[i];

            if(c.name.search(/primary key/) >= 0) {
                for(j in c.attributes) pk.push(this.attribute(c.attributes[j]));
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
    };
};


function tables_from_db(db,callback)
{
    db.all("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
        if(error) { callback(error); return; }

		var tables = [];
        for (var i in rows) {
            var row = rows[i];
			var sql = row.sql.split(/\n/).join(' ');

			var m = sql.match(/CREATE\s+TABLE\s+((\"([^\"]+)\")|([a-z][a-z0-9_]*))\s*\((.*)/im);			
			if(m) {
				var attributes = [];
				var name = m[3] ? m[3] : m[4];
				var remaining = m[5];
				remaining = (remaining.match(/(.*)\)$[\s;]*/m))[1];
				var as = remaining.split(/\s*,\s*/);

				for(var j in as) {
					m = as[j].match(/^\s*((\"([^\"]+)\")|([a-z][a-z_0-9]*))\s+([^\s]+)\s+(.*)/i);
					if(m) {
						var aname = m[3] ? m[3] : m[4];
						
						attributes.push(new Attribute(aname,m[5],m[6]));
					}
					else {
						console.log("Unknown atribute: " + as[j]);
					}
				}
				tables.push(new Table(name, attributes,[]));
			}
		}

		callback(null,tables);
	});
}

/**
 * Creates an instance of Schema.
 *
 * @constructor
 * @this {Schema}
 * @param {options} string value holding schmema fs directory.
 */
var Schema = function(options) {

    this.tables = [];

    if(typeof options === 'string') {
        this.basedir    = options;
        options         = JSON.parse(fs.readFileSync(path.join(this.basedir,'schema.json')));
        this.name       = options.name;
        this.version    = options.version;
        this.migrations = options.migrations;
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
    };

    this.schemaHash = function() {
        var hash = crypto.createHash('sha1');
        for (var j in this.tables) hash.update(this.tables[j].create());
        return hash.digest("hex");
    };
	
    this.create = function(db,createOptions,callback) {
        if(!callback) {
            callback = function(error,schema,db) { if(error) console.log(error); };
        }
        if(!createOptions)
            createOptions = { "load_data" : true };

        var create_tables = {};
        var alter_tables  = [];

        for (var j in this.tables) {
            var t = this.tables[j];
            create_tables[t.name] = t; }

        var presentHash = crypto.createHash('sha1');

        var basedir = this.basedir;

        var schema = this;

        db.all("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
            if (error) { throw error; }

            var steps = [];
            var pre_steps = [];
            var post_steps = [];
            var t;
            
            for (var i in rows) {
                var row = rows[i];

                presentHash.update(row.sql);

                t = create_tables[row.name];
                if(t) {
                    var csql = t.create();

                    if(csql === row.sql) {
                        create_tables[t.name] = undefined; }
                    else {
                        //var backup_name = t.name + "_" + (schema.version - 1);
                        //pre_steps.push("ALTER TABLE " + t.name + " RENAME TO " + backup_name);
						// TODO select all former attributes
                        //post_steps.push("INSERT INTO " + t.name + "(" + t.attribute_names().join(',') + ") SELECT " + t.attribute_names().join(',') + " FROM " + backup_name);
                        //post_steps.push("DROP TABLE " + backup_name);
                    }
                }
            }

            for (var j in create_tables) {
              t = create_tables[j];
              if(t) { steps.push(t.create()); }
        }

        this.presentSchemaVersion = presentHash.digest("hex");

        var desiredSchemaVersion = schema.schemaHash();

        if(this.presentSchemaVersion !== desiredSchemaVersion) {
            console.log("currentSchemaVersion: " + this.presentSchemaVersion);
            console.log("desiredSchemaVersion: " + desiredSchemaVersion);
			
			if(schema.migrations) {
				var mig = schema.migrations[this.presentSchemaVersion];
				if(mig) {
		            console.log("migrations: " + mig.statements.length);
					
				for(var i in mig.statements)
                	post_steps.push(mig.statements[i]);
				}
			}
			else
            	callback("schema migration required",this,db);
        }

        async.map(pre_steps,
            function(sql,cb) { db.run(sql,cb); },
            function(error) {
                if(error) { callback(error,this); return; }

                async.map(steps.concat(post_steps),
                    function(sql,cb) { db.run(sql,cb); },
                    function(error) {
                        if(error) { callback(error,this); return; }
        
                        if(createOptions.load_data) {
                            var djs = path.join(basedir,'data.json');
                            fs.stat(djs, function(error,stats) {
                                if(error) return;
                                schema.migrate_data(db, JSON.parse(fs.readFileSync(djs)), callback);
                                });
                            }
                        else {
                            callback(undefined,schema,db);
                            return;
                        }
                    });
                });
            });
    };

    this.migrate_data = function(db,data_sets,callback) {
        var update = function(table,sql,values) {
                var i;
                var v = [];
                var l = table.pk().length;

                for (i = l; i < values.length; i++) v.push(values[i]);
                for (i = 0; i < l; i++) v.push(values[i]);

                db.get(sql, v, function(error) {
                    if(error) { 
                        console.log(sql + " : " + v.join(','));
                        console.log(error);
                    }
                });
            };
            
        var insert = function(table,sql1,sql2,values) {
            db.get(sql1, values, function(error) {
                if(error) {
                    if(sql2 !== undefined) update(table,sql2,values);
                }
            });
        };           

    for (var i in data_sets) {
        var data = data_sets[i];
        var t = this.table(data.table);

        var updateSql = t.update_sql(data.attributes);
        var insertSql = t.insert_sql(data.attributes);

        for (var j in data.values) {
            insert(t,insertSql,updateSql,data.values[j]);
        }
    }
        callback(undefined,this,db);
    };
};

exports.tables_from_db      = tables_from_db;
exports.Schema              = Schema;
exports.Table               = Table;
exports.Attribute           = Attribute;
exports.Constraint          = Constraint;
