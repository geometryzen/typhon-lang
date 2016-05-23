define(["require", "exports", './asserts', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './base', './SymbolTableScope', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, asserts_1, astnodes_1, astnodes_2, astnodes_3, astnodes_4, astnodes_5, astnodes_6, astnodes_7, astnodes_8, astnodes_9, astnodes_10, astnodes_11, astnodes_12, astnodes_13, astnodes_14, astnodes_15, astnodes_16, astnodes_17, astnodes_18, astnodes_19, astnodes_20, astnodes_21, astnodes_22, astnodes_23, astnodes_24, astnodes_25, astnodes_26, astnodes_27, astnodes_28, astnodes_29, astnodes_30, astnodes_31, astnodes_32, astnodes_33, astnodes_34, astnodes_35, astnodes_36, astnodes_37, astnodes_38, astnodes_39, astnodes_40, astnodes_41, astnodes_42, astnodes_43, astnodes_44, astnodes_45, astnodes_46, astnodes_47, astnodes_48, base_1, SymbolTableScope_1, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6, SymbolConstants_7, SymbolConstants_8, SymbolConstants_9, SymbolConstants_10, SymbolConstants_11, SymbolConstants_12, SymbolConstants_13, SymbolConstants_14, SymbolConstants_15, SymbolConstants_16) {
    "use strict";
    /**
     * @param {string} message
     * @param {string} fileName
     * @param {number=} lineNumber
     */
    function syntaxError(message, fileName, lineNumber) {
        asserts_1.assert(base_1.isString(message), "message must be a string");
        asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
        if (base_1.isDef(lineNumber)) {
            asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
        }
        var e = new SyntaxError(message /*, fileName*/);
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
    var SymbolTable = (function () {
        /**
         * @constructor
         * @param {string} fileName
         */
        function SymbolTable(fileName) {
            this.visitExpr = function (e) {
                asserts_1.assert(e !== undefined, "visitExpr called with undefined");
                //print("  e: ", e.constructor.name);
                switch (e.constructor) {
                    case astnodes_6.BoolOp:
                        this.SEQExpr(e.values);
                        break;
                    case astnodes_5.BinOp:
                        this.visitExpr(e.left);
                        this.visitExpr(e.right);
                        break;
                    case astnodes_45.UnaryOp:
                        this.visitExpr(e.operand);
                        break;
                    case astnodes_27.Lambda:
                        this.addDef("lambda", SymbolConstants_7.DEF_LOCAL, e.lineno);
                        if (e.args.defaults)
                            this.SEQExpr(e.args.defaults);
                        this.enterBlock("lambda", SymbolConstants_10.FunctionBlock, e, e.lineno);
                        this.visitArguments(e.args, e.lineno);
                        this.visitExpr(e.body);
                        this.exitBlock();
                        break;
                    case astnodes_23.IfExp:
                        this.visitExpr(e.test);
                        this.visitExpr(e.body);
                        this.visitExpr(e.orelse);
                        break;
                    case astnodes_13.Dict:
                        this.SEQExpr(e.keys);
                        this.SEQExpr(e.values);
                        break;
                    case astnodes_30.ListComp:
                        this.newTmpname(e.lineno);
                        this.visitExpr(e.elt);
                        this.visitComprehension(e.generators, 0);
                        break;
                    case astnodes_20.GeneratorExp:
                        this.visitGenexp(e);
                        break;
                    case astnodes_48.Yield:
                        if (e.value)
                            this.visitExpr(e.value);
                        this.cur.generator = true;
                        if (this.cur.returnsValue) {
                            throw syntaxError("'return' with argument inside generator", this.fileName);
                        }
                        break;
                    case astnodes_10.Compare:
                        this.visitExpr(e.left);
                        this.SEQExpr(e.comparators);
                        break;
                    case astnodes_8.Call:
                        this.visitExpr(e.func);
                        this.SEQExpr(e.args);
                        for (var i = 0; i < e.keywords.length; ++i)
                            this.visitExpr(e.keywords[i].value);
                        //print(JSON.stringify(e.starargs, null, 2));
                        //print(JSON.stringify(e.kwargs, null,2));
                        if (e.starargs)
                            this.visitExpr(e.starargs);
                        if (e.kwargs)
                            this.visitExpr(e.kwargs);
                        break;
                    case astnodes_32.Num:
                    case astnodes_40.Str:
                        break;
                    case astnodes_3.Attribute:
                        this.visitExpr(e.value);
                        break;
                    case astnodes_41.Subscript:
                        this.visitExpr(e.value);
                        this.visitSlice(e.slice);
                        break;
                    case astnodes_31.Name:
                        this.addDef(e.id, e.ctx === astnodes_28.Load ? SymbolConstants_15.USE : SymbolConstants_7.DEF_LOCAL, e.lineno);
                        break;
                    case astnodes_29.List:
                    case astnodes_44.Tuple:
                        this.SEQExpr(e.elts);
                        break;
                    default:
                        asserts_1.fail("Unhandled type " + e.constructor.name + " in visitExpr");
                }
            };
            this.visitComprehension = function (lcs, startAt) {
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
            this.visitAlias = function (names, lineno) {
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
                        this.addDef(storename, SymbolConstants_6.DEF_IMPORT, lineno);
                    }
                    else {
                        if (this.cur.blockType !== SymbolConstants_14.ModuleBlock) {
                            throw syntaxError("import * only allowed at module level", this.fileName);
                        }
                    }
                }
            };
            /**
             * @param {Object} e
             */
            this.visitGenexp = function (e) {
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
            this.visitExcepthandlers = function (handlers) {
                for (var i = 0, eh; eh = handlers[i]; ++i) {
                    if (eh.type)
                        this.visitExpr(eh.type);
                    if (eh.name)
                        this.visitExpr(eh.name);
                    this.SEQStmt(eh.body);
                }
            };
            /**
             * @param {Object} ste The Symbol Table Scope.
             */
            this.analyzeBlock = function (ste, bound, free, global) {
                var local = {};
                var scope = {};
                var newglobal = {};
                var newbound = {};
                var newfree = {};
                if (ste.blockType == SymbolConstants_2.ClassBlock) {
                    _dictUpdate(newglobal, global);
                    if (bound)
                        _dictUpdate(newbound, bound);
                }
                for (var name in ste.symFlags) {
                    var flags = ste.symFlags[name];
                    this.analyzeName(ste, scope, name, flags, bound, local, free, global);
                }
                if (ste.blockType !== SymbolConstants_2.ClassBlock) {
                    if (ste.blockType === SymbolConstants_10.FunctionBlock)
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
                if (ste.blockType === SymbolConstants_10.FunctionBlock)
                    this.analyzeCells(scope, newfree);
                this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === SymbolConstants_2.ClassBlock);
                _dictUpdate(free, newfree);
            };
            this.analyzeChildBlock = function (entry, bound, free, global, childFree) {
                var tempBound = {};
                _dictUpdate(tempBound, bound);
                var tempFree = {};
                _dictUpdate(tempFree, free);
                var tempGlobal = {};
                _dictUpdate(tempGlobal, global);
                this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
                _dictUpdate(childFree, tempFree);
            };
            this.analyzeCells = function (scope, free) {
                for (var name in scope) {
                    var flags = scope[name];
                    if (flags !== SymbolConstants_13.LOCAL)
                        continue;
                    if (free[name] === undefined)
                        continue;
                    scope[name] = SymbolConstants_1.CELL;
                    delete free[name];
                }
            };
            /**
             * store scope info back into the st symbols dict. symbols is modified,
             * others are not.
             */
            this.updateSymbols = function (symbols, scope, bound, free, classflag) {
                for (var name in symbols) {
                    var flags = symbols[name];
                    var w = scope[name];
                    flags |= w << SymbolConstants_16.SCOPE_OFF;
                    symbols[name] = flags;
                }
                var freeValue = SymbolConstants_9.FREE << SymbolConstants_16.SCOPE_OFF;
                var pos = 0;
                for (var name in free) {
                    var o = symbols[name];
                    if (o !== undefined) {
                        // it could be a free variable in a method of the class that has
                        // the same name as a local or global in the class scope
                        if (classflag && (o & (SymbolConstants_3.DEF_BOUND | SymbolConstants_5.DEF_GLOBAL))) {
                            var i = o | SymbolConstants_4.DEF_FREE_CLASS;
                            symbols[name] = i;
                        }
                        // else it's not free, probably a cell
                        continue;
                    }
                    if (bound[name] === undefined)
                        continue;
                    symbols[name] = freeValue;
                }
            };
            /**
             * @param {Object} ste The Symbol Table Scope.
             * @param {string} name
             */
            this.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
                if (flags & SymbolConstants_5.DEF_GLOBAL) {
                    if (flags & SymbolConstants_8.DEF_PARAM)
                        throw syntaxError("name '" + name + "' is local and global", this.fileName, ste.lineno);
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
            this.analyze = function () {
                var free = {};
                var global = {};
                this.analyzeBlock(this.top, null, free, global);
            };
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
        SymbolTable.prototype.enterBlock = function (name, blockType, ast, lineno) {
            //  name = fixReservedNames(name);
            var prev = null;
            if (this.cur) {
                prev = this.cur;
                this.stack.push(this.cur);
            }
            this.cur = new SymbolTableScope_1.default(this, name, blockType, ast, lineno);
            if (name === 'top') {
                this.global = this.cur.symFlags;
            }
            if (prev) {
                prev.children.push(this.cur);
            }
        };
        SymbolTable.prototype.exitBlock = function () {
            //print("exitBlock");
            this.cur = null;
            if (this.stack.length > 0)
                this.cur = this.stack.pop();
        };
        SymbolTable.prototype.visitParams = function (args, toplevel) {
            for (var i = 0; i < args.length; ++i) {
                var arg = args[i];
                if (arg.constructor === astnodes_31.Name) {
                    asserts_1.assert(arg.ctx === astnodes_33.Param || (arg.ctx === astnodes_39.Store && !toplevel));
                    this.addDef(arg.id, SymbolConstants_8.DEF_PARAM, arg.lineno);
                }
                else {
                    // Tuple isn't supported
                    throw syntaxError("invalid expression in parameter list", this.fileName);
                }
            }
        };
        ;
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
         */
        SymbolTable.prototype.newTmpname = function (lineno) {
            this.addDef("_[" + (++this.tmpname) + "]", SymbolConstants_7.DEF_LOCAL, lineno);
        };
        /**
         * @param {string} name
         * @param {number} flag
         * @param {number} lineno
         */
        SymbolTable.prototype.addDef = function (name, flag, lineno) {
            var mangled = mangleName(this.curClass, name);
            //  mangled = fixReservedNames(mangled);
            var val = this.cur.symFlags[mangled];
            if (val !== undefined) {
                if ((flag & SymbolConstants_8.DEF_PARAM) && (val & SymbolConstants_8.DEF_PARAM)) {
                    throw syntaxError("duplicate argument '" + name + "' in function definition", this.fileName, lineno);
                }
                val |= flag;
            }
            else {
                val = flag;
            }
            this.cur.symFlags[mangled] = val;
            if (flag & SymbolConstants_8.DEF_PARAM) {
                this.cur.varnames.push(mangled);
            }
            else if (flag & SymbolConstants_5.DEF_GLOBAL) {
                val = flag;
                var fromGlobal = this.global[mangled];
                if (fromGlobal !== undefined)
                    val |= fromGlobal;
                this.global[mangled] = val;
            }
        };
        SymbolTable.prototype.visitSlice = function (s) {
            switch (s.constructor) {
                case astnodes_38.Slice:
                    if (s.lower)
                        this.visitExpr(s.lower);
                    if (s.upper)
                        this.visitExpr(s.upper);
                    if (s.step)
                        this.visitExpr(s.step);
                    break;
                case astnodes_17.ExtSlice:
                    for (var i = 0; i < s.dims.length; ++i)
                        this.visitSlice(s.dims[i]);
                    break;
                case astnodes_26.Index:
                    this.visitExpr(s.value);
                    break;
                case astnodes_14.Ellipsis:
                    break;
            }
        };
        /**
         * @param {Object} s
         */
        SymbolTable.prototype.visitStmt = function (s) {
            asserts_1.assert(s !== undefined, "visitStmt called with undefined");
            switch (s.constructor) {
                case astnodes_19.FunctionDef:
                    this.addDef(s.name, SymbolConstants_7.DEF_LOCAL, s.lineno);
                    if (s.args.defaults)
                        this.SEQExpr(s.args.defaults);
                    if (s.decorator_list)
                        this.SEQExpr(s.decorator_list);
                    this.enterBlock(s.name, SymbolConstants_10.FunctionBlock, s, s.lineno);
                    this.visitArguments(s.args, s.lineno);
                    this.SEQStmt(s.body);
                    this.exitBlock();
                    break;
                case astnodes_9.ClassDef:
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
                    break;
                case astnodes_37.Return_:
                    if (s.value) {
                        this.visitExpr(s.value);
                        this.cur.returnsValue = true;
                        if (this.cur.generator) {
                            throw syntaxError("'return' with argument inside generator", this.fileName);
                        }
                    }
                    break;
                case astnodes_12.Delete_:
                    this.SEQExpr(s.targets);
                    break;
                case astnodes_2.Assign:
                    this.SEQExpr(s.targets);
                    this.visitExpr(s.value);
                    break;
                case astnodes_4.AugAssign:
                    this.visitExpr(s.target);
                    this.visitExpr(s.value);
                    break;
                case astnodes_35.Print:
                    if (s.dest)
                        this.visitExpr(s.dest);
                    this.SEQExpr(s.values);
                    break;
                case astnodes_18.For_:
                    this.visitExpr(s.target);
                    this.visitExpr(s.iter);
                    this.SEQStmt(s.body);
                    if (s.orelse)
                        this.SEQStmt(s.orelse);
                    break;
                case astnodes_46.While_:
                    this.visitExpr(s.test);
                    this.SEQStmt(s.body);
                    if (s.orelse)
                        this.SEQStmt(s.orelse);
                    break;
                case astnodes_22.If_:
                    this.visitExpr(s.test);
                    this.SEQStmt(s.body);
                    if (s.orelse)
                        this.SEQStmt(s.orelse);
                    break;
                case astnodes_36.Raise:
                    if (s.type) {
                        this.visitExpr(s.type);
                        if (s.inst) {
                            this.visitExpr(s.inst);
                            if (s.tback)
                                this.visitExpr(s.tback);
                        }
                    }
                    break;
                case astnodes_42.TryExcept:
                    this.SEQStmt(s.body);
                    this.SEQStmt(s.orelse);
                    this.visitExcepthandlers(s.handlers);
                    break;
                case astnodes_43.TryFinally:
                    this.SEQStmt(s.body);
                    this.SEQStmt(s.finalbody);
                    break;
                case astnodes_1.Assert:
                    this.visitExpr(s.test);
                    if (s.msg)
                        this.visitExpr(s.msg);
                    break;
                case astnodes_24.Import_:
                case astnodes_25.ImportFrom:
                    this.visitAlias(s.names, s.lineno);
                    break;
                case astnodes_15.Exec:
                    this.visitExpr(s.body);
                    if (s.globals) {
                        this.visitExpr(s.globals);
                        if (s.locals)
                            this.visitExpr(s.locals);
                    }
                    break;
                case astnodes_21.Global:
                    var nameslen = s.names.length;
                    for (var i = 0; i < nameslen; ++i) {
                        var name = mangleName(this.curClass, s.names[i]);
                        //              name = fixReservedNames(name);
                        var cur = this.cur.symFlags[name];
                        if (cur & (SymbolConstants_7.DEF_LOCAL | SymbolConstants_15.USE)) {
                            if (cur & SymbolConstants_7.DEF_LOCAL) {
                                throw syntaxError("name '" + name + "' is assigned to before global declaration", this.fileName, s.lineno);
                            }
                            else {
                                throw syntaxError("name '" + name + "' is used prior to global declaration", this.fileName, s.lineno);
                            }
                        }
                        this.addDef(name, SymbolConstants_5.DEF_GLOBAL, s.lineno);
                    }
                    break;
                case astnodes_16.Expr:
                    this.visitExpr(s.value);
                    break;
                case astnodes_34.Pass:
                case astnodes_7.Break_:
                case astnodes_11.Continue_:
                    // nothing
                    break;
                case astnodes_47.With_:
                    this.newTmpname(s.lineno);
                    this.visitExpr(s.context_expr);
                    if (s.optional_vars) {
                        this.newTmpname(s.lineno);
                        this.visitExpr(s.optional_vars);
                    }
                    this.SEQStmt(s.body);
                    break;
                default:
                    asserts_1.fail("Unhandled type " + s.constructor.name + " in visitStmt");
            }
        };
        return SymbolTable;
    }());
    function _dictUpdate(a, b) {
        for (var kb in b) {
            a[kb] = b[kb];
        }
    }
    /**
     * @param {Object} ast
     * @param {string} fileName
     */
    var symbolTable = function (ast, fileName) {
        var ret = new SymbolTable(fileName);
        ret.enterBlock("top", SymbolConstants_14.ModuleBlock, ast, 0);
        ret.top = ret.cur;
        //print(Sk.astDump(ast));
        for (var i = 0; i < ast.body.length; ++i)
            ret.visitStmt(ast.body[i]);
        ret.exitBlock();
        ret.analyze();
        return ret;
    };
    var dumpSymbolTable = function (st) {
        var pyBoolStr = function (b) {
            return b ? "True" : "False";
        };
        var pyList = function (l) {
            var ret = [];
            for (var i = 0; i < l.length; ++i) {
                // TODO: Originally, this computed the Python repr().
                ret.push(l[i]);
            }
            return '[' + ret.join(', ') + ']';
        };
        var getIdents = function (obj, indent) {
            if (indent === undefined)
                indent = "";
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
    var that = {
        symbolTable: symbolTable,
        mangleName: mangleName,
        LOCAL: SymbolConstants_13.LOCAL,
        GLOBAL_EXPLICIT: SymbolConstants_11.GLOBAL_EXPLICIT,
        GLOBAL_IMPLICIT: SymbolConstants_12.GLOBAL_IMPLICIT,
        FREE: SymbolConstants_9.FREE,
        CELL: SymbolConstants_1.CELL,
        FunctionBlock: SymbolConstants_10.FunctionBlock,
        dumpSymbolTable: dumpSymbolTable
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = that;
});
