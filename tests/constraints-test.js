import test from 'ava';
import Attribute from '../src/attribute';
import Table from '../src/table';
import {
  Constraint,
  NullConstraint,
  NotNullConstraint,
  PrimaryKeyConstraint
} from '../src/constraint';

test('not null basics', t => {
  const topic = NotNullConstraint;

  t.is(topic.ddl, 'NOT NULL');
  t.is(topic.name, 'NOT NULL');
  t.is(JSON.stringify(topic), '{"name":"NOT NULL"}');
});

test('null basics', t => {
  const topic = NullConstraint;

  t.is(topic.ddl, 'NULL');
  t.is(topic.name, 'NULL');
  t.is(JSON.stringify(topic), '{"name":"NULL"}');
});

test('primary key', t => {
  const topic = new PrimaryKeyConstraint();

  t.is(topic.ddl, 'PRIMARY KEY');
  t.is(topic.name, 'PRIMARY KEY');
  t.is(JSON.stringify(topic), '{"name":"PRIMARY KEY"}');
});

test('primary key with attributes', t => {
  const topic = new PrimaryKeyConstraint(undefined, ['ASC']);

  t.is(topic.ddl, 'PRIMARY KEY ASC');
  t.deepEqual(topic.options, ['ASC']);
  t.is(topic.name, 'PRIMARY KEY');
  t.is(JSON.stringify(topic), '{"name":"PRIMARY KEY","options":["ASC"]}');
});

/*
vows.describe('Constraint').addBatch({
  'not null from JSON': {
    topic: Constraint({
      name: "not null"
    }),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "NOT NULL");
    },
    'name': function (topic) {
      assert.equal(topic.name, "NOT NULL");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"NOT NULL"}');
    }
  },
  'null': {
    topic: Constraint("null"),
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
  'primary key with attributes': {
    topic: Constraint("primary key(a1,a2)"),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "PRIMARY KEY(a1,a2)");
    },
    'toString': function (topic) {
      assert.equal(topic.toString(), "PRIMARY KEY(a1,a2)");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"PRIMARY KEY","attributes":["a1","a2"]}');
    }
  },
  'primary key with quoted attributes': {
    topic: Constraint("primary key('a1','a2')"),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "PRIMARY KEY(a1,a2)");
    },
    'toString': function (topic) {
      assert.equal(topic.toString(), "PRIMARY KEY(a1,a2)");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"PRIMARY KEY","attributes":["a1","a2"]}');
    }
  },
  'primary key with attributes from JSON': {
    topic: Constraint({
      name: "primary key",
      attributes: ["a1", "a2"]
    }),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "PRIMARY KEY(a1,a2)");
    },
    'toString': function (topic) {
      assert.equal(topic.toString(), "PRIMARY KEY(a1,a2)");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"PRIMARY KEY","attributes":["a1","a2"]}');
    }
  },
  'primary key asc': {
    topic: Constraint("primary key asc"),
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
      assert.equal(JSON.stringify(topic), '{"name":"PRIMARY KEY","options":"ASC"}');
    }
  },
  'primary key from JSON': {
    topic: Constraint({
      name: "primary key",
      options: "asc"
    }),
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
      assert.equal(JSON.stringify(topic), '{"name":"PRIMARY KEY","options":"ASC"}');
    }
  },
  'default from JSON': {
    topic: Constraint({
      name: "default"
    }),
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
      assert.equal(JSON.stringify(topic), '{"name":"DEFAULT"}');
    }
  },

  'default 0 from JSON': {
    topic: Constraint({
      name: "default",
      value: 0
    }),
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
      assert.equal(JSON.stringify(topic), '{"name":"DEFAULT","value":0}');
    }
  },
  'default 0': {
    topic: Constraint("default 0"),
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
      assert.equal(JSON.stringify(topic), '{"name":"DEFAULT","value":0}');
    }
  },
  "default 'A'": {
    topic: Constraint("default 'A'"),
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
      assert.equal(JSON.stringify(topic), '{"name":"DEFAULT","value":"A"}');
    }
  },
  "default \"A\"": {
    topic: Constraint("default \"A\""),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "DEFAULT \"A\"");
    }
  },
  "default null": {
    topic: Constraint("default null"),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "DEFAULT NULL");
    },
    'toString': function (topic) {
      assert.equal(topic.toString(), "DEFAULT NULL");
    },
    'JSON': function (topic) {
      assert.equal(JSON.stringify(topic), '{"name":"DEFAULT"}');
    }
  },
  "'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')": {
    topic: Constraint("CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')"),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(),
        "CONSTRAINT value_date_ibfk_1 FOREIGN KEY(type) REFERENCES value_type(id)");
    }
  },
  "with trailing space: 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')": {
    topic: Constraint("CONSTRAINT 'value_date_ibfk_1' FOREIGN KEY ('type') REFERENCES 'value_type' ('id')  "),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(),
        "CONSTRAINT value_date_ibfk_1 FOREIGN KEY(type) REFERENCES value_type(id)");
    }
  },
  "FOREIGN KEY": {
    topic: Constraint("CONSTRAINT a FOREIGN KEY(type) REFERENCES value_type(id)"),
    'ddl_statement': function (topic) {
      assert.equal(topic.ddl_statement(), "CONSTRAINT a FOREIGN KEY(type) REFERENCES value_type(id)");
    },
    'foreign_table': function (topic) {
      assert.equal(topic.foreign_table, "value_type");
    },
    'attributes': function (topic) {
      assert.deepEqual(topic.attributes, ["type"]);
    },
    'foreign_attributes': function (topic) {
      assert.deepEqual(topic.foreign_attributes, ["id"]);
    }
  }
*/
