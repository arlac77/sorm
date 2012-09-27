
"use strict";

var crypto   = require('crypto')
   ,fs       = require('fs')
   ,path     = require("path")
   ,mkdirp   = require('mkdirp')
   ,async    = require("async");


var _Constraint = {
	"create" : function() {
		if(this.attributes) {
			return this.name + "(" + this.attributes.join(',') + ")";
		}

		return this.name;
	}
};

/**
 * Creates an instance of Constraint.
 *
 * @constructor
 * @this {Constraint}
 * @param {options} either a string or a object with name and attributes.
 */
var Constraint = function(options) {

    if(typeof options === 'string') {
		return Object.create(_Constraint,{
			"name" : { value : options, enumerable : true },
		});
	}
	
	return Object.create(_Constraint,{
		"name" : { value : options.name, enumerable : true },
		"attributes" : { value : options.attributes, enumerable : true },
	});
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
			cs.push(Constraint("DEFAULT " + (matches[2] ? matches[2] : matches[3])));
			return matches[4];
		}
	},
	{
		regex: /^CONSTRAINT\s+((\"([^\"]+)\")|([a-z][a-z_0-9]*))\s+(.*)/im,
		parse: function(matches,cs) {
			matches[5] = matches[5].replace(/\s+$/,'');
			cs.push(Constraint(matches[1] + ' ' + matches[5]));
			return '';
		}
	}
	];

function parse_contraints(cs,str) {
	var gotSomething;

	if(str) {
		do {
			gotSomething = false;
			for(var i in constraints) {
				var m = str.match(constraints[i].regex);
				if(m) {
					gotSomething = true;
					if(constraints[i].parse) {
						str = constraints[i].parse(m,cs);						
					}
					else {
						str = m[1];
						cs.push(Constraint(constraints[i].name));
					}
				}
 			}
		}
		while(gotSomething);
	}

	return cs;
}

var _Attribute = {
    "create" : function() {
        var c = [this.name,this.type];
        for (var i in this.constraints)
            c.push(this.constraints[i].create());

        return c.join(" ");
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
var Attribute = function(name,type,cs) {

	var constraints = [];

    if(cs instanceof Array) {
        for (var i in cs) {
            if(!(cs[i] instanceof Constraint))
                constraints[i] = Constraint(cs[i]);
        }
    }
    else {
        parse_contraints(constraints,cs);
    }

	return Object.create(_Attribute,{
		"name" : { value : name, enumerable : true },
		"type" : { value : type, enumerable : true },
		"constraints" : { value : constraints, enumerable : true }
		});
};


var _Table = {
    "create" : function() {
        var atts = [];
        var i;

        for (i in this.attributes) {
            atts.push(this.attributes[i].create());
        }

        for (i in this.constraints) {
            atts.push(this.constraints[i].create());
        }

        return "CREATE TABLE " + this.name + "(" + atts.join(",") + ")";
    },
    "attribute_names" : function() {
        var names = [];
        var i;
        for(i in this.attributes) names.push(this.attributes[i].name);
        return names;
    },
    "insert_sql" : function(attributes) {
        var qm = [];

        for(var k in attributes) qm.push('?');

        return "INSERT INTO " + this.name + "(" + attributes.join(',') + ") VALUES(" + qm.join(',') + ")";
    },
	"update_sql" : function(attributes) {
        var j = this.pk().length;
        var a = [];
        for(var i in attributes) {
            if(i >= j)
                a.push(attributes[i] + "=?");
        }

        if(a.length === 0) return undefined;
        return "UPDATE " + this.name + " SET " +  a.join(',') +  " WHERE " + this.pk_predicate();
    },
    "attribute" : function(name) {
        for(var i in this.attributes) {
            var a = this.attributes[i];
            if(a.name === name) return a;
        }
        return undefined;
    },
    "pk" : function() {
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
    },
	"pk_predicate" : function(alias,values) {
        var ps = [];
        var pk = this.pk();

        for(var i in pk) {
            ps.push(( alias ? [alias,pk[i].name].join(".") : pk[i].name ) + "=?");
        }

        return ps.join(' AND ');
    },
    "next_pk" : function(db,callback) {
        db.get("SELECT MAX(" +  this.pk()[0].name + ") + 1 FROM " + this.name, callback);
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
var Table = function(name,attributes,constraints) {

    var i;
    
    for (i in attributes) {
        var a = attributes[i];
        if(!(a instanceof Attribute))
            attributes[i] = Attribute(a.name,a.type,a.constraints); }

    for (i in constraints) {
        var c = constraints[i];
        if(!(c instanceof Constraint))
            constraints[i] = Constraint(c); }

	return Object.create(_Table,{
		"name" : { value : name, enumerable : true },
		"attributes" : { value : attributes, enumerable : true },
		"constraints" : { value : constraints, enumerable : true }
		});
};


function tables_from_db(db,callback)
{
    db.all("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
        if(error) { callback(error); return; }

		var tables = {};
        for (var i in rows) {
            var row = rows[i];
			var sql = row.sql.split(/\n/).join(' ');

			var m = sql.match(/CREATE\s+TABLE\s+((\"([^\"]+)\")|([a-z][a-z0-9_]*))\s*\((.*)/im);			
			if(m) {
				var attributes = [];
				var constraints = [];
				var name = m[3] ? m[3] : m[4];
				var remaining = m[5];
				remaining = (remaining.match(/(.*)\)$[\s;]*/m))[1];
				var as = remaining.split(/\s*,\s*/);

				for(var j in as) {
					if(m = as[j].match(/^\s*CONSTRAINT\s/i)) {
						parse_contraints(constraints,as[j]);
					}
					else {
						m = as[j].match(/^\s*((\"([^\"]+)\")|([a-z][a-z_0-9]*))\s+([^\s]+)\s+(.*)/i);
						if(m) {
							var aname = m[3] ? m[3] : m[4];
							attributes.push(Attribute(aname,m[5],m[6]));
						}
						else {
							console.log("Unknown attribute: " + as[j]);
						}
					}
				}
				tables[name] = Table(name, attributes, constraints);
			}
		}

		callback(null,tables);
	});
}

var _Schema = Object.create({
	"load" : function(cb) {
		var t = this;
		
		fs.readFile(this.schema_json_file,function(error,data) {
			if(error) { cb(error); return; }
			t.load_from_object(JSON.parse(data));				
			cb(undefined,t);
		});
	},
	"save" : function(callback) {
		var t = this;
		mkdirp(t.basedir,'0755',function(error) {
			fs.writeFile(t.schema_json_file,JSON.stringify(t, undefined, '\t'),callback);
		});
	},
	"load_from_object" : function(object) {
		var tables = {};
		for(var i in object.tables) {
			var t = object.tables[i];
			tables[t.name]=Table(t.name,t.attributes,t.constraints);
		}

		var properties = { "tables" : { value : tables, enumerable : true }};
		if(object.name) { properties['name'] = { value : object.name, enumerable : true } };
		if(object.version) { properties['version'] = { value : object.version, enumerable : true } };
		
		Object.defineProperties(this, properties);
	},
	"load_ddl_from_db" : function(db,callback) {
		var t = this;
		
		tables_from_db(db, function(error, tables) {
			if(error) { callback(error); return; }
			Object.defineProperty(t, "tables", { value : tables, enumerable : true });
			callback(error,t);
		});
	},
	"create" : function(db,createOptions,callback) {
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

        var desiredSchemaVersion = schema.schemaHash;

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
    },
	"migrate_data" : function(db,data_sets,callback) {
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
    }
},{
	"schema_json_file" : { get : function() { return path.join(this.basedir, "schema.json"); } },
	"version" : { value : 1, enumerable : true, configurable : true },
	"name" : { value : "unknown", enumerable : true, configurable : true },
	"tables" : { value : {}, enumerable : true, configurable : true },
	"schemaHash" : { get : function() {
        var hash = crypto.createHash('sha1');
        for (var j in this.tables) hash.update(this.tables[j].create());
        return hash.digest("hex"); }
	}
});

/**
 * Creates an instance of Schema.
 *
 * @constructor
 * @this {Schema}
 * @param {options} string value holding schmema fs directory.
 */
var Schema = function(options) {
    if(typeof options === 'string') {
		return Object.create(_Schema,{
			"basedir" : { value : options }
		});
    }
    else {
		var s = Object.create(_Schema,{});
		
		s.load_from_object(options);
		return s;
    }
};

exports.Schema              = Schema;
exports.Table               = Table;
exports.Attribute           = Attribute;
exports.Constraint          = Constraint;
