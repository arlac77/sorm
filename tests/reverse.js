var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');


vows.describe('Schema From File').addBatch({
    'Simple db': {
        topic:  function() { return db = new sqlite3.Database("tests/test2.db"); },
        'reverse from database' : {
            topic : function(db) { schema.tables_from_db(db,this.callback); },
            't1 detected' : function(error,tables) {
                assert.ifError(error);
				var t = tables[0];
				assert.equal(t.name,'t1');
				assert.equal(t.attributes[0].name,'a1');
				assert.equal(t.attributes[0].type,'char(16)');
				assert.equal(t.attributes[0].constraints[0].name,'PRIMARY KEY');
				assert.equal(t.attributes[0].constraints[1].name,'NOT NULL');
            }
        }
    },
    'consumption db': {
        topic:  function() { return db = new sqlite3.Database("tests/reverse.db"); },
        'reverse from database' : {
            topic : function(db) { schema.tables_from_db(db,this.callback); },
            'comment_date' : function(error,tables) {
                assert.ifError(error);
				var t = tables[0];
				assert.equal(t.name,'comment_date');

				assert.equal(t.attributes[0].name,'date');
				assert.equal(t.attributes[0].type,'datetime');
				assert.equal(t.attributes[0].constraints[0].name,'NOT NULL');

				assert.equal(t.attributes[1].name,'comment');
				assert.equal(t.attributes[1].type,'varchar(255)');
				assert.equal(t.attributes[1].constraints[0].name,'NOT NULL');
            },
            'value_date' : function(error,tables) {
                assert.ifError(error);
				var t = tables[1];
				assert.equal(t.name,'value_date');

				assert.equal(t.attributes[0].name,'date');
				assert.equal(t.attributes[0].type,'datetime');
				assert.equal(t.attributes[0].constraints[0].name,'NOT NULL');
			
				assert.equal(t.attributes[1].name,'type');
				assert.equal(t.attributes[1].type,'char(2)');
				assert.equal(t.attributes[1].constraints[0].name,'NOT NULL');

				assert.equal(t.attributes[2].name,'value');
				assert.equal(t.attributes[2].type,'float');
				assert.equal(t.attributes[2].constraints[0].name,'NOT NULL');
            },
            'value_type' : function(error,tables) {
                assert.ifError(error);
				var t = tables[2];
				assert.equal(t.name,'value_type');

				assert.equal(t.attributes[0].name,'id');
				assert.equal(t.attributes[0].type,'char(2)');
				assert.equal(t.attributes[0].constraints[0].name,'NOT NULL');
			
				assert.equal(t.attributes[1].name,'name');
				assert.equal(t.attributes[1].type,'varchar(65)');
				assert.equal(t.attributes[1].constraints[0].name,'NOT NULL');

				assert.equal(t.attributes[2].name,'unit');
				assert.equal(t.attributes[2].type,'varchar(65)');
				assert.equal(t.attributes[2].constraints[0].name,'NOT NULL');
				
				assert.equal(t.attributes[3].name,'ord');
				assert.equal(t.attributes[3].type,'int(11)');
				assert.equal(t.attributes[3].constraints[0].name,'NOT NULL');
				
				assert.equal(t.attributes[4].name,'color');
				assert.equal(t.attributes[4].type,'varchar(20)');
				assert.equal(t.attributes[4].constraints[0].name,'DEFAULT NULL');
            }
        }
     }
}).export(module);
