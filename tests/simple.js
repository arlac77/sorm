var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');

vows.describe('Attribute').addBatch({
    'Attribute Values': {
        topic: schema.Attribute("a1","int"),

        'name is present': function (topic) {
            assert.equal (topic.name, "a1");
        },
        'type is present': function (topic) {
            assert.equal (topic.type, "int");
        },
        'no constraint': function (topic) {
            assert.equal (topic.constraints.length, 0);
        },
        'sql statement': function (topic) {
            assert.equal (topic.create(), "a1 int");
        }
    },
    'Attribute Values With Constraint': {
        topic: schema.Attribute("a1","int", [schema.Constraint("not null")]),

        'name is present': function (topic) {
            assert.equal (topic.name, "a1");
        },
        'type is present': function (topic) {
            assert.equal (topic.type, "int");
        },
        'constraint is present': function (topic) {
            assert.equal (topic.constraints[0].name, "not null");
        },
        'sql statement': function (topic) {
            assert.equal (topic.create(), "a1 int not null");
        }
    },
    'Attribute Values Multiple Constraints': {
        topic: schema.Attribute("a1","int", ["not null", "primary key"]),

        'name is present': function (topic) {
            assert.equal (topic.name, "a1");
        },
        'type is present': function (topic) {
            assert.equal (topic.type, "int");
        },
        '1. constraint is present': function (topic) {
            assert.equal (topic.constraints[0].name, "not null");
        },
        '2. constraint is present': function (topic) {
            assert.equal (topic.constraints[1].name, "primary key");
        },
        'sql statement': function (topic) {
            assert.equal (topic.create(), "a1 int not null primary key");
        }
    }
}).export(module);


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
            assert.equal (topic.create(), "CREATE TABLE t1(a1 int not null primary key,a2 char(10))");
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
            assert.equal (topic.create(), "CREATE TABLE t1(a1 int not null primary key asc,a2 char(10))");
        }
    }
}).export(module);

vows.describe('Schema').addBatch({
    'Schema Values': {
        topic:  function() { return schema.Schema({ tables : [
            schema.Table("t1",[
                schema.Attribute("a1","int",["not null", "primary key"]),
                schema.Attribute("a2","char(10)")])]});
        },
        'find table by name': function (schema) {
            assert.equal (schema.table("t1").name, "t1");
        },
        'schema hash': function (schema) {
            assert.equal(schema.schemaHash(),"37130897e3628af46c4bd6df9850ef8a8277bf34");
        },
        'create database with schema' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test1.db"); schema.create(db,{},this.callback); },
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


