var crypto = require('crypto')
   ,step   = require("step");

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

    for (var i in attributes) {
        var a = attributes[i];
        if(!(a instanceof Attribute))
            this.attributes[i] = new Attribute(a.name,a.type,a.constraints); }

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

var Schema = function(options) {

    if(options instanceof Array) {
        this.tables = options;
    }
    else {
        this.tables = [];

        for (var i in options.tables) {
            var t = options.tables[i];
            this.tables[i] = new Table(t.name,t.attributes,t.constraints); }
    }

    this.create = function(db) {

        var tables = {};

        for (var j in this.tables) {
            var t = this.tables[j];
            tables[t.name] = t; }

        var sha1 = crypto.createHash('sha1');

        db.execute("SELECT name,sql FROM sqlite_master WHERE type='table'",function(error, rows) {
            if (error) { throw error; }

            var s = [];

            for (var i in rows) {
                var row = rows[i];

                sha1.update(row.sql);

                var t = tables[row.name];
                if(t) {
                    if(t.create() === row.sql) {
                        tables[t.name] = undefined; }
                    else {
                        s.push(function(x){console.log("alter"); return t; });
                    }
                }
            }

            for (var j in tables) {
                var t = tables[j];
                if(t) {
                    s.push(function() { db.execute(t.create(), function (error) { if (error) { throw error; } }); return ""; });
                }
            }

            step.apply(this,s);

            this.schemaVersion = sha1.digest("hex");
        });
        
    };
};

function quote(name) { return name; }

exports.schema              = Schema;
exports.table               = Table;
exports.attribute           = Attribute;
exports.constraint          = Constraint;
