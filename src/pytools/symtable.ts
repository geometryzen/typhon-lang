// import { Symbol } from './Symbol';
import { SymbolTable } from './SymbolTable';
import { ModuleBlock } from './SymbolConstants';
import { Module } from './types';
import { Statement } from './types';

/**
 *
 */
export function symbolTable(mod: Module): SymbolTable {
    const st = new SymbolTable();

    st.enterBlock("top", ModuleBlock, mod, 0);
    st.top = st.cur;

    // This is a good place to dump the AST for debugging.
    for (const stmt of mod.body) {
        st.visitStmt(stmt);
    }

    st.exitBlock();

    st.analyze();

    return st;
}

export function symbolTableFromStatements(stmts: Statement[]): SymbolTable {
    const st = new SymbolTable();

    // st.enterBlock("top", ModuleBlock, mod, 0);
    st.top = st.cur;

    // This is a good place to dump the AST for debugging.
    for (const stmt of stmts) {
        st.visitStmt(stmt);
    }

    // st.exitBlock();

    st.analyze();

    return st;
}

export interface SymbolInfo {
    get_name(): string;
    is_referenced(): boolean;
    is_imported(): boolean;
    is_parameter(): boolean;
    is_global(): boolean;
    is_declared_global(): boolean;
    is_local(): boolean;
    is_free(): boolean;
    is_assigned(): boolean;
    is_namespace(): boolean;
    get_namespaces(): SymbolObj[];
}

export interface SymbolObj {
    get_type(): string;
    get_name(): string;
    get_lineno(): number;
    is_nested(): boolean;
    has_children(): boolean;
    get_methods(): string[];
    get_parameters(): string[];
    get_locals(): string[];
    get_globals(): string[];
    get_frees(): string[];
    get_identifiers(): string[];
    lookup(identifier: string): SymbolInfo;
}

/**
 *
 */
export function dumpSymbolTable(st: SymbolTable): string {
    const pyBoolStr = function (b: boolean): string {
        return b ? "True" : "False";
    };
    const pyList = function (l: string[]) {
        const ret: string[] = [];
        for (let i = 0; i < l.length; ++i) {
            // TODO: Originally, this computed the Python repr().
            ret.push(l[i]);
        }
        return '[' + ret.join(', ') + ']';
    };
    const getIdents = function (obj: SymbolObj, indent: string): string {
        if (indent === undefined) indent = "";
        let ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno() + "\n";
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class") {
            ret += indent + "Class_methods: " + pyList(obj.get_methods()) + "\n";
        }
        else if (obj.get_type() === "function") {
            ret += indent + "Func_params: " + pyList(obj.get_parameters()) + "\n";
            ret += indent + "Func_locals: " + pyList(obj.get_locals()) + "\n";
            ret += indent + "Func_globals: " + pyList(obj.get_globals()) + "\n";
            ret += indent + "Func_frees: " + pyList(obj.get_frees()) + "\n";
        }
        ret += indent + "-- Identifiers --\n";
        const objidents = obj.get_identifiers();
        const objidentslen = objidents.length;
        for (let i = 0; i < objidentslen; ++i) {
            const info = obj.lookup(objidents[i]);
            ret += indent + "name: " + info.get_name() + "\n";
            ret += indent + "  is_referenced: " + pyBoolStr(info.is_referenced()) + "\n";
            ret += indent + "  is_imported: " + pyBoolStr(info.is_imported()) + "\n";
            ret += indent + "  is_parameter: " + pyBoolStr(info.is_parameter()) + "\n";
            ret += indent + "  is_global: " + pyBoolStr(info.is_global()) + "\n";
            ret += indent + "  is_declared_global: " + pyBoolStr(info.is_declared_global()) + "\n";
            ret += indent + "  is_local: " + pyBoolStr(info.is_local()) + "\n";
            ret += indent + "  is_free: " + pyBoolStr(info.is_free()) + "\n";
            ret += indent + "  is_assigned: " + pyBoolStr(info.is_assigned()) + "\n";
            ret += indent + "  is_namespace: " + pyBoolStr(info.is_namespace()) + "\n";
            const nss = info.get_namespaces();
            const nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            const sub: string[] = [];
            for (let j = 0; j < nsslen; ++j) {
                const ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join('\n');
            ret += indent + '  ]\n';
        }
        return ret;
    };
    return getIdents(st.top, '');
}
