"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("./asserts");
var Symbol_1 = require("./Symbol");
var SymbolConstants_1 = require("./SymbolConstants");
var SymbolConstants_2 = require("./SymbolConstants");
var SymbolConstants_3 = require("./SymbolConstants");
var SymbolConstants_4 = require("./SymbolConstants");
var SymbolConstants_5 = require("./SymbolConstants");
var SymbolConstants_6 = require("./SymbolConstants");
var SymbolConstants_7 = require("./SymbolConstants");
var SymbolConstants_8 = require("./SymbolConstants");
var astScopeCounter = 0;
var SymbolTableScope = (function () {
    /**
     * @constructor
     * @param {Object} table
     * @param {string} name
     * @param {string} type
     * @param {number} lineno
     */
    function SymbolTableScope(table, name, type, ast, lineno) {
        this.symFlags = {};
        this.name = name;
        this.varnames = [];
        /**
         * @type Array.<SymbolTableScope>
         */
        this.children = [];
        this.blockType = type;
        this.isNested = false;
        this.hasFree = false;
        this.childHasFree = false; // true if child block has free vars including free refs to globals
        this.generator = false;
        this.varargs = false;
        this.varkeywords = false;
        this.returnsValue = false;
        this.lineno = lineno;
        this.table = table;
        if (table.cur && (table.cur.nested || table.cur.blockType === SymbolConstants_4.FunctionBlock))
            this.isNested = true;
        ast.scopeId = astScopeCounter++;
        table.stss[ast.scopeId] = this;
        // cache of Symbols for returning to other parts of code
        this.symbols = {};
    }
    SymbolTableScope.prototype.get_type = function () { return this.blockType; };
    SymbolTableScope.prototype.get_name = function () { return this.name; };
    SymbolTableScope.prototype.get_lineno = function () { return this.lineno; };
    SymbolTableScope.prototype.is_nested = function () { return this.isNested; };
    SymbolTableScope.prototype.has_children = function () { return this.children.length > 0; };
    SymbolTableScope.prototype.get_identifiers = function () { return this._identsMatching(function (x) { return true; }); };
    SymbolTableScope.prototype.lookup = function (name) {
        var sym;
        if (!this.symbols.hasOwnProperty(name)) {
            var flags = this.symFlags[name];
            var namespaces = this.__check_children(name);
            sym = this.symbols[name] = new Symbol_1.Symbol(name, flags, namespaces);
        }
        else {
            sym = this.symbols[name];
        }
        return sym;
    };
    SymbolTableScope.prototype.__check_children = function (name) {
        // print("  check_children:", name);
        var ret = [];
        for (var i = 0; i < this.children.length; ++i) {
            var child = this.children[i];
            if (child.name === name)
                ret.push(child);
        }
        return ret;
    };
    SymbolTableScope.prototype._identsMatching = function (f) {
        var ret = [];
        for (var k in this.symFlags) {
            if (this.symFlags.hasOwnProperty(k)) {
                if (f(this.symFlags[k]))
                    ret.push(k);
            }
        }
        ret.sort();
        return ret;
    };
    SymbolTableScope.prototype.get_parameters = function () {
        asserts_1.assert(this.get_type() === 'function', "get_parameters only valid for function scopes");
        if (!this._funcParams)
            this._funcParams = this._identsMatching(function (x) { return !!(x & SymbolConstants_1.DEF_PARAM); });
        return this._funcParams;
    };
    SymbolTableScope.prototype.get_locals = function () {
        asserts_1.assert(this.get_type() === 'function', "get_locals only valid for function scopes");
        if (!this._funcLocals)
            this._funcLocals = this._identsMatching(function (x) { return !!(x & SymbolConstants_2.DEF_BOUND); });
        return this._funcLocals;
    };
    SymbolTableScope.prototype.get_globals = function () {
        asserts_1.assert(this.get_type() === 'function', "get_globals only valid for function scopes");
        if (!this._funcGlobals) {
            this._funcGlobals = this._identsMatching(function (x) {
                var masked = (x >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
                return masked === SymbolConstants_6.GLOBAL_IMPLICIT || masked === SymbolConstants_5.GLOBAL_EXPLICIT;
            });
        }
        return this._funcGlobals;
    };
    SymbolTableScope.prototype.get_frees = function () {
        asserts_1.assert(this.get_type() === 'function', "get_frees only valid for function scopes");
        if (!this._funcFrees) {
            this._funcFrees = this._identsMatching(function (x) {
                var masked = (x >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
                return masked === SymbolConstants_3.FREE;
            });
        }
        return this._funcFrees;
    };
    SymbolTableScope.prototype.get_methods = function () {
        asserts_1.assert(this.get_type() === 'class', "get_methods only valid for class scopes");
        if (!this._classMethods) {
            // todo; uniq?
            var all = [];
            for (var i = 0; i < this.children.length; ++i)
                all.push(this.children[i].name);
            all.sort();
            this._classMethods = all;
        }
        return this._classMethods;
    };
    SymbolTableScope.prototype.getScope = function (name) {
        // print("getScope");
        // for (var k in this.symFlags) print(k);
        var v = this.symFlags[name];
        if (v === undefined)
            return 0;
        return (v >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
    };
    return SymbolTableScope;
}());
exports.SymbolTableScope = SymbolTableScope;
