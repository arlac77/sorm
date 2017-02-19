var vows = require('vows'),
    assert = require('assert'),
    sqlite3 = require('sqlite3'),
    schema  = require('../dist/schema');

vows.describe('Constraint').addBatch({
	'not null from JSON': {
        topic: schema.Constraint({name: "not null"}),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NOT NULL");
        },
        'name': function (topic) {
            assert.equal(topic.name, "NOT NULL");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"NOT NULL"}');
        }
	},
	'not null': {
        topic: schema.Constraint("not null"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NOT NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "NOT NULL");
        },
        'name': function (topic) {
            assert.equal(topic.name, "NOT NULL");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"NOT NULL"}');
        }
	},
	'null': {
        topic: schema.Constraint("null"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "NULL");
        },
        'name': function (topic) {
            assert.equal(topic.name, "NULL");
        }
	},
	'NULL': {
        topic: schema.Constraint("NULL"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "NULL");
        },
        'name': function (topic) {
            assert.equal(topic.name, "NULL");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"NULL"}');
        }
	},
	'primary key': {
        topic: schema.Constraint("primary key"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"PRIMARY KEY"}');
        }
	},
	'primary key with attributes': {
        topic: schema.Constraint("primary key(a1,a2)"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY(a1,a2)");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY(a1,a2)");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"PRIMARY KEY","attributes":["a1","a2"]}');
        }
	},
	'primary key with quoted attributes': {
        topic: schema.Constraint("primary key('a1','a2')"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY(a1,a2)");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY(a1,a2)");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"PRIMARY KEY","attributes":["a1","a2"]}');
        }
	},
	'primary key with attributes from JSON': {
        topic: schema.Constraint({ name: "primary key", attributes: ["a1","a2"]}),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY(a1,a2)");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY(a1,a2)");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"PRIMARY KEY","attributes":["a1","a2"]}');
        }
	},
	'primary key asc': {
        topic: schema.Constraint("primary key asc"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY ASC");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY ASC");
        },
        'name': function (topic) {
            assert.equal(topic.name, "PRIMARY KEY");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"PRIMARY KEY","options":"ASC"}');
        }
	},
	'primary key from JSON': {
        topic: schema.Constraint({name : "primary key", options : "asc" }),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "PRIMARY KEY ASC");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "PRIMARY KEY ASC");
        },
        'name': function (topic) {
            assert.equal(topic.name, "PRIMARY KEY");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"PRIMARY KEY","options":"ASC"}');
        }
	},
	'default from JSON': {
        topic: schema.Constraint({name : "default" }),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT NULL");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT NULL");
        },
        'name': function (topic) {
            assert.equal(topic.name, "DEFAULT");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"DEFAULT"}');
        }
	},

	'default 0 from JSON': {
        topic: schema.Constraint({name : "default", value : 0 }),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT 0");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT 0");
        },
        'name': function (topic) {
            assert.equal(topic.name, "DEFAULT");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"DEFAULT","value":0}');
        }
	},
	'default 0': {
        topic: schema.Constraint("default 0"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT 0");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT 0");
        },
        'name': function (topic) {
            assert.equal(topic.name, "DEFAULT");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"DEFAULT","value":0}');
        }
	},
	"default 'A'": {
        topic: schema.Constraint("default 'A'"),
        'ddl_statement': function (topic) {
            assert.equal(topic.ddl_statement(), "DEFAULT \"A\"");
        },
        'toString': function (topic) {
            assert.equal(topic.toString(), "DEFAULT \"A\"");
        },
        'name': function (topic) {
            assert.equal(topic.name, "DEFAULT");
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"DEFAULT","value":"A"}');
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
        },
        'JSON': function (topic) {
            assert.equal (JSON.stringify(topic), '{"name":"DEFAULT"}');
        }
	},
	"'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')" : {
        topic: schema.Constraint("CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')"),
        'ddl_statement': function (topic) {
            assert.equal( topic.ddl_statement(), "CONSTRAINT value_date_ibfk_1 FOREIGN KEY(type) REFERENCES value_type(id)");
        }
	},
	"with trailing space: 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')" : {
        topic: schema.Constraint("CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')  "),
        'ddl_statement': function (topic) {
            assert.equal( topic.ddl_statement(), "CONSTRAINT value_date_ibfk_1 FOREIGN KEY(type) REFERENCES value_type(id)");
        }
	},
	"FOREIGN KEY" : {
        topic: schema.Constraint("CONSTRAINT a FOREIGN KEY(type) REFERENCES value_type(id)"),
        'ddl_statement': function (topic) {
            assert.equal( topic.ddl_statement(), "CONSTRAINT a FOREIGN KEY(type) REFERENCES value_type(id)");
        },
        'foreign_table': function (topic) {
            assert.equal( topic.foreign_table, "value_type");
        },
        'attributes': function (topic) {
            assert.deepEqual( topic.attributes, ["type"]);
        },
        'foreign_attributes': function (topic) {
            assert.deepEqual( topic.foreign_attributes, ["id"]);
        }
	}
}).export(module);
