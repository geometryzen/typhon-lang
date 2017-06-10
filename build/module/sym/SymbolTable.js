import { assert, fail } from '../common/asserts';
import { dictUpdate } from '../common/dictUpdate';
import { mangleName } from './mangleName';
import { SymbolTableScope } from './SymbolTableScope';
import { syntaxError } from '../common/syntaxError';
import { Assert } from '../ast/types';
import { Assign } from '../ast/types';
import { Attribute } from '../ast/types';
import { AugAssign } from '../ast/types';
import { BinOp } from '../ast/types';
import { BoolOp } from '../ast/types';
import { BreakStatement } from '../ast/types';
import { Call } from '../ast/types';
import { ClassDef } from '../ast/types';
import { Compare } from '../ast/types';
import { ContinueStatement } from '../ast/types';
import { DeleteStatement } from '../ast/types';
import { Dict } from '../ast/types';
import { Ellipsis } from '../ast/types';
import { Exec } from '../ast/types';
import { ExpressionStatement } from '../ast/types';
import { ExtSlice } from '../ast/types';
import { ForStatement } from '../ast/types';
import { FunctionDef } from '../ast/types';
import { GeneratorExp } from '../ast/types';
import { Global } from '../ast/types';
import { IfStatement } from '../ast/types';
import { IfExp } from '../ast/types';
import { ImportStatement } from '../ast/types';
import { ImportFrom } from '../ast/types';
import { Index } from '../ast/types';
import { Lambda } from '../ast/types';
import { Load } from '../ast/types';
import { List } from '../ast/types';
import { ListComp } from '../ast/types';
import { Name } from '../ast/types';
import { Num } from '../ast/types';
import { Param } from '../ast/types';
import { Pass } from '../ast/types';
import { Print } from '../ast/types';
import { Raise } from '../ast/types';
import { ReturnStatement } from '../ast/types';
import { Slice } from '../ast/types';
import { Store } from '../ast/types';
import { Str } from '../ast/types';
import { Subscript } from '../ast/types';
import { TryExcept } from '../ast/types';
import { TryFinally } from '../ast/types';
import { Tuple } from '../ast/types';
import { UnaryOp } from '../ast/types';
import { WhileStatement } from '../ast/types';
import { WithStatement } from '../ast/types';
import { Yield } from '../ast/types';
import { CELL } from './SymbolConstants';
import { ClassBlock } from './SymbolConstants';
import { DEF_BOUND } from './SymbolConstants';
import { DEF_FREE_CLASS } from './SymbolConstants';
import { DEF_GLOBAL } from './SymbolConstants';
import { DEF_IMPORT } from './SymbolConstants';
import { DEF_LOCAL } from './SymbolConstants';
import { DEF_PARAM } from './SymbolConstants';
import { FREE } from './SymbolConstants';
import { FunctionBlock } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { LOCAL } from './SymbolConstants';
import { ModuleBlock } from './SymbolConstants';
import { USE } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';
//
// TODO: This should be refactored into a SemanticVisitor implementing the Visitor.
//
/**
 * Migrate to using this class to providing the implementation for the SymbolTable.
 */
