import { assert } from '../common/asserts';
import { Symbol } from './Symbol';
import { DEF_PARAM } from './SymbolConstants';
import { DEF_BOUND } from './SymbolConstants';
import { FREE } from './SymbolConstants';
import { FunctionBlock } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { SCOPE_MASK } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';
var astScopeCounter = 0;
/**
 * A SymbolTableScope is created for nodes in the AST.
 * It is created only when the SymbolTable enters a block.
 */
var SymbolTableScope = (function () {
    /**
     * @param table
     * @param name The name of the node defining the scope.
     * @param blockType
     * @param astNode
     * @param range
     */
    function SymbolTableScope(table, name, blockType, astNode, range) {
        /**
         * A mapping from the name of a symbol to its flags.
         */
        this.symFlags = {};
        /**
         * A list of (local) variables that exists in the current scope.
         * This is populated by the addDef method in SymbolTable.
         * e.g. Name, FunctionDef, ClassDef, Global?, Lambda, Alias.
         * Note that global variables are maintained in the SymbolTable to which we have access.
         */
        this.varnames = [];
        this.children = [];
        this.table = table;
        this.name = name;
        this.blockType = blockType;
        astNode.scopeId = astScopeCounter++;
        table.stss[astNode.scopeId] = this;
        this.range = range;
        if (table.cur && (table.cur.isNested || table.cur.blockType === FunctionBlock)) {
            this.isNested = true;
        }
        else {
            this.isNested = false;
        }
        this.hasFree = false;
        this.childHasFree = false; // true if child block has free vars including free refs to globals
        this.generator = false;
        this.varargs = false;
        this.varkeywords = false;
        this.returnsValue = false;
        // cache of Symbols for returning to other parts of code
        this.symbols = {};
    }
    SymbolTableScope.prototype.get_type = function () { return this.blockType; };
    SymbolTableScope.prototype.get_name = function () { return this.name; };
    SymbolTableScope.prototype.get_range = function () { return this.range; };
    SymbolTableScope.prototype.is_nested = function () { return this.isNested; };
    SymbolTableScope.prototype.has_children = function () { return this.children.length > 0; };
    SymbolTableScope.prototype.get_identifiers = function () { return this._identsMatching(function (x) { return true; }); };
    SymbolTableScope.prototype.lookup = function (name) {
        var sym;
        if (!this.symbols.hasOwnProperty(name)) {
            var flags = this.symFlags[name];
            var namespaces = this.__check_children(name);
            sym = this.symbols[name] = new Symbol(name, flags, namespaces);
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
    /**
     * Looks in the bindings for this scope and returns the names of the nodes that match the mask filter.
     */
    SymbolTableScope.prototype._identsMatching = function (filter) {
        var ret = [];
        for (var k in this.symFlags) {
            if (this.symFlags.hasOwnProperty(k)) {
                if (filter(this.symFlags[k]))
                    ret.push(k);
            }
        }
        ret.sort();
        return ret;
    };
    /**
     * Returns the names of parameters (DEF_PARAM) for function scopes.
     */
    SymbolTableScope.prototype.get_parameters = function () {
        assert(this.get_type() === 'function', "get_parameters only valid for function scopes");
        if (!this._funcParams) {
            this._funcParams = this._identsMatching(function (x) { return !!(x & DEF_PARAM); });
        }
        return this._funcParams;
    };
    /**
     * Returns the names of local variables (DEF_BOUND) for function scopes.
     */
    SymbolTableScope.prototype.get_locals = function () {
        assert(this.get_type() === 'function', "get_locals only valid for function scopes");
        if (!this._funcLocals) {
            this._funcLocals = this._identsMatching(function (x) { return !!(x & DEF_BOUND); });
        }
        return this._funcLocals;
    };
    /**
     * Returns the names of global variables for function scopes.
     */
    SymbolTableScope.prototype.get_globals = function () {
        assert(this.get_type() === 'function', "get_globals only valid for function scopes");
        if (!this._funcGlobals) {
            this._funcGlobals = this._identsMatching(function (x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked === GLOBAL_IMPLICIT || masked === GLOBAL_EXPLICIT;
            });
        }
        return this._funcGlobals;
    };
    /**
     * Returns the names of free variables for function scopes.
     */
    SymbolTableScope.prototype.get_frees = function () {
        assert(this.get_type() === 'function', "get_frees only valid for function scopes");
        if (!this._funcFrees) {
            this._funcFrees = this._identsMatching(function (x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked === FREE;
            });
        }
        return this._funcFrees;
    };
    /**
     * Returns the names of methods for class scopes.
     */
    SymbolTableScope.prototype.get_methods = function () {
        assert(this.get_type() === 'class', "get_methods only valid for class scopes");
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
    /**
     * I think this returns the scopeId of a node with the specified name.
     */
    SymbolTableScope.prototype.getScope = function (name) {
        // print("getScope");
        // for (var k in this.symFlags) print(k);
        var v = this.symFlags[name];
        if (v === undefined)
            return 0;
        return (v >> SCOPE_OFF) & SCOPE_MASK;
    };
    return SymbolTableScope;
}());
export { SymbolTableScope };
