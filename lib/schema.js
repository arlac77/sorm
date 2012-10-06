
"use strict";

var crypto   = require('crypto')
   ,fs       = require('fs')
   ,path     = require("path")
   ,mkdirp   = require('mkdirp')
   ,async    = require("async")
   ,winston  = require('winston');


Object.defineProperty(Object.prototype, "spawn", { value: function(props) {
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
	return "\"" + str + "\"";
}

function optional_quote(str)
{
	if(str.match(/^[a-z_][a-z0-9_]*$/i))
		return str; 
	else
		return "\"" + str + "\"";
}

function unquote_list(str)
{
	var l = str.split(',')

	for(var i in l) {
		l[i] = l[i].replace(/^[\'\"]/,'');
		l[i] = l[i].replace(/[\'\"]$/,'');
	}

	return l;
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
   		return this.name;
   	},
	toJSON: function () {
	    return { name : this.name };
	},
	toString: function() { return this.ddl_statement(); }
};

function parse_constraints(ps,cs) {
	var gotSomething;

	var str = ps.input;

	if(str) {
		do {
			gotSomething = false;
			if(! str) break;

			for(var i in orderedConstraints) {
				var oc = orderedConstraints[i];
				
				var m = str.match(oc.regex);

				//winston.log(str + " <> " + oc.regex + " ::: "  + m);

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

	ps.input = str;

	return gotSomething;
}

function create_constraint(definition) {
	var c = RootConstraint.spawn(definition);
	orderedConstraints.push(c);
	constraints[c.name] = c;
}

create_constraint({
   	name: "PRIMARY KEY",
   	regex: /^primary\s+key(\s+(asc|desc))?\s*(\(([^/)]+)\))?(.*)/im,
	toJSON: function() {
		var o = { name : this.name };
		if(this.options) o.options = this.options.toUpperCase();
		if(this.attributes) o.attributes = this.attributes;
		return o;
	},
	ddl_statement: function() {
		var s = this.name;
		if(this.options) { s += " " + this.options.toUpperCase(); }
   		if(this.attributes) { s += "(" + this.attributes.join(',') + ")"; }
		return s;
	},
	parse: function(matches,cs,constraint) {
		var properties = {};
		if(matches[2]) properties.options = matches[2];
		if(matches[3]) {
			properties.attributes = matches[4].split(/,/);
			for(var i in properties.attributes) {
				properties.attributes[i] = unquote(properties.attributes[i]);
			}
		}
		cs.push(Constraint(constraint,properties));
		return matches[5];
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
	regex: /^default\s+(('[^']*')|("[^"]*")|(\d+)|(null))(.*)/im,
	toJSON: function() { return { name : this.name, value: this.value }; },
	ddl_statement: function() {
		var v = "NULL";
		if(typeof this.value === 'string') v = quote(this.value);
		else if(typeof this.value === 'number') v = this.value;
		return this.name + " " + v; },
	parse: function(matches,cs,constraint) {
		var properties = {};
		if(matches[2]) properties.value = unquote(matches[2]);
		if(matches[3]) properties.value = unquote(matches[3]);
		if(matches[4]) properties.value = parseInt(matches[4]);
		cs.push(Constraint(constraint, properties));
		return matches[6];
	}
});

create_constraint({
	name: "FOREIGN KEY",
	regex: /^CONSTRAINT\s+((\'[^\']+\')|(\"[^\"]+\")|([a-z][a-z_0-9]*))\s+FOREIGN\s+KEY\s*\(([^\)]+)\)\s*REFERENCES\s*((\'[^\']+\')|(\"[^\"]+\")|([a-z][a-z_0-9]*))\s*\(([^\)]+)\)(.*)/im,
	toJSON: function() { return { name: this.name, id: this.id, attributes: this.attributes, foreign_table: this.foreign_table, foreign_attributes: this.foreign_attributes }; },
	ddl_statement: function() { return "CONSTRAINT " + optional_quote(this.id) + 
		" FOREIGN KEY(" + this.attributes.join(',') + ") REFERENCES " +
		optional_quote(this.foreign_table) + "(" + this.foreign_attributes.join(',') + ")"; },
	parse: function(matches,cs,constraint) {
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
var Constraint = function(type,properties) {

    if(typeof type === 'string') {
		var c = constraints[type.toUpperCase()];
		if(c) { return c; }
		
		var cs = [];

		parse_constraints({input: type }, cs);

		c = cs[0];

		if(!c) { winston.warn("Unknown constraint", type); return undefined; }
		return c;
	}
	else if(properties === undefined) {
		var properties = {}, key;
		for(key in type) {
			if(key !== 'name')
				properties[key] = type[key];
		}
		
		type = constraints[type.name.toUpperCase()];
	}
	
	return type.spawn(properties);
};



var RootAttribute = {
    "ddl_statement" : function() {
        var c = [this.name,this.type];
        for (var i in this.constraints)
            c.push(this.constraints[i].ddl_statement());

        return c.join(" ");
    },
	toJSON: function () {
	    var o = { name : this.name, type: this.type};
		if(this.constraints.length > 0) o.constraints = this.constraints;
		return o;
	},
	toString: function() { return this.ddl_statement(); }
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
			constraints[i] = csi instanceof Constraint ? csi : Constraint(csi);
        }
    }
    else {
        parse_constraints({input: cs }, constraints);
    }

	return RootAttribute.spawn({
		"name" : name,
		"type" : type,
		"constraints" : constraints
		});
};


var RootTable = {
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
	toJSON: function () {
	    var o = { name : this.name, attributes: this.attributes };
		if(this.constraints && this.constraints.length > 0) o.constraints = this.constraints;
		return o;
	},
	toString: function() { return this.ddl_statement(); },
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

	return RootTable.spawn({
		"name" : name,
		"attributes" : attributes,
		"constraints" : constraints
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
			//console.log("input          : " + sql);

			var m = sql.match(/CREATE\s+TABLE\s+((\"([^\"]+)\")|([a-z][a-z0-9_]*))\s*\((.*)/im);			
			if(m) {
				var attributes = [];
				var constraints = [];
				var name = m[3] ? m[3] : m[4];
				var ps = { input: (m[5].match(/(.*)\)$[\s;]*/m))[1] };

				do {
					//console.log("before constrai: " + ps.input);

					if(parse_constraints(ps, constraints)) {
						//console.log("after constra A: " + ps.input);
					}
					else {
						//console.log("after constra B: " + ps.input);
						
						m = ps.input.match(/^\s*((\"[^\"]+\")|([a-z][a-z_0-9]*))\s+([a-z][a-z0-9_]*(\([^\)]+\))?)[\s,]+(.*)/i);
						if(m) {
							var aname = unquote(m[1]);
							var type = m[4];
							ps.input = m[6];
							
							var cs = [];
							parse_constraints(ps, cs);

							//console.log("after attribute: " + ps.input);

							if(m = ps.input.match(/^\s*,\s*(.*)/)) { ps.input = m[1]; }

							attributes.push(Attribute(aname,type,cs));
						}
						else {
							winston.error("Unknown attribute", { input: ps.input });
							break;
						}
					}
				}
				while(ps.input.length > 0);

				tables[name] = Table(name, attributes, constraints);
				//console.log("result         : " + tables[name].ddl_statement());
			}
		}

		callback(null,tables);
	});
}

var RootSchema = Object.create({
	"version" : 1,
	
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
	"toJSON" : function() { return { version: this.version, tables: this.tables }; },

	"exec_ddl" : function(db,createOptions,callback) {

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

		tables_from_db(db, function(error, present_tables) {
			if(error) { callback(error); return; }

            var steps = [];
            var pre_steps = [];
            var post_steps = [];
            var t;

            for(var i in present_tables) {
                var pt = present_tables[i];
				
                presentHash.update(pt.ddl_statement());

                t = create_tables[pt.name];
                if(t) {
                    var csql = t.ddl_statement();

                    if(csql === pt.ddl_statement()) {
                        delete create_tables[t.name]; }
                    else {
						// for now simply skip already existing table
						delete create_tables[t.name];
						
                        //var backup_name = t.name + "_" + (schema.version - 1);
                        //pre_steps.push("ALTER TABLE " + t.name + " RENAME TO " + backup_name);
						// TODO select all former attributes
                        //post_steps.push("INSERT INTO " + t.name + "(" + t.attribute_names().join(',') + ") SELECT " + t.attribute_names().join(',') + " FROM " + backup_name);
                        //post_steps.push("DROP TABLE " + backup_name);
                    }
                }
            }

		for(var j in create_tables) {
			t = create_tables[j];
			//winston.log("ddl 4: " + t.ddl_statement());			
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
					winston.error(sql + " : " + v.join(','));
					winston.error(error);
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
	"schemaHash" : { get : function() {
        var hash = crypto.createHash('sha1');
        for (var j in this.tables) {
			hash.update(this.tables[j].ddl_statement());
		}
        return hash.digest("hex"); },
	//"version" : { value : 1, writeable: true, enumerable: true, configurable: true },
	"tables" : { value : {}, writeable: true, enumerable: true, configurable: true }
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
		var schema = RootSchema.spawn({
			"basedir" : options });
		schema.load(callback);
		return schema;
    }
    else {
		var schema = RootSchema.spawn({ });
		
		schema.load_from_object(options);

		if(callback) { callback(undefined,schema); }

		return schema;
    }
};

exports.Schema              = Schema;
exports.Table               = Table;
exports.Attribute           = Attribute;
exports.Constraint          = Constraint;
