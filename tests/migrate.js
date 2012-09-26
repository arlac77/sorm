var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');


vows.describe('Schema From File').addBatch({
    'Schema Values': {
        topic: function() {
			var s = schema.Schema("tests/test2.schema");
			s.load(this.callback);
        },
        'schema name': function (error, schema) {
            assert.ifError(error);
            assert.equal(schema.name, "test1");
        },
        'schema version': function (error, schema) {
            assert.ifError(error);
            assert.equal(schema.version, 1);
        },
        'find table by name': function (error,schema) {
            assert.ifError(error);
			console.log('schema: ' + JSON.stringify(schema));
			
            assert.equal(schema.table("t1").name, "t1");
        },
        'schema table attributes are there': function (error, schema) {
            assert.ifError(error);
            var t1 = schema.table("t1");
            var a1 = t1.attribute("a1");
            assert.equal(a1.name, "a1");
            assert.equal(a1.type, "char(16)");
            assert.equal(a1.constraints[0].name, "primary key");
            assert.equal(a1.constraints[1].name, "not null");
        },
        'schema hash': function (error, schema) {
            assert.ifError(error);
            assert.equal(schema.schemaHash,"de6a2a2ac5d77cc905fefa140c9a5fb14d354f31");
        },
        'create database with schema' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test2.db"); schema.create(db,{},this.callback); },
            'create schema in database' : function(error,schema,db) {
                assert.ifError(error);
                assert.isObject(schema);
                assert.isObject(db);
            }
        }
    }
}).export(module);

/*
vows.describe('Migration').addBatch({
    'Schema Migration Add Table': {
        topic:  function() { return schema.Schema("tests/test3.schema");
        },
        'schema hash': function (topic) {
            assert.equal(topic.schemaHash,"767ea2680d940973a8408703a4a056f27708aab7");
        },
        'schema version': function (topic) {
            assert.equal (topic.version, 2);
        },
        'schema table attributes are there': function (topic) {
            assert.equal(topic.tables[0].name,"t1");
            assert.equal(topic.tables[1].name,"t2");
            assert.equal(topic.tables[0].pk().length,1);
            assert.equal(topic.tables[0].pk()[0].name,"a1");

            assert.equal(topic.tables[1].pk().length,2);
            assert.equal(topic.tables[1].pk()[0].name,"a1");
            assert.equal(topic.tables[1].pk()[1].name,"a2");
        },
        'create database with schema' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test2.db"); schema.create(db,{},this.callback); },
            'create schema in database' : function(error,schema,db) {
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
}).addBatch({
    'Schema Migration Alter Table': {
        topic:  function() { return schema.Schema("tests/test4.schema");
        },
        'schema hash': function (topic) {
            assert.equal(topic.schemaHash,"a966095f8456ee006bb5b2c8fd4c71676dcd57ef");
        },
        'schema version': function (topic) {
            assert.equal (topic.version, 3);
        },
        'schema table attributes are there': function (topic) {
            assert.equal(topic.tables[0].name,"t1");
            assert.equal(topic.tables[1].name,"t2");
            assert.equal(topic.tables[0].pk().length,1);
            assert.equal(topic.tables[0].pk()[0].name,"a1");
            assert.equal(topic.tables[0].pk()[0].type,"char(16)");

            assert.equal(topic.tables[1].pk().length,2);
            assert.equal(topic.tables[1].pk()[0].name,"a1");
            assert.equal(topic.tables[1].pk()[1].name,"a2");
            assert.equal(topic.table('t2').attribute('a2').type,"char(20)");
        },
        'create database with schema' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test2.db"); schema.create(db,{},this.callback); },
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
*/