import { assert, fail } from './asserts';
import { dictUpdate } from './dictUpdate';
import { mangleName } from './mangleName';
import { BlockType, SymbolTableScope } from './SymbolTableScope';
import { syntaxError } from './syntaxError';

import { Alias } from './types';
import { Assert } from './types';
import { Arguments } from './types';
import { Assign } from './types';
import { Attribute } from './types';
import { AugAssign } from './types';
import { BinOp } from './types';
import { BoolOp } from './types';
import { BreakStatement } from './types';
import { Call } from './types';
import { ClassDef } from './types';
import { Compare } from './types';
import { Comprehension } from './types';
import { ContinueStatement } from './types';
import { DeleteExpression } from './types';
import { Dict } from './types';
import { Ellipsis } from './types';
import { ExceptHandler } from './types';
import { Exec } from './types';
import { Expr } from './types';
import { Expression } from './types';
import { ExtSlice } from './types';
import { ForStatement } from './types';
import { FunctionDef } from './types';
import { GeneratorExp } from './types';
import { Global } from './types';
import { IfStatement } from './types';
import { IfExp } from './types';
import { ImportStatement } from './types';
import { ImportFrom } from './types';
import { Index } from './types';
import { Lambda } from './types';
import { Load } from './types';
import { List } from './types';
import { ListComp } from './types';
import { Name } from './types';
import { Num } from './types';
import { Param } from './types';
import { Pass } from './types';
import { Print } from './types';
import { Raise } from './types';
import { ReturnStatement } from './types';
import { Slice } from './types';
import { Statement } from './types';
import { Store } from './types';
import { Str } from './types';
import { Subscript } from './types';
import { TryExcept } from './types';
import { TryFinally } from './types';
import { Tuple } from './types';
import { UnaryOp } from './types';
import { WhileStatement } from './types';
import { WithStatement } from './types';
import { Yield } from './types';

import { CELL } from './SymbolConstants';
import { ClassBlock } from './SymbolConstants';
import { DEF_BOUND } from './SymbolConstants';
import { DEF_FREE_CLASS } from './SymbolConstants';
import { DEF_GLOBAL } from './SymbolConstants';
import { DEF_IMPORT } from './SymbolConstants';
import { DEF_LOCAL } from './SymbolConstants';
import { DEF_PARAM } from './SymbolConstants';
import { DictionaryKind } from './SymbolConstants';
import { FREE } from './SymbolConstants';
import { FunctionBlock } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { LOCAL } from './SymbolConstants';
import { ModuleBlock } from './SymbolConstants';
import { USE } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';

/**
 * The symbol table uses the abstract synntax tree (not the parse tree).
 */
export class SymbolTable {
    fileName: string;
    cur: SymbolTableScope;
    top: SymbolTableScope;
    stack: SymbolTableScope[];
    global: { [name: string]: number };
    curClass: string;
    tmpname: number;
    stss: { [scopeId: number]: SymbolTableScope };
    /**
     * @param fileName
     */
    constructor(fileName: string) {
        this.fileName = fileName;
        this.cur = null;
        this.top = null;
        this.stack = [];
        this.global = null; // points at top level module symFlags
        this.curClass = null; // current class or null
        this.tmpname = 0;

        // mapping from ast nodes to their scope if they have one. we add an
        // id to the ast node when a scope is created for it, and store it in
        // here for the compiler to lookup later.
        this.stss = {};
    }

    /**
     * Lookup the SymbolTableScope for a scopeId of the AST.
     */
    getStsForAst(ast: { scopeId: number }) {
        assert(ast.scopeId !== undefined, "ast wasn't added to st?");
        var v = this.stss[ast.scopeId];
        assert(v !== undefined, "unknown sym tab entry");
        return v;
    }

    SEQStmt(nodes: Statement[]): void {
        var len = nodes.length;
        for (var i = 0; i < len; ++i) {
            var val = nodes[i];
            if (val) this.visitStmt(val);
        }
    }

    SEQExpr(nodes: Expression[]): void {
        var len = nodes.length;
        for (var i = 0; i < len; ++i) {
            var val = nodes[i];
            if (val) this.visitExpr(val);
        }
    }

