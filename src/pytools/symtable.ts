import {assert, fail} from './asserts';

import {Assert} from './astnodes';
import {Assign} from './astnodes';
import {Attribute} from './astnodes';
import {AugAssign} from './astnodes';
import {BinOp} from './astnodes';
import {BoolOp} from './astnodes';
import {Break_} from './astnodes';
import {Call} from './astnodes';
import {ClassDef} from './astnodes';
import {Compare} from './astnodes';
import {Continue_} from './astnodes';
import {Delete_} from './astnodes';
import {Dict} from './astnodes';
import {Ellipsis} from './astnodes';
import {Exec} from './astnodes';
import {Expr} from './astnodes';
import {ExtSlice} from './astnodes';
import {For_} from './astnodes';
import {FunctionDef} from './astnodes';
import {GeneratorExp} from './astnodes';
import {Global} from './astnodes';
import {If_} from './astnodes';
import {IfExp} from './astnodes';
import {Import_} from './astnodes';
import {ImportFrom} from './astnodes';
import {Index} from './astnodes';
import {Lambda} from './astnodes';
import {Load} from './astnodes';
import {List} from './astnodes';
import {ListComp} from './astnodes';
import {Name} from './astnodes';
import {Num} from './astnodes';
import {Param} from './astnodes';
import {Pass} from './astnodes';
import {Print} from './astnodes';
import {Raise} from './astnodes';
import {Return_} from './astnodes';
import {Slice} from './astnodes';
import {Store} from './astnodes';
import {Str} from './astnodes';
import {Subscript} from './astnodes';
import {TryExcept} from './astnodes';
import {TryFinally} from './astnodes';
import {Tuple} from './astnodes';
import {UnaryOp} from './astnodes';
import {While_} from './astnodes';
import {With_} from './astnodes';
import {Yield} from './astnodes';


import {isDef, isNumber, isString} from './base';
import Symbol from './Symbol';
import SymbolTableScope from './SymbolTableScope';

import {CELL} from './SymbolConstants';
import {ClassBlock} from './SymbolConstants';
import {DEF_BOUND} from './SymbolConstants';
import {DEF_FREE_CLASS} from './SymbolConstants';
import {DEF_GLOBAL} from './SymbolConstants';
import {DEF_IMPORT} from './SymbolConstants';
import {DEF_LOCAL} from './SymbolConstants';
import {DEF_PARAM} from './SymbolConstants';
import {FREE} from './SymbolConstants';
import {FunctionBlock} from './SymbolConstants';
import {GLOBAL_EXPLICIT} from './SymbolConstants';
import {GLOBAL_IMPLICIT} from './SymbolConstants';
import {LOCAL} from './SymbolConstants';
import {ModuleBlock} from './SymbolConstants';
import {USE} from './SymbolConstants';
import {SCOPE_OFF} from './SymbolConstants';

/**
 * @param {string} message
 * @param {string} fileName
 * @param {number=} lineNumber
 */