var SemanticVisitor = (function () {
    function SemanticVisitor(st) {
        this.st = st;
        // Do nothing.
    }
    SemanticVisitor.prototype.assign = function (assign) {
        this.st.SEQExpr(assign.targets);
        assign.value.accept(this);
    };
    SemanticVisitor.prototype.attribute = function (attribute) {
        attribute.value.accept(this);
    };
    SemanticVisitor.prototype.binOp = function (be) {
        be.lhs.accept(this);
        be.rhs.accept(this);
    };
    SemanticVisitor.prototype.callExpression = function (ce) {
        ce.func.accept(this);
        this.st.SEQExpr(ce.args);
        for (var i = 0; i < ce.keywords.length; ++i)
            ce.keywords[i].value.accept(this);
        // print(JSON.stringify(e.starargs, null, 2));
        // print(JSON.stringify(e.kwargs, null,2));
        if (ce.starargs) {
            ce.starargs.accept(this);
        }
        if (ce.kwargs) {
            ce.kwargs.accept(this);
        }
    };
    SemanticVisitor.prototype.classDef = function (cd) {
        this.st.addDef(cd.name.value, DEF_LOCAL, cd.range);
        this.st.SEQExpr(cd.bases);
        if (cd.decorator_list)
            this.st.SEQExpr(cd.decorator_list);
        this.st.enterBlock(cd.name.value, ClassBlock, cd, cd.range);
        var tmp = this.st.curClass;
        this.st.curClass = cd.name.value;
        this.st.SEQStmt(cd.body);
        this.st.curClass = tmp;
        this.st.exitBlock();
    };
    SemanticVisitor.prototype.compareExpression = function (ce) {
        ce.left.accept(this);
        this.st.SEQExpr(ce.comparators);
    };
    SemanticVisitor.prototype.dict = function (dict) {
        this.st.SEQExpr(dict.keys);
        this.st.SEQExpr(dict.values);
    };
    SemanticVisitor.prototype.expressionStatement = function (expressionStatement) {
        expressionStatement.accept(this);
    };
    SemanticVisitor.prototype.functionDef = function (fd) {
        this.st.addDef(fd.name.value, DEF_LOCAL, fd.range);
        if (fd.args.defaults)
            this.st.SEQExpr(fd.args.defaults);
        if (fd.decorator_list)
            this.st.SEQExpr(fd.decorator_list);
        this.st.enterBlock(fd.name.value, FunctionBlock, fd, fd.range);
        this.st.visitArguments(fd.args, fd.range);
        this.st.SEQStmt(fd.body);
        this.st.exitBlock();
    };
    SemanticVisitor.prototype.ifStatement = function (i) {
        i.test.accept(this);
        this.st.SEQStmt(i.consequent);
        if (i.alternate) {
            this.st.SEQStmt(i.alternate);
        }
        throw new Error("SemanticVistor.IfStatement");
    };
    SemanticVisitor.prototype.importFrom = function (importFrom) {
        this.st.visitAlias(importFrom.names, importFrom.range);
    };
    SemanticVisitor.prototype.list = function (list) {
        this.st.SEQExpr(list.elts);
    };
    SemanticVisitor.prototype.module = function (module) {
        throw new Error("module");
    };
    SemanticVisitor.prototype.name = function (name) {
        this.st.addDef(name.id.value, name.ctx === Load ? USE : DEF_LOCAL, name.range);
    };
    SemanticVisitor.prototype.num = function (num) {
        // Do nothing, unless we are doing type inference.
    };
    SemanticVisitor.prototype.print = function (print) {
        if (print.dest) {
            print.dest.accept(this);
        }
        this.st.SEQExpr(print.values);
    };
    SemanticVisitor.prototype.returnStatement = function (rs) {
        if (rs.value) {
            rs.value.accept(this);
            this.st.cur.returnsValue = true;
            if (this.st.cur.generator) {
                throw syntaxError("'return' with argument inside generator");
            }
        }
    };
    SemanticVisitor.prototype.str = function (str) {
        // Do nothing, unless we are doing type inference.
    };
    return SemanticVisitor;
}());
export { SemanticVisitor };
/**
 * The symbol table uses the abstract synntax tree (not the parse tree).
 */
