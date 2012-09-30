
"use strict";

var crypto   = require('crypto')
   ,fs       = require('fs')
   ,path     = require("path")
   ,mkdirp   = require('mkdirp')
   ,async    = require("async");


Object.defineProperty(Object.prototype, "spawn", {value: function (props) {
	var defs = {}, key;
	for(key in props) {
		if(props.hasOwnProperty(key)) {
			defs[key] = {value: props[key], enumerable: true };
		}
	}
	return Object.create(this, defs);
}});

function quote(str)
{
	return "\'" + str + "\'";
}

function unquote(str)
{
	str = str.replace(/^[\'\"]/,'');
	str = str.replace(/[\'\"]$/,'');
	return str;
}

var orderedConstraints = [];
var constraints = {};

var RootConstraint = {
   	ddl_statement : function() {
   		if(this.attributes) {
   			return this.name + "(" + this.attributes.join(',') + ")";
   		}

   		return this.name;
   	},
	toJSON: function () {
	    return { name : this.name };
	},
	toString: function() { return this.ddl_statement(); }
};

function parse_constraints(cs,str) {
	var gotSomething;

	if(str) {
		do {
			gotSomething = false;
			if(! str) break;

			for(var i in orderedConstraints) {
				var oc = orderedConstraints[i];
				
				var m = str.match(oc.regex);

				//console.log(str + " <> " + oc.regex + " ::: "  + m);

				if(m) {
					gotSomething = true;
					if(oc.parse) {
						str = oc.parse(m,cs,oc);						
					}
					else {
						str = m[1];
						cs.push(Constraint(oc));
					}
					
					break;
				}
 			}
		}
		while(gotSomething);
	}

	return cs;
}

function create_constraint(definition) {
	var c = RootConstraint.spawn(definition);
	orderedConstraints.push(c);
	constraints[c.name] = c;
}

create_constraint({
   	name: "PRIMARY KEY",
   	regex: /^primary\s+key(\s+(ASC|DESC))?\s*(.*)/im,
	toJSON: function() { return { name : this.name, options: this.options }; },
	ddl_statement: function() { return this.options ? this.name + " " + this.options : this.name; },
	parse: function(matches,cs,constraint) {
		var options = matches[2];
		var c = options ? Constraint(constraint, { options : options.toUpperCase() }) : Constraint(constraint);
		cs.push(c);
		return matches[3];
	}
});

create_constraint({
	name: "NOT NULL",
	regex: /^not\s+null\s*(.*)/im
});

create_constraint({
	name: "NULL",
	regex: /^null\s*(.*)/im
});

create_constraint({
	name: "DEFAULT",
	regex: /^default\s+(('[^']*')|("[^"]*")|(null)|(\d+))(.*)/im,
	toJSON: function() { return { name : this.name, value: this.value }; },
	ddl_statement: function() { return this.name + " " + this.value; },
	parse: function(matches,cs,constraint) {
		var value = matches[1];
		if(value === 'null') value = 'NULL';
		cs.push(Constraint(constraint, { value : value } ));
		return matches[6];
	}
});

create_constraint({
	name: "CONSTRAINT",
	regex: /^CONSTRAINT\s+((\'([^\']+)\')|(\"([^\"]+)\")|([a-z][a-z_0-9]*))\s+(.*)/im,
	toJSON: function() { return { name : this.name, id: this.id, value: this.value }; },
	ddl_statement: function() { return "CONSTRAINT " + quote(this.id) + " " + this.value; },
	parse: function(matches,cs,constraint) {
		var value = matches[7].replace(/\s+$/,'');
		cs.push(Constraint(constraint, { id: unquote(matches[1]), value: value }));
		return '';
	}
});

/**
 * Creates an instance of Constraint.
 *
 * @constructor
 * @this {Constraint}
 * @param {options} either a string or a object with name and attributes.
 */
var Constraint = function(type,properties) {

    if(typeof type === 'string') {
		var c = constraints[type.toUpperCase()];
		if(c) { return c; }
		
		var cs = [];

		parse_constraints(cs,type);

		c = cs[0];

		if(!c) { console.log("Unknown constraint: " + type); return undefined; }
		return c;
	}
	
	return properties ? type.spawn(properties) : type;
};



var _Attribute = {
    "ddl_statement" : function() {
        var c = [this.name,this.type];
        for (var i in this.constraints)
            c.push(this.constraints[i].ddl_statement());

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
			var csi = cs[i];
			constraints[i] = csi instanceof Constraint ? csi : Constraint(csi)
        }
    }
    else {
        parse_constraints(constraints,cs);
    }

	return Object.create(_Attribute,{
		"name" : { value : name, enumerable : true },
		"type" : { value : type, enumerable : true },
		"constraints" : { value : constraints, enumerable : true }
		});
};


var _Table = {
    "ddl_statement" : function() {
        var atts = [];
        var i;

        for (i in this.attributes) {
            atts.push(this.attributes[i].ddl_statement());
        }

        for (i in this.constraints) {
            atts.push(this.constraints[i].ddl_statement());
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
                if(c.name.search(/PRIMARY KEY/) >= 0) pk.push(a);
            }
        }

        for(i in this.constraints) {
            c = this.constraints[i];

            if(c.name.search(/PRIMARY KEY/) >= 0) {
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
		"name" : { value : name, enumerable : false },
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
						parse_constraints(constraints,as[j]);
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
			if(error) { if(cb) cb(error); return; }
			t.load_from_object(JSON.parse(data));				
			if(cb) cb(undefined,t);
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
			tables[i]=Table(i,t.attributes,t.constraints);
		}

		for(var j in object) { this[j] = object[j]; }
		
		this.tables = tables;
	},
	"load_ddl_from_db" : function(db,callback) {
		var t = this;
		
		tables_from_db(db, function(error, tables) {
			if(error) { callback(error); return; }
			t.tables = tables;
			callback(error,t);
		});
	},
	"exec_ddl" : function(db,createOptions,callback) {
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
                    var csql = t.ddl_statement();

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
              if(t) { steps.push(t.ddl_statement()); }
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
	"version" : { value : 1, writable: true, enumerable : true, configurable : true },
	"name" : { value : "unknown", writeable: true, enumerable : true, configurable : true },
	"tables" : { value : {}, writeable: true, enumerable : true, configurable : true },
	"toJSON" : function() { return { name : this.name, version: this.version, tables: this.tables }; },

	"schemaHash" : { get : function() {
        var hash = crypto.createHash('sha1');
        for (var j in this.tables) hash.update(this.tables[j].ddl_statement());
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
var Schema = function(options,callback) {
    if(typeof options === 'string') {
		var schema = Object.create(_Schema,{
			"basedir" : { value : options },
		});
		schema.load(callback);
		return schema;
    }
    else {
		var schema = Object.create(_Schema,{});
		
		schema.load_from_object(options);
		
		if(callback) { callback(undefined,schema); }

		return schema;
    }
};

exports.Schema              = Schema;
exports.Table               = Table;
exports.Attribute           = Attribute;
exports.Constraint          = Constraint;
