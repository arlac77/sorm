import test from 'ava';
import Schema from '../src/schema';

const path = require('path');
const sqlite3 = require('sqlite3');

function makeSchema() {
  return new Schema({
    tables: {
      t1: {
        attributes: [
          {
            name: 'a1',
            type: 'int',
            constraints: ['not null', 'primary key']
          },
          {
            name: 'a2',
            type: 'char(10)'
          }
        ]
      }
    }
  });
}

test('schema basics', t => {
  const topic = makeSchema();

  t.is(topic.tables.get('t1').name, 't1');
  t.is(topic.tables.get('t1').attributes.length, 2);
});

/*
  .addBatch({
    'Schema Values': {
      topic() {
        return Schema({
          tables: {
            t1: {
              attributes: [
                {
                  name: 'a1',
                  type: 'int',
                  constraints: ['not null', 'primary key']
                },
                {
                  name: 'a2',
                  type: 'char(10)'
                }
              ]
            }
          }
        });
      },
      'default version': function(schema) {
        assert.equal(
          schema.versions['35f7925e0ff70acf332a4f0d35687f3d0d17e584'].tag,
          '1'
        );
      },
      'schema hash': function(schema) {
        assert.equal(
          schema.schemaHash,
          '35f7925e0ff70acf332a4f0d35687f3d0d17e584'
        );
      },
      'create database with schema': {
        topic: function(schema) {
          var db = new sqlite3.Database(path.join(testdir, 'test1.db'));
          schema.exec_ddl(db, {}, this.callback);
        },
        'create schema in database': function(error, schema, db) {
          assert.ifError(error);
          assert.isObject(schema);
          assert.isObject(db);
          //assert.equal(schema.presentSchemaVersion,'37130897e3628af46c4bd6df9850ef8a8277bf34');
        },
        't1 present': {
          topic: function(schema) {
            var db = new sqlite3.Database('tests/test2.db');
            db.all(
              "SELECT name,sql FROM sqlite_master WHERE type='table' AND name=?",
              't1',
              this.callback
            );
          },
          't1 present': function(error, rows) {
            assert.ifError(error);
            assert.equal(rows[0].name, 't1');
          }
        }
      }
    }
*/
