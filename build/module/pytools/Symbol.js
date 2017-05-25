import { DEF_BOUND } from './SymbolConstants';
import { DEF_IMPORT } from './SymbolConstants';
import { DEF_LOCAL } from './SymbolConstants';
import { DEF_PARAM } from './SymbolConstants';
import { FREE } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { SCOPE_MASK } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';
import { USE } from './SymbolConstants';
var Symbol = (function () {
    /**
     * @constructor
     * @param {string} name
     * @param {number} flags
     * @param {Array.<SymbolTableScope>} namespaces
     */
    function Symbol(name, flags, namespaces) {
        this.__name = name;
        this.__flags = flags;
        this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
        this.__namespaces = namespaces || [];
    }
    Symbol.prototype.get_name = function () { return this.__name; };
    Symbol.prototype.is_referenced = function () { return !!(this.__flags & USE); };
    Symbol.prototype.is_parameter = function () {
        return !!(this.__flags & DEF_PARAM);
    };
    Symbol.prototype.is_global = function () {
        return this.__scope === GLOBAL_IMPLICIT || this.__scope === GLOBAL_EXPLICIT;
    };
    Symbol.prototype.is_declared_global = function () {
        return this.__scope === GLOBAL_EXPLICIT;
    };
    Symbol.prototype.is_local = function () {
        return !!(this.__flags & DEF_BOUND);
    };
    Symbol.prototype.is_free = function () { return this.__scope === FREE; };
    Symbol.prototype.is_imported = function () { return !!(this.__flags & DEF_IMPORT); };
    Symbol.prototype.is_assigned = function () { return !!(this.__flags & DEF_LOCAL); };
    Symbol.prototype.is_namespace = function () { return this.__namespaces && this.__namespaces.length > 0; };
    Symbol.prototype.get_namespaces = function () { return this.__namespaces; };
    return Symbol;
}());
export default Symbol;