    enterBlock(name: string, blockType: BlockType, ast: { scopeId: number }, lineno: number) {
        //  name = fixReservedNames(name);
        var prev = null;
        if (this.cur) {
            prev = this.cur;
            this.stack.push(this.cur);
        }
        this.cur = new SymbolTableScope(this, name, blockType, ast, lineno);
        if (name === 'top') {
            this.global = this.cur.symFlags;
        }
        if (prev) {
            prev.children.push(this.cur);
        }
    }

    exitBlock() {
        // print("exitBlock");
        this.cur = null;
        if (this.stack.length > 0)
            this.cur = this.stack.pop();
    }

    visitParams(args: Name[], toplevel: boolean) {
        for (let i = 0; i < args.length; ++i) {
            const arg = args[i];
            if (arg.constructor === Name) {
                assert(arg.ctx === Param || (arg.ctx === Store && !toplevel));
                this.addDef(arg.id, DEF_PARAM, arg.lineno);
            }
            else {
                // Tuple isn't supported
                throw syntaxError("invalid expression in parameter list", this.fileName);
            }
        }
    }

    visitArguments(a: Arguments, lineno: number) {
        if (a.args) this.visitParams(a.args, true);
        if (a.vararg) {
            this.addDef(a.vararg, DEF_PARAM, lineno);
            this.cur.varargs = true;
        }
        if (a.kwarg) {
            this.addDef(a.kwarg, DEF_PARAM, lineno);
            this.cur.varkeywords = true;
        }
    }

    /**
     * @param {number} lineno
     * @return {void}
     */
    newTmpname(lineno: number): void {
        this.addDef("_[" + (++this.tmpname) + "]", DEF_LOCAL, lineno);
    }

    /**
     * @param {string} name
     * @param {number} flag
     * @param {number} lineno
     * @return {void}
     */
    addDef(name: string, flag: number, lineno: number): void {
        var mangled = mangleName(this.curClass, name);
        //  mangled = fixReservedNames(mangled);
        var val = this.cur.symFlags[mangled];
        if (val !== undefined) {
            if ((flag & DEF_PARAM) && (val & DEF_PARAM)) {
                throw syntaxError("duplicate argument '" + name + "' in function definition", this.fileName, lineno);
            }
            val |= flag;
        }
        else {
            val = flag;
        }
        this.cur.symFlags[mangled] = val;
        if (flag & DEF_PARAM) {
            this.cur.varnames.push(mangled);
        }
        else if (flag & DEF_GLOBAL) {
            val = flag;
            var fromGlobal = this.global[mangled];
            if (fromGlobal !== undefined) val |= fromGlobal;
            this.global[mangled] = val;
        }
    }

    visitSlice(s: Slice | ExtSlice | Index | Ellipsis) {
        if (s instanceof Slice) {
            if (s.lower) this.visitExpr(s.lower);
            if (s.upper) this.visitExpr(s.upper);
            if (s.step) this.visitExpr(s.step);
        }
        else if (s instanceof ExtSlice) {
            for (var i = 0; i < s.dims.length; ++i) {
                this.visitSlice(s.dims[i]);
            }
        }
        else if (s instanceof Index) {
            this.visitExpr(s.value);
        }
        else if (s instanceof Ellipsis) {
            // Do nothing.
        }
    }

