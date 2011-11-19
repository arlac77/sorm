var vows = require('vows'),
    assert = require('assert'),
    schema  = require('../lib/schema');

vows.describe('Attribute').addBatch({
    'Attribute Values': {
        topic:  new schema.attribute("a1","int", [new schema.constraint("not null")]),

        'name is present': function (topic) {
            assert.equal (topic.name, "a1");
        },
        'type is present': function (topic) {
            assert.equal (topic.type, "int");
        },
        'constraint is present': function (topic) {
            assert.equal (topic.constraints[0].name, "not null");
        }
    }
}).export(module);
