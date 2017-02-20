/* jslint node: true, esnext: true */

const vows = require('vows'),
  assert = require('assert'),
  sqlite3 = require('sqlite3'),
  schema = require('../dist/schema');


vows.describe('Schema From File').addBatch({
  'Simple db': {
    topic() {
        return new sqlite3.Database("tests/test2.db");
      },
      'reverse from database': {
        topic(db) {
            const s = schema.Schema('/tmp/test.schema');
            s.load_ddl_from_db(db, this.callback);
          },
          't1 detected': function (error, schema) {
            assert.ifError(error);
            const t = schema.tables['t1'];
            assert.equal(t.name, 't1');
            assert.equal(t.attributes[0].name, 'a1');
            assert.equal(t.attributes[0].type, 'char(16)');
            assert.equal(t.attributes[0].constraints[0].name, 'PRIMARY KEY');
            assert.equal(t.attributes[0].constraints[1].name, 'NOT NULL');
          }
      }
  },
  'consumption db': {
    topic() {
        return new sqlite3.Database("tests/reverse.db");
      },
      'reverse from database': {
        topic(db) {
            const s = schema.Schema('/tmp/test.schema');
            s.load_ddl_from_db(db, this.callback);
          },
          version(error, schema) {
            assert.ifError(error);
            assert.equal(schema.versions['e7f242ce7895bc16c3b3c01e47318064921d3920'].tag, 1);
          },
          'comment_date': function (error, schema) {
            assert.ifError(error);
            const t = schema.tables['comment_date'];
            assert.equal(t.name, 'comment_date');
            assert.equal(t.attributes.length, 2);

            assert.equal(t.attributes[0].name, 'date');
            assert.equal(t.attributes[0].type, 'datetime');
            assert.equal(t.attributes[0].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[1].name, 'comment');
            assert.equal(t.attributes[1].type, 'varchar(255)');
            assert.equal(t.attributes[1].constraints[0].ddl_statement(), 'NOT NULL');
          },
          'value_date': function (error, schema) {
            assert.ifError(error);
            const t = schema.tables['value_date'];
            assert.equal(t.name, 'value_date');
            assert.equal(t.attributes.length, 3);

            assert.equal(t.attributes[0].name, 'date');
            assert.equal(t.attributes[0].type, 'datetime');
            assert.equal(t.attributes[0].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[1].name, 'type');
            assert.equal(t.attributes[1].type, 'char(2)');
            assert.equal(t.attributes[1].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[2].name, 'value');
            assert.equal(t.attributes[2].type, 'float');
            assert.equal(t.attributes[2].constraints[0].ddl_statement(), 'NOT NULL');
          },
          'value_date constraints': function (error, schema) {
            assert.ifError(error);
            const t = schema.tables['value_date'];
            assert.equal(t.constraints.length, 1);
            assert.equal(t.constraints[0].ddl_statement(),
              "CONSTRAINT value_date_ibfk_1 FOREIGN KEY(type) REFERENCES value_type(id)");
          },
          'value_type': function (error, schema) {
            assert.ifError(error);
            const t = schema.tables['value_type'];
            assert.equal(t.name, 'value_type');
            assert.equal(t.attributes.length, 6);
            assert.equal(t.attributes[0].name, 'id');
            assert.equal(t.attributes[0].type, 'char(2)');
            assert.equal(t.attributes[0].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[1].name, 'name');
            assert.equal(t.attributes[1].type, 'varchar(65)');
            assert.equal(t.attributes[1].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[2].name, 'unit');
            assert.equal(t.attributes[2].type, 'varchar(65)');
            assert.equal(t.attributes[2].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[3].name, 'ord');
            assert.equal(t.attributes[3].type, 'int(11)');
            assert.equal(t.attributes[3].constraints[0].ddl_statement(), 'NOT NULL');

            assert.equal(t.attributes[4].name, 'color');
            assert.equal(t.attributes[4].type, 'varchar(20)');
            assert.equal(t.attributes[4].constraints[0].ddl_statement(), 'DEFAULT NULL');
          }
      }
  }
}).export(module);
