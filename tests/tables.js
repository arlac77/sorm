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
