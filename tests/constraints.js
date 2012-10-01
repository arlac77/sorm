var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../lib/schema');

vows.describe('Constraint').addBatch({
	'not null': {
        topic: schema.Constraint("not null"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NOT NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "NOT NULL");
        }
	},
	'null': {
        topic: schema.Constraint("null"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "NULL");
        }
	},
	'NULL': {
        topic: schema.Constraint("NULL"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "NULL");
        }
	},
	'primary key': {
        topic: schema.Constraint("primary key"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY");
        }
	},
	'primary key asc': {
        topic: schema.Constraint("primary key asc"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY ASC");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY ASC");
        }
	},
	'default 0': {
        topic: schema.Constraint("default 0"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT 0");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT 0");
        }
	},
	"default 'A'": {
        topic: schema.Constraint("default 'A'"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT 'A'");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT 'A'");
        }
	},
	"default \"A\"": {
        topic: schema.Constraint("default \"A\""),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT \"A\"");
        }
	},
	"default null": {
        topic: schema.Constraint("default null"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT NULL");
        }
	},
	"'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')" : {
        topic: schema.Constraint("CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')"),
        'ddl_statement': function (topic) {
            assert.equal( topic.ddl_statement(), "CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')");
        }
	},
	"with trailing space: 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')" : {
        topic: schema.Constraint("CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')  "),
        'ddl_statement': function (topic) {
            assert.equal( topic.ddl_statement(), "CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')");
        }
	}
}).export(module);
