"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("./asserts");
var dictUpdate_1 = require("./dictUpdate");
var mangleName_1 = require("./mangleName");
var SymbolTableScope_1 = require("./SymbolTableScope");
var syntaxError_1 = require("./syntaxError");
var types_1 = require("./types");
var types_2 = require("./types");
var types_3 = require("./types");
var types_4 = require("./types");
var types_5 = require("./types");
var types_6 = require("./types");
var types_7 = require("./types");
var types_8 = require("./types");
var types_9 = require("./types");
var types_10 = require("./types");
var types_11 = require("./types");
var types_12 = require("./types");
var types_13 = require("./types");
var types_14 = require("./types");
var types_15 = require("./types");
var types_16 = require("./types");
var types_17 = require("./types");
var types_18 = require("./types");
var types_19 = require("./types");
var types_20 = require("./types");
var types_21 = require("./types");
var types_22 = require("./types");
var types_23 = require("./types");
var types_24 = require("./types");
var types_25 = require("./types");
var types_26 = require("./types");
var types_27 = require("./types");
var types_28 = require("./types");
var types_29 = require("./types");
var types_30 = require("./types");
var types_31 = require("./types");
var types_32 = require("./types");
var types_33 = require("./types");
var types_34 = require("./types");
var types_35 = require("./types");
var types_36 = require("./types");
var types_37 = require("./types");
var types_38 = require("./types");
var types_39 = require("./types");
var types_40 = require("./types");
var types_41 = require("./types");
var types_42 = require("./types");
var types_43 = require("./types");
var types_44 = require("./types");
var types_45 = require("./types");
var types_46 = require("./types");
var types_47 = require("./types");
var types_48 = require("./types");
var SymbolConstants_1 = require("./SymbolConstants");
var SymbolConstants_2 = require("./SymbolConstants");
var SymbolConstants_3 = require("./SymbolConstants");
var SymbolConstants_4 = require("./SymbolConstants");
var SymbolConstants_5 = require("./SymbolConstants");
var SymbolConstants_6 = require("./SymbolConstants");
var SymbolConstants_7 = require("./SymbolConstants");
var SymbolConstants_8 = require("./SymbolConstants");
var SymbolConstants_9 = require("./SymbolConstants");
var SymbolConstants_10 = require("./SymbolConstants");
var SymbolConstants_11 = require("./SymbolConstants");
var SymbolConstants_12 = require("./SymbolConstants");
var SymbolConstants_13 = require("./SymbolConstants");
var SymbolConstants_14 = require("./SymbolConstants");
var SymbolConstants_15 = require("./SymbolConstants");
var SymbolConstants_16 = require("./SymbolConstants");
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
        be.left.accept(this);
        be.right.accept(this);
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
        this.st.addDef(cd.name, SymbolConstants_7.DEF_LOCAL, cd.lineno);
        this.st.SEQExpr(cd.bases);
        if (cd.decorator_list)
            this.st.SEQExpr(cd.decorator_list);
        this.st.enterBlock(cd.name, SymbolConstants_2.ClassBlock, cd, cd.lineno);
        var tmp = this.st.curClass;
        this.st.curClass = cd.name;
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
        this.st.addDef(fd.name, SymbolConstants_7.DEF_LOCAL, fd.lineno);
        if (fd.args.defaults)
            this.st.SEQExpr(fd.args.defaults);
        if (fd.decorator_list)
            this.st.SEQExpr(fd.decorator_list);
        this.st.enterBlock(fd.name, SymbolConstants_10.FunctionBlock, fd, fd.lineno);
        this.st.visitArguments(fd.args, fd.lineno);
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
        this.st.visitAlias(importFrom.names, importFrom.lineno);
    };
    SemanticVisitor.prototype.list = function (list) {
        this.st.SEQExpr(list.elts);
    };
    SemanticVisitor.prototype.module = function (module) {
        throw new Error("module");
    };
    SemanticVisitor.prototype.name = function (name) {
        this.st.addDef(name.id, name.ctx === types_28.Load ? SymbolConstants_15.USE : SymbolConstants_7.DEF_LOCAL, name.lineno);
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
                throw syntaxError_1.syntaxError("'return' with argument inside generator");
            }
        }
    };
    SemanticVisitor.prototype.str = function (str) {
        // Do nothing, unless we are doing type inference.
    };
    return SemanticVisitor;
}());
exports.SemanticVisitor = SemanticVisitor;
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
        asserts_1.assert(ast.scopeId !== undefined, "ast wasn't added to st?");
        var v = this.stss[ast.scopeId];
        asserts_1.assert(v !== undefined, "unknown sym tab entry");
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
    SymbolTable.prototype.enterBlock = function (name, blockType, astNode, lineno) {
        //  name = fixReservedNames(name);
        var prev = null;
        if (this.cur) {
            prev = this.cur;
            this.stack.push(this.cur);
        }
        this.cur = new SymbolTableScope_1.SymbolTableScope(this, name, blockType, astNode, lineno);
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
            if (arg.constructor === types_31.Name) {
                asserts_1.assert(arg.ctx === types_33.Param || (arg.ctx === types_39.Store && !toplevel));
                this.addDef(arg.id, SymbolConstants_8.DEF_PARAM, arg.lineno);
            }
            else {
                // Tuple isn't supported
                throw syntaxError_1.syntaxError("invalid expression in parameter list");
            }
        }
    };
    SymbolTable.prototype.visitArguments = function (a, lineno) {
        if (a.args)
            this.visitParams(a.args, true);
        if (a.vararg) {
            this.addDef(a.vararg, SymbolConstants_8.DEF_PARAM, lineno);
            this.cur.varargs = true;
        }
        if (a.kwarg) {
            this.addDef(a.kwarg, SymbolConstants_8.DEF_PARAM, lineno);
            this.cur.varkeywords = true;
        }
    };
    /**
     * @param {number} lineno
     * @return {void}
     */
    SymbolTable.prototype.newTmpname = function (lineno) {
        this.addDef("_[" + (++this.tmpname) + "]", SymbolConstants_7.DEF_LOCAL, lineno);
    };
    /**
     * 1. Modifies symbol flags for the current scope.
     * 2.a Adds a variable name for the current scope, OR
     * 2.b Sets the SymbolFlags for a global variable.
     * @param name
     * @param flags
     * @param lineno
     */
    SymbolTable.prototype.addDef = function (name, flags, lineno) {
        var mangled = mangleName_1.mangleName(this.curClass, name);
        //  mangled = fixReservedNames(mangled);
        // Modify symbol flags for the current scope.
        var val = this.cur.symFlags[mangled];
        if (val !== undefined) {
            if ((flags & SymbolConstants_8.DEF_PARAM) && (val & SymbolConstants_8.DEF_PARAM)) {
                throw syntaxError_1.syntaxError("duplicate argument '" + name + "' in function definition", lineno);
            }
            val |= flags;
        }
        else {
            val = flags;
        }
        this.cur.symFlags[mangled] = val;
        if (flags & SymbolConstants_8.DEF_PARAM) {
            this.cur.varnames.push(mangled);
        }
        else if (flags & SymbolConstants_5.DEF_GLOBAL) {
            val = flags;
            var fromGlobal = this.global[mangled];
            if (fromGlobal !== undefined)
                val |= fromGlobal;
            this.global[mangled] = val;
        }
    };
    SymbolTable.prototype.visitSlice = function (s) {
        if (s instanceof types_38.Slice) {
            if (s.lower)
                this.visitExpr(s.lower);
            if (s.upper)
                this.visitExpr(s.upper);
            if (s.step)
                this.visitExpr(s.step);
        }
        else if (s instanceof types_17.ExtSlice) {
            for (var i = 0; i < s.dims.length; ++i) {
                this.visitSlice(s.dims[i]);
            }
        }
        else if (s instanceof types_26.Index) {
            this.visitExpr(s.value);
        }
        else if (s instanceof types_14.Ellipsis) {
            // Do nothing.
        }
    };
    /**
     *
     */
    SymbolTable.prototype.visitStmt = function (s) {
        asserts_1.assert(s !== undefined, "visitStmt called with undefined");
        if (s instanceof types_19.FunctionDef) {
            this.addDef(s.name, SymbolConstants_7.DEF_LOCAL, s.lineno);
            if (s.args.defaults)
                this.SEQExpr(s.args.defaults);
            if (s.decorator_list)
                this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name, SymbolConstants_10.FunctionBlock, s, s.lineno);
            this.visitArguments(s.args, s.lineno);
            this.SEQStmt(s.body);
            this.exitBlock();
        }
        else if (s instanceof types_9.ClassDef) {
            this.addDef(s.name, SymbolConstants_7.DEF_LOCAL, s.lineno);
            this.SEQExpr(s.bases);
            if (s.decorator_list)
                this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name, SymbolConstants_2.ClassBlock, s, s.lineno);
            var tmp = this.curClass;
            this.curClass = s.name;
            this.SEQStmt(s.body);
            this.curClass = tmp;
            this.exitBlock();
        }
        else if (s instanceof types_37.ReturnStatement) {
            if (s.value) {
                this.visitExpr(s.value);
                this.cur.returnsValue = true;
                if (this.cur.generator) {
                    throw syntaxError_1.syntaxError("'return' with argument inside generator");
                }
            }
        }
        else if (s instanceof types_12.DeleteStatement) {
            this.SEQExpr(s.targets);
        }
        else if (s instanceof types_2.Assign) {
            this.SEQExpr(s.targets);
            this.visitExpr(s.value);
        }
        else if (s instanceof types_4.AugAssign) {
            this.visitExpr(s.target);
            this.visitExpr(s.value);
        }
        else if (s instanceof types_35.Print) {
            if (s.dest)
                this.visitExpr(s.dest);
            this.SEQExpr(s.values);
        }
        else if (s instanceof types_18.ForStatement) {
            this.visitExpr(s.target);
            this.visitExpr(s.iter);
            this.SEQStmt(s.body);
            if (s.orelse)
                this.SEQStmt(s.orelse);
        }
        else if (s instanceof types_46.WhileStatement) {
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse)
                this.SEQStmt(s.orelse);
        }
        else if (s instanceof types_22.IfStatement) {
            this.visitExpr(s.test);
            this.SEQStmt(s.consequent);
            if (s.alternate) {
                this.SEQStmt(s.alternate);
            }
        }
        else if (s instanceof types_36.Raise) {
            if (s.type) {
                this.visitExpr(s.type);
                if (s.inst) {
                    this.visitExpr(s.inst);
                    if (s.tback)
                        this.visitExpr(s.tback);
                }
            }
        }
        else if (s instanceof types_42.TryExcept) {
            this.SEQStmt(s.body);
            this.SEQStmt(s.orelse);
            this.visitExcepthandlers(s.handlers);
        }
        else if (s instanceof types_43.TryFinally) {
            this.SEQStmt(s.body);
            this.SEQStmt(s.finalbody);
        }
        else if (s instanceof types_1.Assert) {
            this.visitExpr(s.test);
            if (s.msg)
                this.visitExpr(s.msg);
        }
        else if (s instanceof types_24.ImportStatement) {
            var imps = s;
            this.visitAlias(imps.names, imps.lineno);
        }
        else if (s instanceof types_25.ImportFrom) {
            var impFrom = s;
            this.visitAlias(impFrom.names, impFrom.lineno);
        }
        else if (s instanceof types_15.Exec) {
            this.visitExpr(s.body);
            if (s.globals) {
                this.visitExpr(s.globals);
                if (s.locals)
                    this.visitExpr(s.locals);
            }
        }
        else if (s instanceof types_21.Global) {
            var nameslen = s.names.length;
            for (var i = 0; i < nameslen; ++i) {
                var name_1 = mangleName_1.mangleName(this.curClass, s.names[i]);
                //              name = fixReservedNames(name);
                var cur = this.cur.symFlags[name_1];
                if (cur & (SymbolConstants_7.DEF_LOCAL | SymbolConstants_15.USE)) {
                    if (cur & SymbolConstants_7.DEF_LOCAL) {
                        throw syntaxError_1.syntaxError("name '" + name_1 + "' is assigned to before global declaration", s.lineno);
                    }
                    else {
                        throw syntaxError_1.syntaxError("name '" + name_1 + "' is used prior to global declaration", s.lineno);
                    }
                }
                this.addDef(name_1, SymbolConstants_5.DEF_GLOBAL, s.lineno);
            }
        }
        else if (s instanceof types_16.ExpressionStatement) {
            this.visitExpr(s.value);
        }
        else if (s instanceof types_34.Pass || s instanceof types_7.BreakStatement || s instanceof types_11.ContinueStatement) {
            // Do nothing.
        }
        else if (s instanceof types_47.WithStatement) {
            var ws = s;
            this.newTmpname(ws.lineno);
            this.visitExpr(ws.context_expr);
            if (ws.optional_vars) {
                this.newTmpname(ws.lineno);
                this.visitExpr(ws.optional_vars);
            }
            this.SEQStmt(ws.body);
        }
        else {
            asserts_1.fail("Unhandled type " + s.constructor.name + " in visitStmt");
        }
    };
    SymbolTable.prototype.visitExpr = function (e) {
        asserts_1.assert(e !== undefined, "visitExpr called with undefined");
        if (e instanceof types_6.BoolOp) {
            this.SEQExpr(e.values);
        }
        else if (e instanceof types_5.BinOp) {
            this.visitExpr(e.left);
            this.visitExpr(e.right);
        }
        else if (e instanceof types_45.UnaryOp) {
            this.visitExpr(e.operand);
        }
        else if (e instanceof types_27.Lambda) {
            this.addDef("lambda", SymbolConstants_7.DEF_LOCAL, e.lineno);
            if (e.args.defaults)
                this.SEQExpr(e.args.defaults);
            this.enterBlock("lambda", SymbolConstants_10.FunctionBlock, e, e.lineno);
            this.visitArguments(e.args, e.lineno);
            this.visitExpr(e.body);
            this.exitBlock();
        }
        else if (e instanceof types_23.IfExp) {
            this.visitExpr(e.test);
            this.visitExpr(e.body);
            this.visitExpr(e.orelse);
        }
        else if (e instanceof types_13.Dict) {
            this.SEQExpr(e.keys);
            this.SEQExpr(e.values);
        }
        else if (e instanceof types_30.ListComp) {
            this.newTmpname(e.lineno);
            this.visitExpr(e.elt);
            this.visitComprehension(e.generators, 0);
        }
        else if (e instanceof types_20.GeneratorExp) {
            this.visitGenexp(e);
        }
        else if (e instanceof types_48.Yield) {
            if (e.value)
                this.visitExpr(e.value);
            this.cur.generator = true;
            if (this.cur.returnsValue) {
                throw syntaxError_1.syntaxError("'return' with argument inside generator");
            }
        }
        else if (e instanceof types_10.Compare) {
            this.visitExpr(e.left);
            this.SEQExpr(e.comparators);
        }
        else if (e instanceof types_8.Call) {
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
        else if (e instanceof types_32.Num || e instanceof types_40.Str) {
            // Do nothing.
        }
        else if (e instanceof types_3.Attribute) {
            this.visitExpr(e.value);
        }
        else if (e instanceof types_41.Subscript) {
            this.visitExpr(e.value);
            this.visitSlice(e.slice);
        }
        else if (e instanceof types_31.Name) {
            this.addDef(e.id, e.ctx === types_28.Load ? SymbolConstants_15.USE : SymbolConstants_7.DEF_LOCAL, e.lineno);
        }
        else if (e instanceof types_29.List || e instanceof types_44.Tuple) {
            this.SEQExpr(e.elts);
        }
        else {
            asserts_1.fail("Unhandled type " + e.constructor.name + " in visitExpr");
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
            var name_2 = a.asname === null ? a.name : a.asname;
            var storename = name_2;
            var dot = name_2.indexOf('.');
            if (dot !== -1)
                storename = name_2.substr(0, dot);
            if (name_2 !== "*") {
                this.addDef(storename, SymbolConstants_6.DEF_IMPORT, lineno);
            }
            else {
                if (this.cur.blockType !== SymbolConstants_14.ModuleBlock) {
                    throw syntaxError_1.syntaxError("import * only allowed at module level");
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
        this.enterBlock("genexpr", SymbolConstants_10.FunctionBlock, e, e.lineno);
        this.cur.generator = true;
        this.addDef(".0", SymbolConstants_8.DEF_PARAM, e.lineno);
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
        if (ste.blockType === SymbolConstants_2.ClassBlock) {
            dictUpdate_1.dictUpdate(newglobal, global);
            if (bound)
                dictUpdate_1.dictUpdate(newbound, bound);
        }
        for (var name_3 in ste.symFlags) {
            if (ste.symFlags.hasOwnProperty(name_3)) {
                var flags = ste.symFlags[name_3];
                this.analyzeName(ste, scope, name_3, flags, bound, local, free, global);
            }
        }
        if (ste.blockType !== SymbolConstants_2.ClassBlock) {
            if (ste.blockType === SymbolConstants_10.FunctionBlock)
                dictUpdate_1.dictUpdate(newbound, local);
            if (bound)
                dictUpdate_1.dictUpdate(newbound, bound);
            dictUpdate_1.dictUpdate(newglobal, global);
        }
        var allfree = {};
        var childlen = ste.children.length;
        for (var i = 0; i < childlen; ++i) {
            var c = ste.children[i];
            this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
            if (c.hasFree || c.childHasFree)
                ste.childHasFree = true;
        }
        dictUpdate_1.dictUpdate(newfree, allfree);
        if (ste.blockType === SymbolConstants_10.FunctionBlock)
            this.analyzeCells(scope, newfree);
        this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === SymbolConstants_2.ClassBlock);
        dictUpdate_1.dictUpdate(free, newfree);
    };
    SymbolTable.prototype.analyzeChildBlock = function (entry, bound, free, global, childFree) {
        var tempBound = {};
        dictUpdate_1.dictUpdate(tempBound, bound);
        var tempFree = {};
        dictUpdate_1.dictUpdate(tempFree, free);
        var tempGlobal = {};
        dictUpdate_1.dictUpdate(tempGlobal, global);
        this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
        dictUpdate_1.dictUpdate(childFree, tempFree);
    };
    SymbolTable.prototype.analyzeCells = function (scope, free) {
        for (var name_4 in scope) {
            if (scope.hasOwnProperty(name_4)) {
                var flags = scope[name_4];
                if (flags !== SymbolConstants_13.LOCAL)
                    continue;
                if (free[name_4] === undefined)
                    continue;
                scope[name_4] = SymbolConstants_1.CELL;
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
                flags |= w << SymbolConstants_16.SCOPE_OFF;
                symbols[name_5] = flags;
            }
        }
        var freeValue = SymbolConstants_9.FREE << SymbolConstants_16.SCOPE_OFF;
        for (var name_6 in free) {
            if (free.hasOwnProperty(name_6)) {
                var o = symbols[name_6];
                if (o !== undefined) {
                    // it could be a free variable in a method of the class that has
                    // the same name as a local or global in the class scope
                    if (classflag && (o & (SymbolConstants_3.DEF_BOUND | SymbolConstants_5.DEF_GLOBAL))) {
                        var i = o | SymbolConstants_4.DEF_FREE_CLASS;
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
        if (flags & SymbolConstants_5.DEF_GLOBAL) {
            if (flags & SymbolConstants_8.DEF_PARAM)
                throw syntaxError_1.syntaxError("name '" + name + "' is local and global", ste.lineno);
            dict[name] = SymbolConstants_11.GLOBAL_EXPLICIT;
            global[name] = null;
            if (bound && bound[name] !== undefined)
                delete bound[name];
            return;
        }
        if (flags & SymbolConstants_3.DEF_BOUND) {
            dict[name] = SymbolConstants_13.LOCAL;
            local[name] = null;
            delete global[name];
            return;
        }
        if (bound && bound[name] !== undefined) {
            dict[name] = SymbolConstants_9.FREE;
            ste.hasFree = true;
            free[name] = null;
        }
        else if (global && global[name] !== undefined) {
            dict[name] = SymbolConstants_12.GLOBAL_IMPLICIT;
        }
        else {
            if (ste.isNested)
                ste.hasFree = true;
            dict[name] = SymbolConstants_12.GLOBAL_IMPLICIT;
        }
    };
    SymbolTable.prototype.analyze = function () {
        var free = {};
        var global = {};
        this.analyzeBlock(this.top, null, free, global);
    };
    return SymbolTable;
}());
exports.SymbolTable = SymbolTable;
