#!/usr/bin/env node

var assert = require('assert')
   ,sqlite = require('sqlite')
   ,schema = require('../lib/schema');

var a1 = new schema.attribute("a1","int", [new schema.constraint("not null")]);
assert.equal(a1.name, "a1", "attribute name must be a1");
assert.equal(a1.create(), "a1 int not null");

var a1 = new schema.attribute("a1","int", "not null");
assert.equal(a1.create(), "a1 int not null");

var a1 = new schema.attribute("a1","int", ["not null", "primary key"]);
assert.equal(a1.create(), "a1 int not null primary key");

var a2 = new schema.attribute("a2","char(10)");
var t1 = new schema.table("t1",[a1,a2]);
var s1 = new schema.schema([t1]);


assert.ok(t1, "table must exist");
assert.equal(t1.name, "t1", "table name must be t1");
assert.equal(t1.create(), "CREATE TABLE t1(a1 int not null primary key,a2 char(10))");


var db = new sqlite.Database();

db.open("test.db", function (error) {
  if (error) { throw error; }

  s1.create(db);

  //db.close(function(error) { console.log("close:" + error);});
  }
);


var s1a = new schema.schema({
    "name" : "s1",
    "tables" : [
        {
            "name"       : "t1",
            "attributes" : [
                { "name" : "a1", "type" : "int", "constraints" : [ "not null" ] },
                { "name" : "a2", "type" : "char(10)" }]
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

/*
db.open("test2.db", function (error) {
  if (error) { throw error; }

  s1a.create(db);
  }
);
*/

