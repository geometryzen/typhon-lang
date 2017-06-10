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
import { SymbolTableScope } from './SymbolTableScope';

export class Symbol {
    private __name: string;
    private __flags: number;
    private __scope: number;
    private __namespaces: SymbolTableScope[];
    /**
     * @param name
     * @param flags
     * @param namespaces
     */
    constructor(name: string, flags: number, namespaces: SymbolTableScope[]) {
        this.__name = name;
        this.__flags = flags;
        this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
        this.__namespaces = namespaces || [];
    }
    get_name(): string { return this.__name; }
    is_referenced(): boolean { return !!(this.__flags & USE); }

    is_parameter(): boolean {
        return !!(this.__flags & DEF_PARAM);
    }

    is_global(): boolean {
        return this.__scope === GLOBAL_IMPLICIT || this.__scope === GLOBAL_EXPLICIT;
    }

    is_declared_global(): boolean {
        return this.__scope === GLOBAL_EXPLICIT;
    }

    is_local(): boolean {
        return !!(this.__flags & DEF_BOUND);
    }

    is_free(): boolean { return this.__scope === FREE; }
    is_imported(): boolean { return !!(this.__flags & DEF_IMPORT); }
    is_assigned(): boolean { return !!(this.__flags & DEF_LOCAL); }
    is_namespace(): boolean { return this.__namespaces && this.__namespaces.length > 0; }
    get_namespaces(): SymbolTableScope[] { return this.__namespaces; }
}
