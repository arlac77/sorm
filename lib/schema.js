var crypto   = require('crypto')
   ,fs       = require('fs')
   ,path     = require("path")
   ,asyncMap = require("slide").asyncMap;

var Constraint = function(options) {

    if(typeof options === 'string') {
        this.name = options;
    }
    else {
        this.name       = options.name;
        this.attributes = options.attributes;
    }

    this.create = function() {
        if(this.attributes) {
            return this.name + "(" + this.attributes.join(',') + ")";
        }

        return this.name;
    };
};

var Attribute = function(name,type,constraints) {
    this.name = name;
    this.type = type;

    if(constraints instanceof Array) {
        for (var i in constraints) {
            if(!(constraints[i] instanceof Constraint))
                constraints[i] = new Constraint(constraints[i]);
        }

        this.constraints = constraints;
    }
    else if(constraints == undefined) {
        this.constraints = [];
    }
    else {
        this.constraints = [new Constraint(constraints)];
    }

    this.create = function() {
        var c = "";
        for (var i in this.constraints) {
            c += " " + this.constraints[i].create();
        }

        return this.name + " " + this.type + c;
    };
};


var Table = function(name,attributes,constraints) {
    this.name       = name;
    this.attributes = attributes;
    this.constraints= constraints;

    for (var i in attributes) {
        var a = attributes[i];
        if(!(a instanceof Attribute))
            this.attributes[i] = new Attribute(a.name,a.type,a.constraints); }

    for (var i in constraints) {
        var c = constraints[i];
        if(!(c instanceof Constraint))
            this.constraints[i] = new Constraint(c); }

    this.create = function() {
        var atts = [];

        for (var i in this.attributes) {
            atts.push(this.attributes[i].create());
        }

        for (var i in this.constraints) {
            atts.push(this.constraints[i].create());
        }

        return "CREATE TABLE " + quote(this.name) + "(" + atts.join(',') + ")";
    };
};

var Schema = function(options) {

    this.tables = [];

    if(typeof options === 'string') {
        this.basedir = options;
        options    = JSON.parse(fs.readFileSync(path.join(this.basedir,'schema.json')));
        this.name  = options.name;
    }

    if(options instanceof Array) {
        this.tables = options;
    }
    else {
        for (var i in options.tables) {
            var t = options.tables[i];
            this.tables[i] = new Table(t.name,t.attributes,t.constraints); }
    }

    this.create = function(db) {

        var create_tables = {};
        var alter_tables  = [];

        for (var j in this.tables) {
            var t = this.tables[j];
            create_tables[t.name] = t; }

        var presentHash = crypto.createHash('sha1');
        var desiredHash = crypto.createHash('sha1');

        var basedir = this.basedir;

        db.all("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
            if (error) { throw error; }

            var steps = [];

            for (var i in rows) {
                var row = rows[i];

                presentHash.update(row.sql);

                var t = create_tables[row.name];
                if(t) {
                    var csql = t.create();
                    desiredHash.update(csql);

                    if(csql === row.sql) {
                        create_tables[t.name] = undefined; }
                    else {
                        steps.push("ALTER TABLE " + t.name + " RENAME TO " + t.name + "-old");
                    }
                }
            }

            for (var j in create_tables) {
              var t = create_tables[j];
              if(t) { steps.push(t.create()); }
        }

        this.presentSchemaVersion = presentHash.digest("hex");
        this.desiredSchemaVersion = desiredHash.digest("hex");

        console.log("currentSchemaVersion: " + this.presentSchemaVersion);
        console.log("desiredSchemaVersion: " + this.desiredSchemaVersion);

        asyncMap(steps, function(sql,cb) { db.run(sql,cb); }, function(error) {
            if(error) { console.log(error); }
            var djs = path.join(basedir,'data.json');
            migrate_data(db,JSON.parse(fs.readFileSync(djs)));
            });
        });
    };
};

function migrate_data(db,data_sets) {
    for (var i in data_sets) {
        var data = data_sets[i];

        var qm = [];
        for(var k in data.attributes) { qm.push('?'); }

        var sql = "INSERT INTO " + data.table + "(" + data.attributes.join(',') + ") VALUES(" + qm.join(',') + ")";

        for (var j in data.values) {
            db.get(sql,data.values[j], function(error) { if(error) { console.log(error); } });
        }
    }
}

function quote(name) { return name; }

exports.schema              = Schema;
exports.table               = Table;
exports.attribute           = Attribute;
exports.constraint          = Constraint;
