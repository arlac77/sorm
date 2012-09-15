var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');


vows.describe('Schema From File').addBatch({
    'Schema Values': {
        topic:  function() { return new schema.Schema("tests/test2re.schema");
        },
        'reverse from database' : {
            topic : function(schema) { var db = new sqlite3.Database("tests/test2.db"); schema.reverse(db,this.callback); },
            'create schema in database' : function(error,schema,db) {
                assert.ifError(error);
            }
        }
    }
}).export(module);
