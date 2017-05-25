import { assert, fail } from './asserts';
import dictUpdate from './dictUpdate';
import mangleName from './mangleName';
import SymbolTableScope from './SymbolTableScope';
import syntaxError from './syntaxError';
import { Assert } from './types';
import { Assign } from './types';
import { Attribute } from './types';
import { AugAssign } from './types';
import { BinOp } from './types';
import { BoolOp } from './types';
import { BreakStatement } from './types';
import { Call } from './types';
import { ClassDef } from './types';
import { Compare } from './types';
import { ContinueStatement } from './types';
import { DeleteExpression } from './types';
import { Dict } from './types';
import { Ellipsis } from './types';
import { Exec } from './types';
import { Expr } from './types';
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
import { FREE } from './SymbolConstants';
import { FunctionBlock } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { LOCAL } from './SymbolConstants';
import { ModuleBlock } from './SymbolConstants';
import { USE } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';
var SymbolTable = (function () {
    /**
     * @constructor
     * @param {string} fileName
     */
    function SymbolTable(fileName) {
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
    SymbolTable.prototype.enterBlock = function (name, blockType, ast, lineno) {
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
                this.addDef(arg.id, DEF_PARAM, arg.lineno);
            }
            else {
                // Tuple isn't supported
                throw syntaxError("invalid expression in parameter list", this.fileName);
            }
        }
    };
    SymbolTable.prototype.visitArguments = function (a, lineno) {
        if (a.args)
            this.visitParams(a.args, true);
        if (a.vararg) {
            this.addDef(a.vararg, DEF_PARAM, lineno);
            this.cur.varargs = true;
        }
        if (a.kwarg) {
            this.addDef(a.kwarg, DEF_PARAM, lineno);
            this.cur.varkeywords = true;
        }
    };
    /**
     * @param {number} lineno
     * @return {void}
     */
    SymbolTable.prototype.newTmpname = function (lineno) {
        this.addDef("_[" + (++this.tmpname) + "]", DEF_LOCAL, lineno);
    };
    /**
     * @param {string} name
     * @param {number} flag
     * @param {number} lineno
     * @return {void}
     */
    SymbolTable.prototype.addDef = function (name, flag, lineno) {
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
            if (fromGlobal !== undefined)
                val |= fromGlobal;
            this.global[mangled] = val;
        }
    };
    SymbolTable.prototype.visitSlice = function (s) {
        switch (s.constructor) {
            case Slice:
                if (s.lower)
                    this.visitExpr(s.lower);
                if (s.upper)
                    this.visitExpr(s.upper);
                if (s.step)
                    this.visitExpr(s.step);
                break;
            case ExtSlice:
                for (var i = 0; i < s.dims.length; ++i)
                    this.visitSlice(s.dims[i]);
                break;
            case Index:
                this.visitExpr(s.value);
                break;
            case Ellipsis:
                break;
        }
    };
    /**
     * @param {Object} s
     */
    SymbolTable.prototype.visitStmt = function (s) {
        assert(s !== undefined, "visitStmt called with undefined");
        switch (s.constructor) {
            case FunctionDef:
                this.addDef(s.name, DEF_LOCAL, s.lineno);
                if (s.args.defaults)
                    this.SEQExpr(s.args.defaults);
                if (s.decorator_list)
                    this.SEQExpr(s.decorator_list);
                this.enterBlock(s.name, FunctionBlock, s, s.lineno);
                this.visitArguments(s.args, s.lineno);
                this.SEQStmt(s.body);
                this.exitBlock();
                break;
            case ClassDef:
                this.addDef(s.name, DEF_LOCAL, s.lineno);
                this.SEQExpr(s.bases);
                if (s.decorator_list)
                    this.SEQExpr(s.decorator_list);
                this.enterBlock(s.name, ClassBlock, s, s.lineno);
                var tmp = this.curClass;
                this.curClass = s.name;
                this.SEQStmt(s.body);
                this.curClass = tmp;
                this.exitBlock();
                break;
            case ReturnStatement: {
                var rs = s;
                if (rs.value) {
                    this.visitExpr(rs.value);
                    this.cur.returnsValue = true;
                    if (this.cur.generator) {
                        throw syntaxError("'return' with argument inside generator", this.fileName);
                    }
                }
                break;
            }
            case DeleteExpression:
                this.SEQExpr(s.targets);
                break;
            case Assign:
                this.SEQExpr(s.targets);
                this.visitExpr(s.value);
                break;
            case AugAssign:
                this.visitExpr(s.target);
                this.visitExpr(s.value);
                break;
            case Print:
                if (s.dest)
                    this.visitExpr(s.dest);
                this.SEQExpr(s.values);
                break;
            case ForStatement: {
                var fs = s;
                this.visitExpr(fs.target);
                this.visitExpr(fs.iter);
                this.SEQStmt(fs.body);
                if (fs.orelse)
                    this.SEQStmt(fs.orelse);
                break;
            }
            case WhileStatement: {
                var ws = s;
                this.visitExpr(ws.test);
                this.SEQStmt(ws.body);
                if (ws.orelse)
                    this.SEQStmt(ws.orelse);
                break;
            }
            case IfStatement: {
                var ifs = s;
                this.visitExpr(ifs.test);
                this.SEQStmt(ifs.consequent);
                if (ifs.alternate) {
                    this.SEQStmt(ifs.alternate);
                }
                break;
            }
            case Raise:
                if (s.type) {
                    this.visitExpr(s.type);
                    if (s.inst) {
                        this.visitExpr(s.inst);
                        if (s.tback)
                            this.visitExpr(s.tback);
                    }
                }
                break;
            case TryExcept:
                this.SEQStmt(s.body);
                this.SEQStmt(s.orelse);
                this.visitExcepthandlers(s.handlers);
                break;
            case TryFinally:
                this.SEQStmt(s.body);
                this.SEQStmt(s.finalbody);
                break;
            case Assert:
                this.visitExpr(s.test);
                if (s.msg)
                    this.visitExpr(s.msg);
                break;
            case ImportStatement: {
                var imps = s;
                this.visitAlias(imps.names, imps.lineno);
                break;
            }
            case ImportFrom: {
                var impFrom = s;
                this.visitAlias(impFrom.names, impFrom.lineno);
                break;
            }
            case Exec:
                this.visitExpr(s.body);
                if (s.globals) {
                    this.visitExpr(s.globals);
                    if (s.locals)
                        this.visitExpr(s.locals);
                }
                break;
            case Global:
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
                break;
            case Expr:
                this.visitExpr(s.value);
                break;
            case Pass:
            case BreakStatement:
            case ContinueStatement:
                // nothing
                break;
            case WithStatement: {
                var ws = s;
                this.newTmpname(ws.lineno);
                this.visitExpr(ws.context_expr);
                if (ws.optional_vars) {
                    this.newTmpname(ws.lineno);
                    this.visitExpr(ws.optional_vars);
                }
                this.SEQStmt(ws.body);
                break;
            }
            default:
                fail("Unhandled type " + s.constructor.name + " in visitStmt");
        }
    };
    SymbolTable.prototype.visitExpr = function (e) {
        assert(e !== undefined, "visitExpr called with undefined");
        // print("  e: ", e.constructor.name);
        switch (e.constructor) {
            case BoolOp:
                this.SEQExpr(e.values);
                break;
            case BinOp:
                this.visitExpr(e.left);
                this.visitExpr(e.right);
                break;
            case UnaryOp:
                this.visitExpr(e.operand);
                break;
            case Lambda:
                this.addDef("lambda", DEF_LOCAL, e.lineno);
                if (e.args.defaults)
                    this.SEQExpr(e.args.defaults);
                this.enterBlock("lambda", FunctionBlock, e, e.lineno);
                this.visitArguments(e.args, e.lineno);
                this.visitExpr(e.body);
                this.exitBlock();
                break;
            case IfExp:
                this.visitExpr(e.test);
                this.visitExpr(e.body);
                this.visitExpr(e.orelse);
                break;
            case Dict:
                this.SEQExpr(e.keys);
                this.SEQExpr(e.values);
                break;
            case ListComp:
                this.newTmpname(e.lineno);
                this.visitExpr(e.elt);
                this.visitComprehension(e.generators, 0);
                break;
            case GeneratorExp:
                this.visitGenexp(e);
                break;
            case Yield:
                if (e.value)
                    this.visitExpr(e.value);
                this.cur.generator = true;
                if (this.cur.returnsValue) {
                    throw syntaxError("'return' with argument inside generator", this.fileName);
                }
                break;
            case Compare:
                this.visitExpr(e.left);
                this.SEQExpr(e.comparators);
                break;
            case Call:
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
                break;
            case Num:
            case Str:
                break;
            case Attribute:
                this.visitExpr(e.value);
                break;
            case Subscript:
                this.visitExpr(e.value);
                this.visitSlice(e.slice);
                break;
            case Name:
                this.addDef(e.id, e.ctx === Load ? USE : DEF_LOCAL, e.lineno);
                break;
            case List:
            case Tuple:
                this.SEQExpr(e.elts);
                break;
            default:
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
     * @param {Array.<Object>} names
     * @param {number} lineno
     */
    SymbolTable.prototype.visitAlias = function (names, lineno) {
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
    };
    /**
     * @param {Object} e
     */
    SymbolTable.prototype.visitGenexp = function (e) {
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
    };
    SymbolTable.prototype.visitExcepthandlers = function (handlers) {
        for (var i = 0, eh; eh = handlers[i]; ++i) {
            if (eh.type)
                this.visitExpr(eh.type);
            if (eh.name)
                this.visitExpr(eh.name);
            this.SEQStmt(eh.body);
        }
    };
    /**
     * @param {SymbolTableScope} ste The Symbol Table Scope.
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
        for (var name_1 in ste.symFlags) {
            if (ste.symFlags.hasOwnProperty(name_1)) {
                var flags = ste.symFlags[name_1];
                this.analyzeName(ste, scope, name_1, flags, bound, local, free, global);
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
        for (var name_2 in scope) {
            if (scope.hasOwnProperty(name_2)) {
                var flags = scope[name_2];
                if (flags !== LOCAL)
                    continue;
                if (free[name_2] === undefined)
                    continue;
                scope[name_2] = CELL;
                delete free[name_2];
            }
        }
    };
    /**
     * store scope info back into the st symbols dict. symbols is modified,
     * others are not.
     */
    SymbolTable.prototype.updateSymbols = function (symbols, scope, bound, free, classflag) {
        for (var name_3 in symbols) {
            if (symbols.hasOwnProperty(name_3)) {
                var flags = symbols[name_3];
                var w = scope[name_3];
                flags |= w << SCOPE_OFF;
                symbols[name_3] = flags;
            }
        }
        var freeValue = FREE << SCOPE_OFF;
        for (var name_4 in free) {
            if (free.hasOwnProperty(name_4)) {
                var o = symbols[name_4];
                if (o !== undefined) {
                    // it could be a free variable in a method of the class that has
                    // the same name as a local or global in the class scope
                    if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                        var i = o | DEF_FREE_CLASS;
                        symbols[name_4] = i;
                    }
                    // else it's not free, probably a cell
                    continue;
                }
                if (bound[name_4] === undefined)
                    continue;
                symbols[name_4] = freeValue;
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
                throw syntaxError("name '" + name + "' is local and global", this.fileName, ste.lineno);
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
export default SymbolTable;