var SymbolTable = (function () {
    /**
     *
     */
    function SymbolTable() {
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
    SymbolTable.prototype.getStsForAst = function (ast) {
        assert(ast.scopeId !== undefined, "ast wasn't added to st?");
        var v = this.stss[ast.scopeId];
        assert(v !== undefined, "unknown sym tab entry");
        return v;
    };
    SymbolTable.prototype.SEQStmt = function (nodes) {
        var len = nodes.length;
        for (var i = 0; i < len; ++i) {
            var val = nodes[i];
            if (val)
                this.visitStmt(val);
        }
    };
    SymbolTable.prototype.SEQExpr = function (nodes) {
        var len = nodes.length;
        for (var i = 0; i < len; ++i) {
            var val = nodes[i];
            if (val)
                this.visitExpr(val);
        }
    };
    /**
     * A block represents a scope.
     * The following nodes in the AST define new blocks of the indicated type and name:
     * Module        ModuleBlock   = 'module'    name = 'top'
     * FunctionDef   FunctionBlock = 'function'  name = The name of the function.
     * ClassDef      ClassBlock    = 'class'     name = The name of the class.
     * Lambda        FunctionBlock = 'function'  name = 'lambda'
     * GeneratoeExp  FunctionBlock = 'function'  name = 'genexpr'
     *
     * @param name
     * @param blockType
     * @param astNode The AST node that is defining the block.
     * @param lineno
     */
    SymbolTable.prototype.enterBlock = function (name, blockType, astNode, range) {
        //  name = fixReservedNames(name);
        var prev = null;
        if (this.cur) {
            prev = this.cur;
            this.stack.push(this.cur);
        }
        this.cur = new SymbolTableScope(this, name, blockType, astNode, range);
        if (name === 'top') {
            this.global = this.cur.symFlags;
        }
        if (prev) {
            prev.children.push(this.cur);
        }
    };
    SymbolTable.prototype.exitBlock = function () {
        // print("exitBlock");
        this.cur = null;
        if (this.stack.length > 0)
            this.cur = this.stack.pop();
    };
    SymbolTable.prototype.visitParams = function (args, toplevel) {
        for (var i = 0; i < args.length; ++i) {
            var arg = args[i];
            if (arg.constructor === Name) {
                assert(arg.ctx === Param || (arg.ctx === Store && !toplevel));
                this.addDef(arg.id.value, DEF_PARAM, arg.range);
            }
            else {
                // Tuple isn't supported
                throw syntaxError("invalid expression in parameter list");
            }
        }
    };
    SymbolTable.prototype.visitArguments = function (a, range) {
        if (a.args)
            this.visitParams(a.args, true);
        if (a.vararg) {
            this.addDef(a.vararg, DEF_PARAM, range);
            this.cur.varargs = true;
        }
        if (a.kwarg) {
            this.addDef(a.kwarg, DEF_PARAM, range);
            this.cur.varkeywords = true;
        }
    };
    /**
     *
     */
    SymbolTable.prototype.newTmpname = function (range) {
        this.addDef("_[" + (++this.tmpname) + "]", DEF_LOCAL, range);
    };
    /**
     * 1. Modifies symbol flags for the current scope.
     * 2.a Adds a variable name for the current scope, OR
     * 2.b Sets the SymbolFlags for a global variable.
     * @param name
     * @param flags
     * @param lineno
     */
    SymbolTable.prototype.addDef = function (name, flags, range) {
        var mangled = mangleName(this.curClass, name);
        //  mangled = fixReservedNames(mangled);
        // Modify symbol flags for the current scope.
        var val = this.cur.symFlags[mangled];
        if (val !== undefined) {
            if ((flags & DEF_PARAM) && (val & DEF_PARAM)) {
                throw syntaxError("duplicate argument '" + name + "' in function definition", range);
            }
            val |= flags;
        }
        else {
            val = flags;
        }
        this.cur.symFlags[mangled] = val;
        if (flags & DEF_PARAM) {
            this.cur.varnames.push(mangled);
        }
        else if (flags & DEF_GLOBAL) {
            val = flags;
            var fromGlobal = this.global[mangled];
            if (fromGlobal !== undefined)
                val |= fromGlobal;
            this.global[mangled] = val;
        }
    };
    SymbolTable.prototype.visitSlice = function (s) {
        if (s instanceof Slice) {
            if (s.lower)
                this.visitExpr(s.lower);
            if (s.upper)
                this.visitExpr(s.upper);
            if (s.step)
                this.visitExpr(s.step);
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
    };
    /**
     *
     */
    SymbolTable.prototype.visitStmt = function (s) {
        assert(s !== undefined, "visitStmt called with undefined");
        if (s instanceof FunctionDef) {
            this.addDef(s.name.value, DEF_LOCAL, s.range);
            if (s.args.defaults)
                this.SEQExpr(s.args.defaults);
            if (s.decorator_list)
                this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name.value, FunctionBlock, s, s.range);
            this.visitArguments(s.args, s.range);
            this.SEQStmt(s.body);
            this.exitBlock();
        }
        else if (s instanceof ClassDef) {
            this.addDef(s.name.value, DEF_LOCAL, s.range);
            this.SEQExpr(s.bases);
            if (s.decorator_list)
                this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name.value, ClassBlock, s, s.range);
            var tmp = this.curClass;
            this.curClass = s.name.value;
            this.SEQStmt(s.body);
            this.curClass = tmp;
            this.exitBlock();
        }
        else if (s instanceof ReturnStatement) {
            if (s.value) {
                this.visitExpr(s.value);
                this.cur.returnsValue = true;
                if (this.cur.generator) {
                    throw syntaxError("'return' with argument inside generator");
                }
            }
        }
        else if (s instanceof DeleteStatement) {
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
            if (s.dest)
                this.visitExpr(s.dest);
            this.SEQExpr(s.values);
        }
        else if (s instanceof ForStatement) {
            this.visitExpr(s.target);
            this.visitExpr(s.iter);
            this.SEQStmt(s.body);
            if (s.orelse)
                this.SEQStmt(s.orelse);
        }
        else if (s instanceof WhileStatement) {
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse)
                this.SEQStmt(s.orelse);
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
            if (s.msg)
                this.visitExpr(s.msg);
        }
        else if (s instanceof ImportStatement) {
            var imps = s;
            this.visitAlias(imps.names, imps.range);
        }
        else if (s instanceof ImportFrom) {
            var impFrom = s;
            this.visitAlias(impFrom.names, impFrom.range);
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
                var name_1 = mangleName(this.curClass, s.names[i]);
                //              name = fixReservedNames(name);
                var cur = this.cur.symFlags[name_1];
                if (cur & (DEF_LOCAL | USE)) {
                    if (cur & DEF_LOCAL) {
                        throw syntaxError("name '" + name_1 + "' is assigned to before global declaration", s.range);
                    }
                    else {
                        throw syntaxError("name '" + name_1 + "' is used prior to global declaration", s.range);
                    }
                }
                this.addDef(name_1, DEF_GLOBAL, s.range);
            }
        }
        else if (s instanceof ExpressionStatement) {
            this.visitExpr(s.value);
        }
        else if (s instanceof Pass || s instanceof BreakStatement || s instanceof ContinueStatement) {
            // Do nothing.
        }
        else if (s instanceof WithStatement) {
            var ws = s;
            this.newTmpname(ws.range);
            this.visitExpr(ws.context_expr);
            if (ws.optional_vars) {
                this.newTmpname(ws.range);
                this.visitExpr(ws.optional_vars);
            }
            this.SEQStmt(ws.body);
        }
        else {
            fail("Unhandled type " + s.constructor.name + " in visitStmt");
        }
    };
    SymbolTable.prototype.visitExpr = function (e) {
        assert(e !== undefined, "visitExpr called with undefined");
        if (e instanceof BoolOp) {
            this.SEQExpr(e.values);
        }
        else if (e instanceof BinOp) {
            this.visitExpr(e.lhs);
            this.visitExpr(e.rhs);
        }
        else if (e instanceof UnaryOp) {
            this.visitExpr(e.operand);
        }
        else if (e instanceof Lambda) {
            this.addDef("lambda", DEF_LOCAL, e.range);
            if (e.args.defaults)
                this.SEQExpr(e.args.defaults);
            this.enterBlock("lambda", FunctionBlock, e, e.range);
            this.visitArguments(e.args, e.range);
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
            this.newTmpname(e.range);
            this.visitExpr(e.elt);
            this.visitComprehension(e.generators, 0);
        }
        else if (e instanceof GeneratorExp) {
            this.visitGenexp(e);
        }
        else if (e instanceof Yield) {
            if (e.value)
                this.visitExpr(e.value);
            this.cur.generator = true;
            if (this.cur.returnsValue) {
                throw syntaxError("'return' with argument inside generator");
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
            if (e.starargs)
                this.visitExpr(e.starargs);
            if (e.kwargs)
                this.visitExpr(e.kwargs);
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
            this.addDef(e.id.value, e.ctx === Load ? USE : DEF_LOCAL, e.range);
        }
        else if (e instanceof List || e instanceof Tuple) {
            this.SEQExpr(e.elts);
        }
        else {
            fail("Unhandled type " + e.constructor.name + " in visitExpr");
        }
    };
    SymbolTable.prototype.visitComprehension = function (lcs, startAt) {
        var len = lcs.length;
        for (var i = startAt; i < len; ++i) {
            var lc = lcs[i];
            this.visitExpr(lc.target);
            this.visitExpr(lc.iter);
            this.SEQExpr(lc.ifs);
        }
    };
    /**
     * This is probably not correct for names. What are they?
     * @param names
     * @param range
     */
    SymbolTable.prototype.visitAlias = function (names, range) {
        /* Compute store_name, the name actually bound by the import
            operation.  It is diferent than a->name when a->name is a
            dotted package name (e.g. spam.eggs)
        */
        for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
            var a = names_1[_i];
            var name_2 = a.asname === null ? a.name.value : a.asname;
            var storename = name_2;
            var dot = name_2.indexOf('.');
            if (dot !== -1)
                storename = name_2.substr(0, dot);
            if (name_2 !== "*") {
                this.addDef(storename, DEF_IMPORT, range);
            }
            else {
                if (this.cur.blockType !== ModuleBlock) {
                    throw syntaxError("import * only allowed at module level");
                }
            }
        }
    };
    /**
     *
     */
    SymbolTable.prototype.visitGenexp = function (e) {
        var outermost = e.generators[0];
        // outermost is evaled in current scope
        this.visitExpr(outermost.iter);
        this.enterBlock("genexpr", FunctionBlock, e, e.range);
        this.cur.generator = true;
        this.addDef(".0", DEF_PARAM, e.range);
        this.visitExpr(outermost.target);
        this.SEQExpr(outermost.ifs);
        this.visitComprehension(e.generators, 1);
        this.visitExpr(e.elt);
        this.exitBlock();
    };
    SymbolTable.prototype.visitExcepthandlers = function (handlers) {
        for (var i = 0, eh = void 0; eh = handlers[i]; ++i) {
            if (eh.type)
                this.visitExpr(eh.type);
            if (eh.name)
                this.visitExpr(eh.name);
            this.SEQStmt(eh.body);
        }
    };
    /**
     * @param ste The Symbol Table Scope.
     */
    SymbolTable.prototype.analyzeBlock = function (ste, bound, free, global) {
        var local = {};
        var scope = {};
        var newglobal = {};
        var newbound = {};
        var newfree = {};
        if (ste.blockType === ClassBlock) {
            dictUpdate(newglobal, global);
            if (bound)
                dictUpdate(newbound, bound);
        }
        for (var name_3 in ste.symFlags) {
            if (ste.symFlags.hasOwnProperty(name_3)) {
                var flags = ste.symFlags[name_3];
                this.analyzeName(ste, scope, name_3, flags, bound, local, free, global);
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
        if (ste.blockType === FunctionBlock)
            this.analyzeCells(scope, newfree);
        this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);
        dictUpdate(free, newfree);
    };
    SymbolTable.prototype.analyzeChildBlock = function (entry, bound, free, global, childFree) {
        var tempBound = {};
        dictUpdate(tempBound, bound);
        var tempFree = {};
        dictUpdate(tempFree, free);
        var tempGlobal = {};
        dictUpdate(tempGlobal, global);
        this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
        dictUpdate(childFree, tempFree);
    };
    SymbolTable.prototype.analyzeCells = function (scope, free) {
        for (var name_4 in scope) {
            if (scope.hasOwnProperty(name_4)) {
                var flags = scope[name_4];
                if (flags !== LOCAL)
                    continue;
                if (free[name_4] === undefined)
                    continue;
                scope[name_4] = CELL;
                delete free[name_4];
            }
        }
    };
    /**
     * store scope info back into the st symbols dict. symbols is modified,
     * others are not.
     */
    SymbolTable.prototype.updateSymbols = function (symbols, scope, bound, free, classflag) {
        for (var name_5 in symbols) {
            if (symbols.hasOwnProperty(name_5)) {
                var flags = symbols[name_5];
                var w = scope[name_5];
                flags |= w << SCOPE_OFF;
                symbols[name_5] = flags;
            }
        }
        var freeValue = FREE << SCOPE_OFF;
        for (var name_6 in free) {
            if (free.hasOwnProperty(name_6)) {
                var o = symbols[name_6];
                if (o !== undefined) {
                    // it could be a free variable in a method of the class that has
                    // the same name as a local or global in the class scope
                    if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                        var i = o | DEF_FREE_CLASS;
                        symbols[name_6] = i;
                    }
                    // else it's not free, probably a cell
                    continue;
                }
                if (bound[name_6] === undefined)
                    continue;
                symbols[name_6] = freeValue;
            }
        }
    };
    /**
     * @param {Object} ste The Symbol Table Scope.
     * @param {string} name
     */
    SymbolTable.prototype.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
        if (flags & DEF_GLOBAL) {
            if (flags & DEF_PARAM)
                throw syntaxError("name '" + name + "' is local and global", ste.range);
            dict[name] = GLOBAL_EXPLICIT;
            global[name] = null;
            if (bound && bound[name] !== undefined)
                delete bound[name];
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
    };
    SymbolTable.prototype.analyze = function () {
        var free = {};
        var global = {};
        this.analyzeBlock(this.top, null, free, global);
    };
    return SymbolTable;
}());
export { SymbolTable };
