var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');

vows.describe('Schema From File').addBatch({
    'Schema Values': {
        topic: function() {
			schema.Schema("tests/test2.schema",this.callback);
        },
        'version': function (error, schema) {
            assert.ifError(error);
            assert.equal(schema.version, 1);
        },
        'find table by name': function (error,schema) {
            assert.ifError(error);			
            assert.equal(schema.tables["t1"].name, "t1");
        },
        'table attributes are there': function (error, schema) {
            assert.ifError(error);
            var t1 = schema.tables["t1"];
            var a1 = t1.attribute("a1");
            assert.equal(a1.name, "a1");
            assert.equal(a1.type, "char(16)");
            assert.equal(a1.constraints[0].name, "PRIMARY KEY");
            assert.equal(a1.constraints[1].name, "NOT NULL");
        },
        'hash': function (error, schema) {
            assert.ifError(error);
            assert.equal(schema.schemaHash,"58cdd2d9a51f98a088c64eed8aea07df0f39d9d7");
        },
        'create database' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test2.db"); schema.exec_ddl(db,{},this.callback); },
            'create schema in database' : function(error,schema,db) {
                assert.ifError(error);
                assert.isObject(schema);
                assert.isObject(db);
            }
        }
    }
}).export(module);


vows.describe('Migration').addBatch({
    'Add Table': {
        topic: function() {
			schema.Schema("tests/test3.schema",this.callback);
        },
        'hash': function(error,schema) {
			assert.ifError(error);
            assert.equal(schema.schemaHash,"d77ae3c5aaec8a94833e7322de5e3efd151b9fa6");
        },
        'version': function(error,schema) {
			assert.ifError(error);
            assert.equal(schema.version, 2);
        },
        'table attributes t1': function(error,schema) {
			assert.ifError(error);

            assert.equal(schema.tables['t1'].name,"t1");
            assert.equal(schema.tables['t2'].name,"t2");
			
            assert.equal(schema.tables['t1'].pk().length,1);
            assert.equal(schema.tables['t1'].pk()[0].name,"a1");
        },
        'table attributes t2': function(error,schema) {
			assert.ifError(error);
			//console.log(schema.tables['t2']);
            assert.equal(schema.tables['t2'].pk().length,2);
            assert.equal(schema.tables['t2'].pk()[0].name,"a1");
            assert.equal(schema.tables['t2'].pk()[1].name,"a2");
        },

        'create database with schema' : {
            topic : function(schema) {
				//console.log("schema: " + JSON.stringify(error,undefined,'\t'));
				var db = new sqlite3.Database("tests/test2.db");
				schema.exec_ddl(db,{},this.callback); },
            'create schema in database' : function(error,schema,db) {
                assert.ifError(error);
                assert.isObject(schema);
                assert.isObject(db);
            },
            't1 present' : {
                topic: function(error,schema) { var db = new sqlite3.Database("tests/test2.db");
                                          db.all("SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",'t1',this.callback); },
                't1 present': function (error,rows) {
                    assert.ifError(error);
                    assert.equal(rows[0].name,'t1');
                }
            },
            't2 present' : {
                topic: function(schema) { var db = new sqlite3.Database("tests/test2.db");
                                          db.all("SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",'t2',this.callback); },
                't2 present': function (error,rows) {
                    assert.ifError(error);
                    assert.equal(rows[0].name,'t2');
                }
            }
        }
    }
})
.addBatch({
    'Schema Migration Alter Table': {
        topic: function() {
			schema.Schema("tests/test4.schema",this.callback);
        },
        'schema hash': function(error,schema) {
            assert.equal(schema.schemaHash,"98a639d364578be35ef3435d81e6d0702760f73f");
        },
        'schema version': function(error,schema) {
            assert.equal(schema.version, 3);
        },
        'schema table attributes are there': function (error,schema) {
            assert.equal(schema.tables['t1'].name,"t1");
            assert.equal(schema.tables['t1'].pk().length,1);
            assert.equal(schema.tables['t1'].pk()[0].name,"a1");
            assert.equal(schema.tables['t1'].pk()[0].type,"char(16)");

            assert.equal(schema.tables['t2'].name,"t2");
            assert.equal(schema.tables['t2'].pk().length,2);
            assert.equal(schema.tables['t2'].pk()[0].name,"a1");
            assert.equal(schema.tables['t2'].pk()[1].name,"a2");
            assert.equal(schema.tables['t2'].attribute('a2').type,"char(20)");
        }
		,
        'create database with schema' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test2.db"); schema.exec_ddl(db,{},this.callback); },
            'create schema in database' : function(error,schema,db) {
                if(error) { console.log(error); }
                assert.ifError(error);
                assert.isObject(schema);
                assert.isObject(db);
            },
            't1 present' : {
                topic: function(schema) { var db = new sqlite3.Database("tests/test2.db");
                                          db.all("SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",'t1',this.callback); },
                't1 present': function (error,rows) {
                    assert.ifError(error);
                    assert.equal(rows[0].name,'t1');
                }
            },
            't2 present' : {
                topic: function(schema) { var db = new sqlite3.Database("tests/test2.db");
                                          db.all("SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",'t2',this.callback); },
                't2 present': function (error,rows) {
                    assert.ifError(error);
                    assert.equal(rows[0].name,'t2');
                }
            }
        }
    }
	}).export(module);