function syntaxError(message: string, fileName: string, lineNumber?: number) {
    assert(isString(message), "message must be a string");
    assert(isString(fileName), "fileName must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message/*, fileName*/);
    e['fileName'] = fileName;
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}

/**
 * @param {string|null} priv
 * @param {string} name
 */
function mangleName(priv, name) {
    var strpriv = null;

    if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_')
        return name;
    // don't mangle __id__
    if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_')
        return name;
    // don't mangle classes that are all _ (obscure much?)
    strpriv = priv;
    strpriv.replace(/_/g, '');
    if (strpriv === '')
        return name;

    strpriv = priv;
    strpriv.replace(/^_*/, '');
    strpriv = '_' + strpriv + name;
    return strpriv;
}

class SymbolTable {
    fileName
    cur
    top
    stack
    global
    curClass
    tmpname: number;
    stss
    /**
     * @constructor
     * @param {string} fileName
     */
    constructor(fileName) {
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
    getStsForAst(ast) {
        assert(ast.scopeId !== undefined, "ast wasn't added to st?");
        var v = this.stss[ast.scopeId];
        assert(v !== undefined, "unknown sym tab entry");
        return v;
    }

    SEQStmt(nodes) {
        var len = nodes.length;
        for (var i = 0; i < len; ++i) {
            var val = nodes[i];
            if (val) this.visitStmt(val);
        }
    }

    SEQExpr(nodes) {
        var len = nodes.length;
        for (var i = 0; i < len; ++i) {
            var val = nodes[i];
            if (val) this.visitExpr(val);
        }
    }

    enterBlock(name, blockType, ast, lineno) {
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
        //print("exitBlock");
        this.cur = null;
        if (this.stack.length > 0)
            this.cur = this.stack.pop();
    }

    visitParams(args, toplevel) {
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

    visitArguments(a, lineno) {
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
     */
    newTmpname(lineno) {
        this.addDef("_[" + (++this.tmpname) + "]", DEF_LOCAL, lineno);
    }

    /**
     * @param {string} name
     * @param {number} flag
     * @param {number} lineno
     */
    addDef(name, flag, lineno) {
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

    visitSlice(s) {
        switch (s.constructor) {
            case Slice:
                if (s.lower) this.visitExpr(s.lower);
                if (s.upper) this.visitExpr(s.upper);
                if (s.step) this.visitExpr(s.step);
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
    }

    /**
     * @param {Object} s
     */
    visitStmt(s) {
        assert(s !== undefined, "visitStmt called with undefined");
        switch (s.constructor) {
            case FunctionDef:
                this.addDef(s.name, DEF_LOCAL, s.lineno);
                if (s.args.defaults) this.SEQExpr(s.args.defaults);
                if (s.decorator_list) this.SEQExpr(s.decorator_list);
                this.enterBlock(s.name, FunctionBlock, s, s.lineno);
                this.visitArguments(s.args, s.lineno);
                this.SEQStmt(s.body);
                this.exitBlock();
                break;
            case ClassDef:
                this.addDef(s.name, DEF_LOCAL, s.lineno);
                this.SEQExpr(s.bases);
                if (s.decorator_list) this.SEQExpr(s.decorator_list);
                this.enterBlock(s.name, ClassBlock, s, s.lineno);
                var tmp = this.curClass;
                this.curClass = s.name;
                this.SEQStmt(s.body);
                this.curClass = tmp;
                this.exitBlock();
                break;
            case Return_:
                if (s.value) {
                    this.visitExpr(s.value);
                    this.cur.returnsValue = true;
                    if (this.cur.generator) {
                        throw syntaxError("'return' with argument inside generator", this.fileName);
                    }
                }
                break;
            case Delete_:
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
                if (s.dest) this.visitExpr(s.dest);
                this.SEQExpr(s.values);
                break;
            case For_:
                this.visitExpr(s.target);
                this.visitExpr(s.iter);
                this.SEQStmt(s.body);
                if (s.orelse) this.SEQStmt(s.orelse);
                break;
            case While_:
                this.visitExpr(s.test);
                this.SEQStmt(s.body);
                if (s.orelse) this.SEQStmt(s.orelse);
                break;
            case If_:
                this.visitExpr(s.test);
                this.SEQStmt(s.body);
                if (s.orelse)
                    this.SEQStmt(s.orelse);
                break;
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
                if (s.msg) this.visitExpr(s.msg);
                break;
            case Import_:
            case ImportFrom:
                this.visitAlias(s.names, s.lineno);
                break;
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
            case Break_:
            case Continue_:
                // nothing
                break;
            case With_:
                this.newTmpname(s.lineno);
                this.visitExpr(s.context_expr);
                if (s.optional_vars) {
                    this.newTmpname(s.lineno);
                    this.visitExpr(s.optional_vars);
                }
                this.SEQStmt(s.body);
                break;

            default:
                fail("Unhandled type " + s.constructor.name + " in visitStmt");
        }
    }

    visitExpr = function(e) {
        assert(e !== undefined, "visitExpr called with undefined");
        //print("  e: ", e.constructor.name);
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
                if (e.value) this.visitExpr(e.value);
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
                //print(JSON.stringify(e.starargs, null, 2));
                //print(JSON.stringify(e.kwargs, null,2));
                if (e.starargs) this.visitExpr(e.starargs);
                if (e.kwargs) this.visitExpr(e.kwargs);
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

    visitComprehension = function(lcs, startAt) {
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
    visitAlias = function(names, lineno) {
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
    visitGenexp = function(e) {
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

    visitExcepthandlers = function(handlers) {
        for (var i = 0, eh; eh = handlers[i]; ++i) {
            if (eh.type) this.visitExpr(eh.type);
            if (eh.name) this.visitExpr(eh.name);
            this.SEQStmt(eh.body);
        }
    };

    /**
     * @param {Object} ste The Symbol Table Scope.
     */
    analyzeBlock = function(ste, bound, free, global) {
        var local = {};
        var scope = {};
        var newglobal = {};
        var newbound = {};
        var newfree = {};

        if (ste.blockType == ClassBlock) {
            _dictUpdate(newglobal, global);
            if (bound)
                _dictUpdate(newbound, bound);
        }

        for (var name in ste.symFlags) {
            var flags = ste.symFlags[name];
            this.analyzeName(ste, scope, name, flags, bound, local, free, global);
        }

        if (ste.blockType !== ClassBlock) {
            if (ste.blockType === FunctionBlock)
                _dictUpdate(newbound, local);
            if (bound)
                _dictUpdate(newbound, bound);
            _dictUpdate(newglobal, global);
        }

        var allfree = {};
        var childlen = ste.children.length;
        for (var i = 0; i < childlen; ++i) {
            var c = ste.children[i];
            this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
            if (c.hasFree || c.childHasFree)
                ste.childHasFree = true;
        }

        _dictUpdate(newfree, allfree);
        if (ste.blockType === FunctionBlock) this.analyzeCells(scope, newfree);
        this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);

        _dictUpdate(free, newfree);
    };

    analyzeChildBlock = function(entry, bound, free, global, childFree) {
        var tempBound = {};
        _dictUpdate(tempBound, bound);
        var tempFree = {};
        _dictUpdate(tempFree, free);
        var tempGlobal = {};
        _dictUpdate(tempGlobal, global);

        this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
        _dictUpdate(childFree, tempFree);
    };

    analyzeCells = function(scope, free) {
        for (var name in scope) {
            var flags = scope[name];
            if (flags !== LOCAL) continue;
            if (free[name] === undefined) continue;
            scope[name] = CELL;
            delete free[name];
        }
    };

    /**
     * store scope info back into the st symbols dict. symbols is modified,
     * others are not.
     */
    updateSymbols = function(symbols, scope, bound, free, classflag) {
        for (var name in symbols) {
            var flags = symbols[name];
            var w = scope[name];
            flags |= w << SCOPE_OFF;
            symbols[name] = flags;
        }

        var freeValue = FREE << SCOPE_OFF;
        var pos = 0;
        for (var name in free) {
            var o = symbols[name];
            if (o !== undefined) {
                // it could be a free variable in a method of the class that has
                // the same name as a local or global in the class scope
                if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                    var i = o | DEF_FREE_CLASS;
                    symbols[name] = i;
                }
                // else it's not free, probably a cell
                continue;
            }
            if (bound[name] === undefined) continue;
            symbols[name] = freeValue;
        }
    };

    /**
     * @param {Object} ste The Symbol Table Scope.
     * @param {string} name
     */
    analyzeName = function(ste, dict, name, flags, bound, local, free, global) {
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
    };

    analyze = function() {
        var free = {};
        var global = {};
        this.analyzeBlock(this.top, null, free, global);
    };

}

function _dictUpdate(a, b) {
    for (var kb in b) {
        a[kb] = b[kb];
    }
}

/**
 * @param {Object} ast
 * @param {string} fileName
 */
var symbolTable = function(ast, fileName) {
    var ret = new SymbolTable(fileName);

    ret.enterBlock("top", ModuleBlock, ast, 0);
    ret.top = ret.cur;

    //print(Sk.astDump(ast));
    for (var i = 0; i < ast.body.length; ++i)
        ret.visitStmt(ast.body[i]);

    ret.exitBlock();

    ret.analyze();

    return ret;
};

var dumpSymbolTable = function(st) {
    var pyBoolStr = function(b) {
        return b ? "True" : "False";
    };
    var pyList = function(l) {
        var ret = [];
        for (var i = 0; i < l.length; ++i) {
            // TODO: Originally, this computed the Python repr().
            ret.push(l[i]);
        }
        return '[' + ret.join(', ') + ']';
    };
    var getIdents = function(obj, indent) {
        if (indent === undefined) indent = "";
        var ret = "";
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
        var objidents = obj.get_identifiers();
        var objidentslen = objidents.length;
        for (var i = 0; i < objidentslen; ++i) {
            var info = obj.lookup(objidents[i]);
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
            var nss = info.get_namespaces();
            var nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            var sub = [];
            for (var j = 0; j < nsslen; ++j) {
                var ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join('\n');
            ret += indent + '  ]\n';
        }
        return ret;
    };
    return getIdents(st.top, '');
};

const that =
    {
        symbolTable: symbolTable,
        mangleName: mangleName,
        LOCAL: LOCAL,
        GLOBAL_EXPLICIT: GLOBAL_EXPLICIT,
        GLOBAL_IMPLICIT: GLOBAL_IMPLICIT,
        FREE: FREE,
        CELL: CELL,
        FunctionBlock: FunctionBlock,
        dumpSymbolTable: dumpSymbolTable
    };
export default that;

