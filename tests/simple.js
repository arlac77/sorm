var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');

vows.describe('Tables').addBatch({
    'Table Values': {
        topic: schema.Table("t1",[schema.Attribute("a1","int",["not null", "primary key"]), schema.Attribute("a2","char(10)")]),

        'name is present': function (topic) {
            assert.equal (topic.name, "t1");
        },
        'find attribute by name': function (topic) {
            assert.equal (topic.attribute("a2").name, "a2");
        },
        'attribute names array': function (topic) {
            assert.equal (topic.attribute_names()[0], "a1");
            assert.equal (topic.attribute_names()[1], "a2");
        },
        'primary key': function (topic) {
            assert.equal (topic.pk()[0].name, "a1");
        },
        'sql create statement': function (topic) {
            assert.equal (topic.ddl_statement(), "CREATE TABLE t1(a1 int NOT NULL PRIMARY KEY,a2 char(10))");
        },
        'sql insert statement': function (topic) {
            assert.equal (topic.insert_sql(['a1','a2']), "INSERT INTO t1(a1,a2) VALUES(?,?)");
        },
        'sql update statement': function (topic) {
            assert.equal (topic.update_sql(['a1','a2']), "UPDATE t1 SET a2=? WHERE a1=?");
        }
    },
    'Table Values Advanced Primary Key': {
        topic: schema.Table("t1",[schema.Attribute("a1","int",["not null", "primary key asc"]), schema.Attribute("a2","char(10)")]),

        'primary key': function (topic) {
            assert.equal (topic.pk()[0].name, "a1");
        },
        'sql create statement': function (topic) {
            assert.equal (topic.ddl_statement(), "CREATE TABLE t1(a1 int NOT NULL PRIMARY KEY ASC,a2 char(10))");
        }
    }
}).export(module);

vows.describe('Schema').addBatch({
    'Schema Values': {
        topic:  function() { return schema.Schema({ tables : {
				"t1" : {
				attributes: [
                	{ name: "a1", type: "int", constraints: ["not null", "primary key"] },
                	{ name: "a2", type: "char(10)" }
					]
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
            topic : function(schema) { var db = new sqlite3.Database("tests/test1.db"); schema.exec_ddl(db,{},this.callback); },
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
