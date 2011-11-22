var vows = require('vows'),
    assert = require('assert'),
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
    'Attribute Values With Contraint': {
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
        'sql statement': function (topic) {
            assert.equal (topic.create(), "CREATE TABLE t1(a1 int not null primary key,a2 char(10))");
        }
    }
}).export(module);
