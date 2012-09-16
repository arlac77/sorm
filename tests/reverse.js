var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');


vows.describe('Schema From File').addBatch({
    'Schema Values': {
        topic:  function() { return db = new sqlite3.Database("tests/test2.db"); },
        'reverse from database' : {
            topic : function(db) { schema.tables_from_db(db,this.callback); },
            't1 detected' : function(error,tables) {
                assert.ifError(error);
				var t = tables[0];
				assert.equal(t.name,'t1');
				assert.equal(t.attributes[0].name,'a1');
				assert.equal(t.attributes[0].type,'char(16)');
            }
        }
    }
}).export(module);
