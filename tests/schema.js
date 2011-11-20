#!/usr/bin/env node

var assert  = require('assert')
   ,sqlite3 = require('sqlite3')
   ,schema  = require('../lib/schema');

var a1 = new schema.attribute("a1","int", ["not null", "primary key"]);
var a2 = new schema.attribute("a2","char(10)");
var t1 = new schema.table("t1",[a1,a2]);
var s1 = new schema.schema([t1]);


assert.ok(t1, "table must exist");
assert.equal(t1.name, "t1", "table name must be t1");
assert.equal(t1.attribute("a1").name, "a1", "find attribute a1");

assert.equal(t1.create(), "CREATE TABLE t1(a1 int not null primary key,a2 char(10))");


var db     = new sqlite3.Database("test.db", function(error) {
    if(error) { console.log(error); } else
    { s1.create(db, function(error) {
        if(error) { console.log(error); }
        }); } });

var s1a = new schema.schema({
    "name" : "s1",
    "tables" : [
        {
            "name"       : "t1",
            "attributes" : [
                { "name" : "a1", "type" : "int", "constraints" : [ "primary key" ] },
                { "name" : "a2", "type" : "char(10)" }],
        },
        {
            "name"       : "t2",
            "attributes" : [
                { "name" : "a1", "type" : "int", "constraints" : [ "not null" ] },
                { "name" : "a2", "type" : "char(10)" }],
            "constraints": [ { "name" : "primary key", "attributes": [ "a1", "a2"] } ]
        }
    ],
    "migrations" : {
        "37130897e3628af46c4bd6df9850ef8a8277bf34" : {
            "statements" : [
            ]
        }
    },
});

assert.equal(s1a.tables[0].name,"t1");
assert.equal(s1a.tables[1].name,"t2");
assert.equal(s1a.tables[0].pk().length,1);
assert.equal(s1a.tables[0].pk()[0].name,"a1");

assert.equal(s1a.tables[1].pk().length,2);
assert.equal(s1a.tables[1].pk()[0].name,"a1");
assert.equal(s1a.tables[1].pk()[1].name,"a2");

assert.equal(s1a.table("t1").name,"t1", "find table by name");