    /**
     * @param {Object} s
     */
    visitStmt(s: Statement) {
        assert(s !== undefined, "visitStmt called with undefined");
        if (s instanceof FunctionDef) {
            this.addDef(s.name, DEF_LOCAL, s.lineno);
            if (s.args.defaults) this.SEQExpr(s.args.defaults);
            if (s.decorator_list) this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name, FunctionBlock, s, s.lineno);
            this.visitArguments(s.args, s.lineno);
            this.SEQStmt(s.body);
            this.exitBlock();
        }
        else if (s instanceof ClassDef) {
            this.addDef(s.name, DEF_LOCAL, s.lineno);
            this.SEQExpr(s.bases);
            if (s.decorator_list) this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name, ClassBlock, s, s.lineno);
            var tmp = this.curClass;
            this.curClass = s.name;
            this.SEQStmt(s.body);
            this.curClass = tmp;
            this.exitBlock();
        }
        else if (s instanceof ReturnStatement) {
            if (s.value) {
                this.visitExpr(s.value);
                this.cur.returnsValue = true;
                if (this.cur.generator) {
                    throw syntaxError("'return' with argument inside generator", this.fileName);
                }
            }
        }
        else if (s instanceof DeleteExpression) {
            this.SEQExpr(s.targets);
        }
        else if (s instanceof Assign) {
            this.SEQExpr(s.targets);
            this.visitExpr(s.value);
        }
        else if (s instanceof AugAssign) {
            this.visitExpr(s.target);
            this.visitExpr(s.value);
        }
        else if (s instanceof Print) {
            if (s.dest) this.visitExpr(s.dest);
            this.SEQExpr(s.values);
        }
        else if (s instanceof ForStatement) {
            this.visitExpr(s.target);
            this.visitExpr(s.iter);
            this.SEQStmt(s.body);
            if (s.orelse) this.SEQStmt(s.orelse);
        }
        else if (s instanceof WhileStatement) {
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse) this.SEQStmt(s.orelse);
        }
        else if (s instanceof IfStatement) {
            this.visitExpr(s.test);
            this.SEQStmt(s.consequent);
            if (s.alternate) {
                this.SEQStmt(s.alternate);
            }
        }
        else if (s instanceof Raise) {
            if (s.type) {
                this.visitExpr(s.type);
                if (s.inst) {
                    this.visitExpr(s.inst);
                    if (s.tback)
                        this.visitExpr(s.tback);
                }
            }
        }
        else if (s instanceof TryExcept) {
            this.SEQStmt(s.body);
            this.SEQStmt(s.orelse);
            this.visitExcepthandlers(s.handlers);
        }
        else if (s instanceof TryFinally) {
            this.SEQStmt(s.body);
            this.SEQStmt(s.finalbody);
        }
        else if (s instanceof Assert) {
            this.visitExpr(s.test);
            if (s.msg) this.visitExpr(s.msg);
        }
        else if (s instanceof ImportStatement) {
            const imps: ImportStatement = s;
            this.visitAlias(imps.names, imps.lineno);
        }
        else if (s instanceof ImportFrom) {
            const impFrom: ImportFrom = s;
            this.visitAlias(impFrom.names, impFrom.lineno);
        }
        else if (s instanceof Exec) {
            this.visitExpr(s.body);
            if (s.globals) {
                this.visitExpr(s.globals);
                if (s.locals)
                    this.visitExpr(s.locals);
            }
        }
        else if (s instanceof Global) {
            var nameslen = s.names.length;
            for (var i = 0; i < nameslen; ++i) {
                var name = mangleName(this.curClass, s.names[i]);
                //              name = fixReservedNames(name);
                var cur = this.cur.symFlags[name];
                if (cur & (DEF_LOCAL | USE)) {
                    if (cur & DEF_LOCAL) {
                        throw syntaxError("name '" + name + "' is assigned to before global declaration", this.fileName, s.lineno);
                    }
                    else {
                        throw syntaxError("name '" + name + "' is used prior to global declaration", this.fileName, s.lineno);
                    }
                }
                this.addDef(name, DEF_GLOBAL, s.lineno);
            }
        }
        else if (s instanceof Expr) {
            this.visitExpr(s.value);
        }
        else if (s instanceof Pass || s instanceof BreakStatement || s instanceof ContinueStatement) {
            // Do nothing.
        }
        else if (s instanceof WithStatement) {
            const ws: WithStatement = s;
            this.newTmpname(ws.lineno);
            this.visitExpr(ws.context_expr);
            if (ws.optional_vars) {
                this.newTmpname(ws.lineno);
                this.visitExpr(ws.optional_vars);
            }
            this.SEQStmt(ws.body);
        }
        else {
            fail("Unhandled type " + s.constructor.name + " in visitStmt");
        }
    }

    visitExpr(e: Expression) {
        assert(e !== undefined, "visitExpr called with undefined");
        if (e instanceof BoolOp) {
            this.SEQExpr(e.values);
        }
        else if (e instanceof BinOp) {
            this.visitExpr(e.left);
            this.visitExpr(e.right);
        }
        else if (e instanceof UnaryOp) {
            this.visitExpr(e.operand);
        }
        else if (e instanceof Lambda) {
            this.addDef("lambda", DEF_LOCAL, e.lineno);
            if (e.args.defaults)
                this.SEQExpr(e.args.defaults);
            this.enterBlock("lambda", FunctionBlock, e, e.lineno);
            this.visitArguments(e.args, e.lineno);
            this.visitExpr(e.body);
            this.exitBlock();
        }
        else if (e instanceof IfExp) {
            this.visitExpr(e.test);
            this.visitExpr(e.body);
            this.visitExpr(e.orelse);
        }
        else if (e instanceof Dict) {
            this.SEQExpr(e.keys);
            this.SEQExpr(e.values);
        }
        else if (e instanceof ListComp) {
            this.newTmpname(e.lineno);
            this.visitExpr(e.elt);
            this.visitComprehension(e.generators, 0);
        }
        else if (e instanceof GeneratorExp) {
            this.visitGenexp(e);
        }
        else if (e instanceof Yield) {
            if (e.value) this.visitExpr(e.value);
            this.cur.generator = true;
            if (this.cur.returnsValue) {
                throw syntaxError("'return' with argument inside generator", this.fileName);
            }
        }
        else if (e instanceof Compare) {
            this.visitExpr(e.left);
            this.SEQExpr(e.comparators);
        }
        else if (e instanceof Call) {
            this.visitExpr(e.func);
            this.SEQExpr(e.args);
            for (var i = 0; i < e.keywords.length; ++i)
                this.visitExpr(e.keywords[i].value);
            // print(JSON.stringify(e.starargs, null, 2));
            // print(JSON.stringify(e.kwargs, null,2));
            if (e.starargs) this.visitExpr(e.starargs);
            if (e.kwargs) this.visitExpr(e.kwargs);
        }
        else if (e instanceof Num || e instanceof Str) {
            // Do nothing.
        }
        else if (e instanceof Attribute) {
            this.visitExpr(e.value);
        }
        else if (e instanceof Subscript) {
            this.visitExpr(e.value);
            this.visitSlice(e.slice);
        }
        else if (e instanceof Name) {
            this.addDef(e.id, e.ctx === Load ? USE : DEF_LOCAL, e.lineno);
        }
        else if (e instanceof List || e instanceof Tuple) {
            this.SEQExpr(e.elts);
        }
        else {
            fail("Unhandled type " + e.constructor.name + " in visitExpr");
        }
    }

    visitComprehension(lcs: Comprehension[], startAt: number) {
        var len = lcs.length;
        for (var i = startAt; i < len; ++i) {
            var lc = lcs[i];
            this.visitExpr(lc.target);
            this.visitExpr(lc.iter);
            this.SEQExpr(lc.ifs);
        }
    }

    /**
     * This is probably not correct for names. What are they?
     * @param {Array.<Object>} names
     * @param {number} lineno
     */
    visitAlias(names: Alias[], lineno: number) {
        /* Compute store_name, the name actually bound by the import
            operation.  It is diferent than a->name when a->name is a
            dotted package name (e.g. spam.eggs)
        */
        for (var i = 0; i < names.length; ++i) {
            var a = names[i];
            // DGH: The RHS used to be Python strings.
            var name = a.asname === null ? a.name : a.asname;
            var storename = name;
            var dot = name.indexOf('.');
            if (dot !== -1)
                storename = name.substr(0, dot);
            if (name !== "*") {
                this.addDef(storename, DEF_IMPORT, lineno);
            }
            else {
                if (this.cur.blockType !== ModuleBlock) {
                    throw syntaxError("import * only allowed at module level", this.fileName);
                }
            }
        }
    }

    /**
     *
     */
    visitGenexp(e: GeneratorExp) {
        var outermost = e.generators[0];
        // outermost is evaled in current scope
        this.visitExpr(outermost.iter);
        this.enterBlock("genexpr", FunctionBlock, e, e.lineno);
        this.cur.generator = true;
        this.addDef(".0", DEF_PARAM, e.lineno);
        this.visitExpr(outermost.target);
        this.SEQExpr(outermost.ifs);
        this.visitComprehension(e.generators, 1);
        this.visitExpr(e.elt);
        this.exitBlock();
    }

    visitExcepthandlers(handlers: ExceptHandler[]) {
        for (var i = 0, eh; eh = handlers[i]; ++i) {
            if (eh.type) this.visitExpr(eh.type);
            if (eh.name) this.visitExpr(eh.name);
            this.SEQStmt(eh.body);
        }
    }

    /**
     * @param ste The Symbol Table Scope.
     */
    analyzeBlock(ste: SymbolTableScope, bound: {}, free: {}, global: {}) {
        var local = {};
        var scope: { [name: string]: DictionaryKind } = {};
        var newglobal = {};
        var newbound = {};
        var newfree = {};

        if (ste.blockType === ClassBlock) {
            dictUpdate(newglobal, global);
            if (bound)
                dictUpdate(newbound, bound);
        }

        for (let name in ste.symFlags) {
            if (ste.symFlags.hasOwnProperty(name)) {
                const flags = ste.symFlags[name];
                this.analyzeName(ste, scope, name, flags, bound, local, free, global);
            }
        }

        if (ste.blockType !== ClassBlock) {
            if (ste.blockType === FunctionBlock)
                dictUpdate(newbound, local);
            if (bound)
                dictUpdate(newbound, bound);
            dictUpdate(newglobal, global);
        }

        var allfree = {};
        var childlen = ste.children.length;
        for (var i = 0; i < childlen; ++i) {
            var c = ste.children[i];
            this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
            if (c.hasFree || c.childHasFree)
                ste.childHasFree = true;
        }

        dictUpdate(newfree, allfree);
        if (ste.blockType === FunctionBlock) this.analyzeCells(scope, newfree);
        this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);

        dictUpdate(free, newfree);
    }

    analyzeChildBlock(entry: SymbolTableScope, bound: {}, free: {}, global: {}, childFree: {}) {
        var tempBound = {};
        dictUpdate(tempBound, bound);
        var tempFree = {};
        dictUpdate(tempFree, free);
        var tempGlobal = {};
        dictUpdate(tempGlobal, global);

        this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
        dictUpdate(childFree, tempFree);
    }

    analyzeCells(scope: { [name: string]: number }, free: { [name: string]: any }) {
        for (let name in scope) {
            if (scope.hasOwnProperty(name)) {
                const flags = scope[name];
                if (flags !== LOCAL) continue;
                if (free[name] === undefined) continue;
                scope[name] = CELL;
                delete free[name];
            }
        }
    }

    /**
     * store scope info back into the st symbols dict. symbols is modified,
     * others are not.
     */
    updateSymbols(symbols: { [name: string]: number }, scope: { [name: string]: number }, bound: {}, free: {}, classflag: boolean) {
        for (let name in symbols) {
            if (symbols.hasOwnProperty(name)) {
                let flags = symbols[name];
                const w = scope[name];
                flags |= w << SCOPE_OFF;
                symbols[name] = flags;
            }
        }

        const freeValue = FREE << SCOPE_OFF;
        for (let name in free) {
            if (free.hasOwnProperty(name)) {
                const o = symbols[name];
                if (o !== undefined) {
                    // it could be a free variable in a method of the class that has
                    // the same name as a local or global in the class scope
                    if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                        const i = o | DEF_FREE_CLASS;
                        symbols[name] = i;
                    }
                    // else it's not free, probably a cell
                    continue;
                }
                if (bound[name] === undefined) continue;
                symbols[name] = freeValue;
            }
        }
    }

    /**
     * @param {Object} ste The Symbol Table Scope.
     * @param {string} name
     */
    analyzeName(ste: SymbolTableScope, dict: { [name: string]: DictionaryKind }, name: string, flags: number, bound: {}, local: {}, free: {}, global: {}) {
        if (flags & DEF_GLOBAL) {
            if (flags & DEF_PARAM) throw syntaxError("name '" + name + "' is local and global", this.fileName, ste.lineno);
            dict[name] = GLOBAL_EXPLICIT;
            global[name] = null;
            if (bound && bound[name] !== undefined) delete bound[name];
            return;
        }
        if (flags & DEF_BOUND) {
            dict[name] = LOCAL;
            local[name] = null;
            delete global[name];
            return;
        }

        if (bound && bound[name] !== undefined) {
            dict[name] = FREE;
            ste.hasFree = true;
            free[name] = null;
        }
        else if (global && global[name] !== undefined) {
            dict[name] = GLOBAL_IMPLICIT;
        }
        else {
            if (ste.isNested)
                ste.hasFree = true;
            dict[name] = GLOBAL_IMPLICIT;
        }
    }

    analyze() {
        var free = {};
        var global = {};
        this.analyzeBlock(this.top, null, free, global);
    }
}
