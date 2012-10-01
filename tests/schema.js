var vows    = require('vows'),
    assert  = require('assert'),
	mkdirp  = require('mkdirp'),
	path    = require('path'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');

var testdir = path.join("/tmp","vows" + process.pid);
mkdirp.sync(testdir,'0755');

vows.describe('Schema').addBatch({
    'Schema Values': {
        topic:  function() { return schema.Schema({ tables : {
				"t1" : {
					attributes: [
                		{ name: "a1", type: "int", constraints: ["not null", "primary key"] },
                		{ name: "a2", type: "char(10)" }
					]/*,
		            "constraints": [ { "name" : "primary key", "attributes": [ "a1", "a2"] } ]*/
				}
			}});
        },
        'default version': function (schema) {
            assert.equal (schema.version, 1);
        },
        'default name': function (schema) {
            assert.equal (schema.name, 'unknown');
        },
        'find table by name': function (schema) {
            assert.equal (schema.tables["t1"].name, "t1");
            assert.equal (schema.tables["t1"].attributes.length, 2);
        },
        'schema hash': function (schema) {
            assert.equal(schema.schemaHash,"35f7925e0ff70acf332a4f0d35687f3d0d17e584");
        },
        'create database with schema' : {
            topic : function(schema) { var db = new sqlite3.Database(path.join(testdir,"test1.db")); schema.exec_ddl(db,{},this.callback); },
            'create schema in database' : function(error,schema,db) {
                assert.ifError(error);
                assert.isObject(schema);
                assert.isObject(db);
                //assert.equal(schema.presentSchemaVersion,"37130897e3628af46c4bd6df9850ef8a8277bf34");
            },
            't1 present' : {
                topic: function(schema) { var db = new sqlite3.Database("tests/test2.db");
                                          db.all("SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",'t1',this.callback); },
                't1 present': function (error,rows) {
                    assert.ifError(error);
                    assert.equal(rows[0].name,'t1');
                }
            }
        }
    }
}).export(module);
