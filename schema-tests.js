var assert = require('assert')
   ,sqlite = require('sqlite')
   ,schema = require('./lib/schema');

var a1 = new schema.attribute("a1","int");
var a2 = new schema.attribute("a2","char(10)");
var t1 = new schema.table("t1",[a1,a2]);
var s1 = new schema.schema([t1]);

assert.ok(t1, "table must exist");
assert.equal(t1.name, "t1", "table name must be t1");
assert.equal(t1.create(), "CREATE TABLE t1(a1 int,a2 char(10))");


var db = new sqlite.Database();

db.open("test.db", function (error) {
  if (error) { throw error; }

  s1.create(db);

  }
);

