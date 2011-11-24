var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');

vows.describe('Attribute').addBatch({
    'Attribute Values': {
        topic:  new schema.attribute("a1","int"),

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
        topic:  new schema.attribute("a1","int", [new schema.constraint("not null")]),

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
        topic:  new schema.attribute("a1","int", ["not null", "primary key"]),

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
        topic:  new schema.table("t1",[new schema.attribute("a1","int",["not null", "primary key"]),new schema.attribute("a2","char(10)")]),

        'name is present': function (topic) {
            assert.equal (topic.name, "t1");
        },
        'find attribute by name': function (topic) {
            assert.equal (topic.attribute("a2").name, "a2");
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
    }
}).export(module);

vows.describe('Schema').addBatch({
    'Schema Values': {
        topic:  new schema.schema([new schema.table("t1",[new schema.attribute("a1","int",["not null", "primary key"]),new schema.attribute("a2","char(10)")])]),

        'find table by name': function (topic) {
            assert.equal (topic.table("t1").name, "t1");
        },

        'create database' : {
            topic : function() { return new sqlite3.Database("test.db", this.callback); },
            'create schema in database' : function(error,db) {
               // console.log("topic: " + topic);
                assert.isNull(error);
            }
        }
        /*,
        'create database x' : function(topic) {
            var db     = new sqlite3.Database("test.db", function(error) {
                assert.isNull(error);

                { topic.create(db, function(error) {
                    if(error) { console.log(error); }
                }); } });
        }*/
    }
}).export(module);
