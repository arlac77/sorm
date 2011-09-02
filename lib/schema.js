
var Constraint = function(name) {
    this.name = name;

    this.create = function() {
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
    
    this.create = function() {
        var atts = "";
        for (var i in this.attributes) {
            var a = this.attributes[i];
            if(atts.length > 0) atts += ",";
            atts += a.create();
        }
        for (var i in this.constraints) {
            atts += "," + this.constraints[i].create();
        }

        return "CREATE TABLE " + quote(this.name) + "(" + atts + ")";
    };
};

var Schema = function(tables) {
    this.tables = tables;

    this.create = function(db) {

        var tables = {};

        for (var j in this.tables) {
            var t = this.tables[j];
            tables[t.name] = t; }

        db.execute("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
            if (error) { throw error; }

            for (var i in rows) {
                var row = rows[i];

                var t = tables[row.name];
                if(t) {
                    if(t.create() === row.sql) {
                        console.log('skip:' + row.name + " " + row.sql + " : " + t.create());
                        tables[t.name] = undefined; }
                    else {
                        console.log('alter:' + row.name + " " + row.sql + " : " + t.create());
                    }
                }
            }

            for (var j in tables) {
                var t = tables[j];
                if(t)
                    db.execute(t.create(), function (error) { if (error) { throw error; } });
            }
        });
    };
};

function quote(name) { return name; }

exports.schema              = Schema;
exports.table               = Table;
exports.attribute           = Attribute;
exports.constraint          = Constraint;
