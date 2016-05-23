import {DEF_BOUND} from './SymbolConstants';
import {DEF_IMPORT} from './SymbolConstants';
import {DEF_LOCAL} from './SymbolConstants';
import {DEF_PARAM} from './SymbolConstants';
import {FREE} from './SymbolConstants';
import {GLOBAL_EXPLICIT} from './SymbolConstants';
import {GLOBAL_IMPLICIT} from './SymbolConstants';
import {SCOPE_MASK} from './SymbolConstants';
import {SCOPE_OFF} from './SymbolConstants';
import {USE} from './SymbolConstants';

export default class Symbol {
    private __name;
    private __flags;
    private __scope;
    private __namespaces
    /**
     * @constructor
     * @param {string} name
     * @param {number} flags
     * @param {Array.<SymbolTableScope>} namespaces
     */
    constructor(name, flags, namespaces) {
        this.__name = name;
        this.__flags = flags;
        this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
        this.__namespaces = namespaces || [];
    }
    get_name() { return this.__name; }
    is_referenced() { return !!(this.__flags & USE); }

    is_parameter() {
        return !!(this.__flags & DEF_PARAM);
    }

    is_global() {
        return this.__scope === GLOBAL_IMPLICIT || this.__scope == GLOBAL_EXPLICIT;
    }

    is_declared_global() {
        return this.__scope == GLOBAL_EXPLICIT;
    }

    is_local() {
        return !!(this.__flags & DEF_BOUND);
    }

    is_free() { return this.__scope == FREE; }
    is_imported() { return !!(this.__flags & DEF_IMPORT); }
    is_assigned() { return !!(this.__flags & DEF_LOCAL); }
    is_namespace() { return this.__namespaces && this.__namespaces.length > 0; }
    get_namespaces() { return this.__namespaces; }
}