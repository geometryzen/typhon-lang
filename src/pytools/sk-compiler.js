define(["require", "exports", './asserts', './parser', './builder', './reservedNames', './reservedWords', './symtable', './toStringLiteralJS', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, asserts_1, parser_1, builder_1, reservedNames_1, reservedWords_1, symtable_1, toStringLiteralJS_1, astnodes_1, astnodes_2, astnodes_3, astnodes_4, astnodes_5, astnodes_6, astnodes_7, astnodes_8, astnodes_9, astnodes_10, astnodes_11, astnodes_12, astnodes_13, astnodes_14, astnodes_15, astnodes_16, astnodes_17, astnodes_18, astnodes_19, astnodes_20, astnodes_21, astnodes_22, astnodes_23, astnodes_24, astnodes_25, astnodes_26, astnodes_27, astnodes_28, astnodes_29, astnodes_30, astnodes_31, astnodes_32, astnodes_33, astnodes_34, astnodes_35, astnodes_36, astnodes_37, astnodes_38, astnodes_39, astnodes_40, astnodes_41, astnodes_42, astnodes_43, astnodes_44, astnodes_45, astnodes_46, astnodes_47, astnodes_48, astnodes_49, astnodes_50, astnodes_51, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6) {
    "use strict";
    var OP_FAST = 0;
    var OP_GLOBAL = 1;
    var OP_DEREF = 2;
    var OP_NAME = 3;
    // const D_NAMES = 0;
    // const D_FREEVARS = 1;
    // const D_CELLVARS = 2;
    /**
     * The output function is scoped at the module level so that it is available without being a parameter.
     * @param {...*} x
     */
    var out;
    /**
     * We keep track of how many time gensym method on the Compiler is called because ... ?
     */
    var gensymCount = 0;
    /**
     * FIXME: CompilerUnit is coupled to this module by the out variable.
     */
    var CompilerUnit = (function () {
        /**
         * @constructor
         *
         * Stuff that changes on entry/exit of code blocks. must be saved and restored
         * when returning to a block.
         *
         * Corresponds to the body of a module, class, or function.
         */
        function CompilerUnit() {
            /**
             * @type {?Object}
             */
            this.ste = null;
            this.name = null;
            this.private_ = null;
            this.firstlineno = 0;
            this.lineno = 0;
            this.linenoSet = false;
            this.localnames = [];
            this.blocknum = 0;
            this.blocks = [];
            this.curblock = 0;
            this.scopename = null;
            this.prefixCode = '';
            this.varDeclsCode = '';
            this.switchCode = '';
            this.suffixCode = '';
            // stack of where to go on a break
            this.breakBlocks = [];
            // stack of where to go on a continue
            this.continueBlocks = [];
            this.exceptBlocks = [];
            this.finallyBlocks = [];
        }
        CompilerUnit.prototype.activateScope = function () {
            // The 'arguments' object cannot be referenced in an arrow function in ES3 and ES5.
            // That's why we use a standard function expression.
            var self = this;
            out = function () {
                var b = self.blocks[self.curblock];
                for (var i = 0; i < arguments.length; ++i)
                    b.push(arguments[i]);
            };
        };
        return CompilerUnit;
    }());
    var Compiler = (function () {
        /**
         * @constructor
         * @param fileName {string}
         * @param st {SymbolTable}
         * @param flags {number}
         * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
         */
        function Compiler(fileName, st, flags, sourceCodeForAnnotation) {
            this.fileName = fileName;
            /**
             * @type {Object}
             * @private
             */
            this.st = st;
            this.flags = flags;
            this.interactive = false;
            this.nestlevel = 0;
            this.u = null;
            /**
             * @type Array.<CompilerUnit>
             * @private
             */
            this.stack = [];
            this.result = [];
            // this.gensymcount = 0;
            /**
             * @type Array.<CompilerUnit>
             * @private
             */
            this.allUnits = [];
            this.source = sourceCodeForAnnotation ? sourceCodeForAnnotation.split("\n") : false;
        }
        Compiler.prototype.getSourceLine = function (lineno) {
            asserts_1.assert(!!this.source);
            return this.source[lineno - 1];
        };
        Compiler.prototype.annotateSource = function (ast) {
            if (this.source) {
                var lineno = ast.lineno;
                var col_offset = ast.col_offset;
                out('\n//');
                out('\n// line ', lineno, ':');
                out('\n// ', this.getSourceLine(lineno));
                //
                out('\n// ');
                for (var i = 0; i < col_offset; ++i) {
                    out(" ");
                }
                out("^");
                out("\n//");
                out('\nSk.currLineNo = ', lineno, ';Sk.currColNo = ', col_offset, ';');
                out("\nSk.currFilename = '", this.fileName, "';\n\n");
            }
        };
        Compiler.prototype.gensym = function (hint) {
            hint = hint || '';
            hint = '$' + hint;
            hint += gensymCount++;
            return hint;
        };
        Compiler.prototype.niceName = function (roughName) {
            return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
        };
        /**
         * @method _gr
         * @param {string} hint basename for gensym
         * @param {...*} rest
         */
        Compiler.prototype._gr = function (hint, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, argA, argB, argC, argD, argE) {
            var v = this.gensym(hint);
            out("var ", v, "=");
            for (var i = 1; i < arguments.length; ++i) {
                out(arguments[i]);
            }
            out(";");
            return v;
        };
        /**
         * Function to test if an interrupt should occur if the program has been running for too long.
         * This function is executed at every test/branch operation.
         */
        Compiler.prototype._interruptTest = function () {
            out("if (typeof Sk.execStart === 'undefined') {Sk.execStart=new Date()}");
            out("if (Sk.execLimit !== null && new Date() - Sk.execStart > Sk.execLimit) {throw new Sk.builtin.TimeLimitError(Sk.timeoutMsg())}");
        };
        Compiler.prototype._jumpfalse = function (test, block) {
            var cond = this._gr('jfalse', "(", test, "===false||!Sk.misceval.isTrue(", test, "))");
            this._interruptTest();
            out("if(", cond, "){/*test failed */$blk=", block, ";continue;}");
        };
        Compiler.prototype._jumpundef = function (test, block) {
            this._interruptTest();
            out("if(typeof ", test, " === 'undefined'){$blk=", block, ";continue;}");
        };
        Compiler.prototype._jumptrue = function (test, block) {
            var cond = this._gr('jtrue', "(", test, "===true||Sk.misceval.isTrue(", test, "))");
            this._interruptTest();
            out("if(", cond, "){/*test passed */$blk=", block, ";continue;}");
        };
        Compiler.prototype._jump = function (block) {
            this._interruptTest();
            out("$blk=", block, ";/* jump */continue;");
        };
        Compiler.prototype.ctupleorlist = function (e, data, tuporlist) {
            asserts_1.assert(tuporlist === 'tuple' || tuporlist === 'list');
            if (e.ctx === astnodes_43.Store) {
                for (var i = 0; i < e.elts.length; ++i) {
                    this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
                }
            }
            else if (e.ctx === astnodes_33.Load) {
                var items = [];
                for (var i = 0; i < e.elts.length; ++i) {
                    items.push(this._gr('elem', this.vexpr(e.elts[i])));
                }
                return this._gr('load' + tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
            }
        };
        Compiler.prototype.cdict = function (e) {
            asserts_1.assert(e.values.length === e.keys.length);
            var items = [];
            for (var i = 0; i < e.values.length; ++i) {
                var v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
                items.push(this.vexpr(e.keys[i]));
                items.push(v);
            }
            return this._gr('loaddict', "new Sk.builtins['dict']([", items, "])");
        };
        Compiler.prototype.clistcompgen = function (tmpname, generators, genIndex, elt) {
            var start = this.newBlock('list gen start');
            var skip = this.newBlock('list gen skip');
            var anchor = this.newBlock('list gen anchor');
            var l = generators[genIndex];
            var toiter = this.vexpr(l.iter);
            var iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
            this._jump(start);
            this.setBlock(start);
            // load targets
            var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
            this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
            // var target = this.vexpr(l.target, nexti);
            var n = l.ifs.length;
            for (var i = 0; i < n; ++i) {
                var ifres = this.vexpr(l.ifs[i]);
                this._jumpfalse(ifres, start);
            }
            if (++genIndex < generators.length) {
                this.clistcompgen(tmpname, generators, genIndex, elt);
            }
            if (genIndex >= generators.length) {
                var velt = this.vexpr(elt);
                out(tmpname, ".v.push(", velt, ");");
                this._jump(skip);
                this.setBlock(skip);
            }
            this._jump(start);
            this.setBlock(anchor);
            return tmpname;
        };
        Compiler.prototype.clistcomp = function (e) {
            asserts_1.assert(e instanceof astnodes_32.ListComp);
            var tmp = this._gr("_compr", "new Sk.builtins['list']([])");
            return this.clistcompgen(tmp, e.generators, 0, e.elt);
        };
        Compiler.prototype.cyield = function (e) {
            if (this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                throw new SyntaxError("'yield' outside function");
            var val = 'null';
            if (e.value)
                val = this.vexpr(e.value);
            var nextBlock = this.newBlock('after yield');
            // return a pair: resume target block and yielded value
            out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
            this.setBlock(nextBlock);
            return '$gen.gi$sentvalue'; // will either be null if none sent, or the value from gen.send(value)
        };
        Compiler.prototype.ccompare = function (e) {
            asserts_1.assert(e.ops.length === e.comparators.length);
            var cur = this.vexpr(e.left);
            var n = e.ops.length;
            var done = this.newBlock("done");
            var fres = this._gr('compareres', 'null');
            for (var i = 0; i < n; ++i) {
                var rhs = this.vexpr(e.comparators[i]);
                var res = this._gr('compare', "Sk.builtin.bool(Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", e.ops[i].prototype._astname, "'))");
                out(fres, '=', res, ';');
                this._jumpfalse(res, done);
                cur = rhs;
            }
            this._jump(done);
            this.setBlock(done);
            return fres;
        };
        Compiler.prototype.ccall = function (e) {
            var func = this.vexpr(e.func);
            var args = this.vseqexpr(e.args);
            if (e.keywords.length > 0 || e.starargs || e.kwargs) {
                var kwarray = [];
                for (var i = 0; i < e.keywords.length; ++i) {
                    kwarray.push("'" + e.keywords[i].arg + "'");
                    kwarray.push(this.vexpr(e.keywords[i].value));
                }
                var keywords = "[" + kwarray.join(",") + "]";
                var starargs = "undefined";
                var kwargs = "undefined";
                if (e.starargs)
                    starargs = this.vexpr(e.starargs);
                if (e.kwargs)
                    kwargs = this.vexpr(e.kwargs);
                return this._gr('call', "Sk.misceval.call(", func, ",", kwargs, ",", starargs, ",", keywords, args.length > 0 ? "," : "", args, ")");
            }
            else {
                return this._gr('call', "Sk.misceval.callsim(", func, args.length > 0 ? "," : "", args, ")");
            }
        };
        Compiler.prototype.cslice = function (s) {
            asserts_1.assert(s instanceof astnodes_42.Slice);
            var low = s.lower ? this.vexpr(s.lower) : 'null';
            var high = s.upper ? this.vexpr(s.upper) : 'null';
            var step = s.step ? this.vexpr(s.step) : 'null';
            return this._gr('slice', "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
        };
        Compiler.prototype.vslicesub = function (s) {
            var subs;
            switch (s.constructor) {
                case Number:
                case String:
                    // Already compiled, should only happen for augmented assignments
                    subs = s;
                    break;
                case astnodes_29.Index:
                    subs = this.vexpr(s.value);
                    break;
                case astnodes_42.Slice:
                    subs = this.cslice(s);
                    break;
                case astnodes_18.Ellipsis:
                case astnodes_20.ExtSlice:
                    asserts_1.fail("todo;");
                    break;
                default:
                    asserts_1.fail("invalid subscript kind");
            }
            return subs;
        };
        Compiler.prototype.vslice = function (s, ctx, obj, dataToStore) {
            var subs = this.vslicesub(s);
            return this.chandlesubscr(ctx, obj, subs, dataToStore);
        };
        Compiler.prototype.chandlesubscr = function (ctx, obj, subs, data) {
            if (ctx === astnodes_33.Load || ctx === astnodes_6.AugLoad)
                return this._gr('lsubscr', "Sk.abstr.objectGetItem(", obj, ",", subs, ")");
            else if (ctx === astnodes_43.Store || ctx === astnodes_7.AugStore)
                out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
            else if (ctx === astnodes_15.Del)
                out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
            else
                asserts_1.fail("handlesubscr fail");
        };
        Compiler.prototype.cboolop = function (e) {
            asserts_1.assert(e instanceof astnodes_9.BoolOp);
            var jtype;
            if (e.op === astnodes_1.And)
                jtype = this._jumpfalse;
            else
                jtype = this._jumptrue;
            var end = this.newBlock('end of boolop');
            var s = e.values;
            var n = s.length;
            var retval;
            for (var i = 0; i < n; ++i) {
                var expres = this.vexpr(s[i]);
                if (i === 0) {
                    retval = this._gr('boolopsucc', expres);
                }
                out(retval, "=", expres, ";");
                jtype.call(this, expres, end);
            }
            this._jump(end);
            this.setBlock(end);
            return retval;
        };
        /**
         *
         * compiles an expression. to 'return' something, it'll gensym a var and store
         * into that var so that the calling code doesn't have avoid just pasting the
         * returned name.
         *
         * @param {Object} e
         * @param {string=} data data to store in a store operation
         * @param {Object=} augstoreval value to store to for an aug operation (not
         * vexpr'd yet)
         */
        Compiler.prototype.vexpr = function (e, data, augstoreval) {
            if (e.lineno > this.u.lineno) {
                this.u.lineno = e.lineno;
                this.u.linenoSet = false;
            }
            // this.annotateSource(e);
            switch (e.constructor) {
                case astnodes_9.BoolOp:
                    return this.cboolop(e);
                case astnodes_8.BinOp:
                    return this._gr('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
                case astnodes_49.UnaryOp:
                    return this._gr('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
                case astnodes_30.Lambda:
                    return this.clambda(e);
                case astnodes_26.IfExp:
                    return this.cifexp(e);
                case astnodes_17.Dict:
                    return this.cdict(e);
                case astnodes_32.ListComp:
                    return this.clistcomp(e);
                case astnodes_23.GeneratorExp:
                    return this.cgenexp(e);
                case astnodes_51.Yield:
                    return this.cyield(e);
                case astnodes_13.Compare:
                    return this.ccompare(e);
                case astnodes_11.Call:
                    var result = this.ccall(e);
                    // After the function call, we've returned to this line
                    this.annotateSource(e);
                    return result;
                case astnodes_36.Num:
                    {
                        if (e.n.isFloat()) {
                            return 'Sk.builtin.numberToPy(' + e.n.value + ')';
                        }
                        else if (e.n.isInt()) {
                            return "Sk.ffi.numberToIntPy(" + e.n.value + ")";
                        }
                        else if (e.n.isLong()) {
                            return "Sk.ffi.longFromString('" + e.n.text + "', " + e.n.radix + ")";
                        }
                        asserts_1.fail("unhandled Num type");
                    }
                case astnodes_44.Str:
                    {
                        return this._gr('str', 'Sk.builtin.stringToPy(', toStringLiteralJS_1.default(e.s), ')');
                    }
                case astnodes_4.Attribute:
                    var val;
                    if (e.ctx !== astnodes_7.AugStore)
                        val = this.vexpr(e.value);
                    var mangled = toStringLiteralJS_1.default(e.attr);
                    mangled = mangled.substring(1, mangled.length - 1);
                    mangled = mangleName(this.u.private_, mangled);
                    mangled = fixReservedWords(mangled);
                    mangled = fixReservedNames(mangled);
                    switch (e.ctx) {
                        case astnodes_6.AugLoad:
                        case astnodes_33.Load:
                            return this._gr("lattr", "Sk.abstr.gattr(", val, ",'", mangled, "')");
                        case astnodes_7.AugStore:
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            out("}");
                            break;
                        case astnodes_43.Store:
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            break;
                        case astnodes_15.Del:
                            asserts_1.fail("todo;");
                            break;
                        case astnodes_37.Param:
                        default:
                            asserts_1.fail("invalid attribute expression");
                    }
                    break;
                case astnodes_45.Subscript:
                    switch (e.ctx) {
                        case astnodes_6.AugLoad:
                        case astnodes_33.Load:
                        case astnodes_43.Store:
                        case astnodes_15.Del:
                            return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                        case astnodes_7.AugStore: {
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            var val_1 = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            this.vslice(e.slice, e.ctx, val_1, data);
                            out("}");
                            break;
                        }
                        case astnodes_37.Param:
                        default:
                            asserts_1.fail("invalid subscript expression");
                    }
                    break;
                case astnodes_35.Name:
                    return this.nameop(e.id, e.ctx, data);
                case astnodes_31.List:
                    return this.ctupleorlist(e, data, 'list');
                case astnodes_48.Tuple:
                    return this.ctupleorlist(e, data, 'tuple');
                default:
                    asserts_1.fail("unhandled case in vexpr");
            }
        };
        /**
         * @param {Array.<Object>} exprs
         * @param {Array.<string>=} data
         */
        Compiler.prototype.vseqexpr = function (exprs, data) {
            /**
             * @const
             * @type {boolean}
             */
            var missingData = (typeof data === 'undefined');
            asserts_1.assert(missingData || exprs.length === data.length);
            var ret = [];
            for (var i = 0; i < exprs.length; ++i) {
                ret.push(this.vexpr(exprs[i], (missingData ? undefined : data[i])));
            }
            return ret;
        };
        Compiler.prototype.caugassign = function (s) {
            asserts_1.assert(s instanceof astnodes_5.AugAssign);
            var e = s.target;
            switch (e.constructor) {
                case astnodes_4.Attribute: {
                    var auge = new astnodes_4.Attribute(e.value, e.attr, astnodes_6.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = astnodes_7.AugStore;
                    return this.vexpr(auge, res, e.value);
                }
                case astnodes_45.Subscript: {
                    // Only compile the subscript value once
                    var augsub = this.vslicesub(e.slice);
                    var auge = new astnodes_45.Subscript(e.value, augsub, astnodes_6.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = astnodes_7.AugStore;
                    return this.vexpr(auge, res, e.value);
                }
                case astnodes_35.Name: {
                    var to = this.nameop(e.id, astnodes_33.Load);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
                    return this.nameop(e.id, astnodes_43.Store, res);
                }
                default:
                    asserts_1.fail("unhandled case in augassign");
            }
        };
        /**
         * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
         */
        Compiler.prototype.exprConstant = function (e) {
            switch (e.constructor) {
                case astnodes_36.Num:
                    asserts_1.fail("Trying to call the runtime for Num");
                    // return Sk.misceval.isTrue(e.n);
                    break;
                case astnodes_44.Str:
                    asserts_1.fail("Trying to call the runtime for Str");
                    // return Sk.misceval.isTrue(e.s);
                    break;
                case astnodes_35.Name:
                // todo; do __debug__ test here if opt
                default:
                    return -1;
            }
        };
        Compiler.prototype.newBlock = function (name) {
            var ret = this.u.blocknum++;
            this.u.blocks[ret] = [];
            this.u.blocks[ret]._name = name || '<unnamed>';
            return ret;
        };
        Compiler.prototype.setBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.curblock = n;
        };
        Compiler.prototype.pushBreakBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.breakBlocks.push(n);
        };
        Compiler.prototype.popBreakBlock = function () {
            this.u.breakBlocks.pop();
        };
        Compiler.prototype.pushContinueBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.continueBlocks.push(n);
        };
        Compiler.prototype.popContinueBlock = function () {
            this.u.continueBlocks.pop();
        };
        Compiler.prototype.pushExceptBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.exceptBlocks.push(n);
        };
        Compiler.prototype.popExceptBlock = function () {
            this.u.exceptBlocks.pop();
        };
        Compiler.prototype.pushFinallyBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.finallyBlocks.push(n);
        };
        Compiler.prototype.popFinallyBlock = function () {
            this.u.finallyBlocks.pop();
        };
        Compiler.prototype.setupExcept = function (eb) {
            out("$exc.push(", eb, ");");
            // this.pushExceptBlock(eb);
        };
        Compiler.prototype.endExcept = function () {
            out("$exc.pop();");
        };
        Compiler.prototype.outputLocals = function (unit) {
            var have = {};
            for (var i = 0; unit.argnames && i < unit.argnames.length; ++i)
                have[unit.argnames[i]] = true;
            unit.localnames.sort();
            var output = [];
            for (var i = 0; i < unit.localnames.length; ++i) {
                var name = unit.localnames[i];
                if (have[name] === undefined) {
                    output.push(name);
                    have[name] = true;
                }
            }
            if (output.length > 0)
                return "var " + output.join(",") + "; /* locals */";
            return "";
        };
        Compiler.prototype.outputAllUnits = function () {
            var ret = '';
            for (var j = 0; j < this.allUnits.length; ++j) {
                var unit = this.allUnits[j];
                ret += unit.prefixCode;
                ret += this.outputLocals(unit);
                ret += unit.varDeclsCode;
                ret += unit.switchCode;
                var blocks = unit.blocks;
                for (var i = 0; i < blocks.length; ++i) {
                    ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
                    ret += blocks[i].join('');
                }
                ret += unit.suffixCode;
            }
            return ret;
        };
        Compiler.prototype.cif = function (s) {
            asserts_1.assert(s instanceof astnodes_25.If_);
            var constant = this.exprConstant(s.test);
            if (constant === 0) {
                if (s.orelse)
                    this.vseqstmt(s.orelse);
            }
            else if (constant === 1) {
                this.vseqstmt(s.body);
            }
            else {
                var end = this.newBlock('end of if');
                var next = this.newBlock('next branch of if');
                var test = this.vexpr(s.test);
                this._jumpfalse(test, next);
                this.vseqstmt(s.body);
                this._jump(end);
                this.setBlock(next);
                if (s.orelse)
                    this.vseqstmt(s.orelse);
                this._jump(end);
            }
            this.setBlock(end);
        };
        Compiler.prototype.cwhile = function (s) {
            var constant = this.exprConstant(s.test);
            if (constant === 0) {
                if (s.orelse)
                    this.vseqstmt(s.orelse);
            }
            else {
                var top = this.newBlock('while test');
                this._jump(top);
                this.setBlock(top);
                var next = this.newBlock('after while');
                var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
                var body = this.newBlock('while body');
                this._jumpfalse(this.vexpr(s.test), orelse ? orelse : next);
                this._jump(body);
                this.pushBreakBlock(next);
                this.pushContinueBlock(top);
                this.setBlock(body);
                this.vseqstmt(s.body);
                this._jump(top);
                this.popContinueBlock();
                this.popBreakBlock();
                if (s.orelse.length > 0) {
                    this.setBlock(orelse);
                    this.vseqstmt(s.orelse);
                    this._jump(next);
                }
                this.setBlock(next);
            }
        };
        Compiler.prototype.cfor = function (s) {
            var start = this.newBlock('for start');
            var cleanup = this.newBlock('for cleanup');
            var end = this.newBlock('for end');
            this.pushBreakBlock(end);
            this.pushContinueBlock(start);
            // get the iterator
            var toiter = this.vexpr(s.iter);
            var iter;
            if (this.u.ste.generator) {
                // if we're in a generator, we have to store the iterator to a local
                // so it's preserved (as we cross blocks here and assume it survives)
                iter = "$loc." + this.gensym("iter");
                out(iter, "=Sk.abstr.iter(", toiter, ");");
            }
            else
                iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
            this._jump(start);
            this.setBlock(start);
            // load targets
            var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
            this._jumpundef(nexti, cleanup); // todo; this should be handled by StopIteration
            // var target = this.vexpr(s.target, nexti);
            // execute body
            this.vseqstmt(s.body);
            // jump to top of loop
            this._jump(start);
            this.setBlock(cleanup);
            this.popContinueBlock();
            this.popBreakBlock();
            this.vseqstmt(s.orelse);
            this._jump(end);
            this.setBlock(end);
        };
        Compiler.prototype.craise = function (s) {
            if (s && s.type && s.type.id && (s.type.id === "StopIteration")) {
                // currently, we only handle StopIteration, and all it does it return
                // undefined which is what our iterator protocol requires.
                //
                // totally hacky, but good enough for now.
                out("return undefined;");
            }
            else {
                var inst = '';
                if (s.inst) {
                    // handles: raise Error, arguments
                    inst = this.vexpr(s.inst);
                    out("throw ", this.vexpr(s.type), "(", inst, ");");
                }
                else if (s.type) {
                    if (s.type.func) {
                        // handles: raise Error(arguments)
                        out("throw ", this.vexpr(s.type), ";");
                    }
                    else {
                        // handles: raise Error
                        out("throw ", this.vexpr(s.type), "('');");
                    }
                }
                else {
                    // re-raise
                    out("throw $err;");
                }
            }
        };
        Compiler.prototype.ctryexcept = function (s) {
            var n = s.handlers.length;
            // Create a block for each except clause
            var handlers = [];
            for (var i = 0; i < n; ++i) {
                handlers.push(this.newBlock("except_" + i + "_"));
            }
            var unhandled = this.newBlock("unhandled");
            var orelse = this.newBlock("orelse");
            var end = this.newBlock("end");
            this.setupExcept(handlers[0]);
            this.vseqstmt(s.body);
            this.endExcept();
            this._jump(orelse);
            for (var i = 0; i < n; ++i) {
                this.setBlock(handlers[i]);
                var handler = s.handlers[i];
                if (!handler.type && i < n - 1) {
                    throw new SyntaxError("default 'except:' must be last");
                }
                if (handler.type) {
                    // should jump to next handler if err not isinstance of handler.type
                    var handlertype = this.vexpr(handler.type);
                    var next = (i === n - 1) ? unhandled : handlers[i + 1];
                    // this check is not right, should use isinstance, but exception objects
                    // are not yet proper Python objects
                    var check = this._gr('instance', "$err instanceof ", handlertype);
                    this._jumpfalse(check, next);
                }
                if (handler.name) {
                    this.vexpr(handler.name, "$err");
                }
                // Need to execute finally before leaving body if an exception is raised
                this.vseqstmt(handler.body);
                // Should jump to finally, but finally is not implemented yet
                this._jump(end);
            }
            // If no except clause catches exception, throw it again
            this.setBlock(unhandled);
            // Should execute finally first
            out("throw $err;");
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
            // Should jump to finally, but finally is not implemented yet
            this._jump(end);
            this.setBlock(end);
        };
        Compiler.prototype.ctryfinally = function (s) {
            out("/*todo; tryfinally*/");
            // everything but the finally?
            this.ctryexcept(s.body[0]);
        };
        Compiler.prototype.cassert = function (s) {
            /* todo; warnings method
            if (s.test instanceof Tuple && s.test.elts.length > 0)
                Sk.warn("assertion is always true, perhaps remove parentheses?");
            */
            var test = this.vexpr(s.test);
            var end = this.newBlock("end");
            this._jumptrue(test, end);
            // todo; exception handling
            // maybe replace with fail?? or just an alert?
            out("throw new Sk.builtin.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
            this.setBlock(end);
        };
        /**
         * @param {string} name
         * @param {string} asname
         * @param {string=} mod
         */
        Compiler.prototype.cimportas = function (name, asname, mod) {
            var src = name;
            var dotLoc = src.indexOf(".");
            var cur = mod;
            if (dotLoc !== -1) {
                // if there's dots in the module name, __import__ will have returned
                // the top-level module. so, we need to extract the actual module by
                // getattr'ing up through the names, and then storing the leaf under
                // the name it was to be imported as.
                src = src.substr(dotLoc + 1);
                while (dotLoc !== -1) {
                    dotLoc = src.indexOf(".");
                    var attr = dotLoc !== -1 ? src.substr(0, dotLoc) : src;
                    cur = this._gr('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
                    src = src.substr(dotLoc + 1);
                }
            }
            return this.nameop(asname, astnodes_43.Store, cur);
        };
        ;
        Compiler.prototype.cimport = function (s) {
            var n = s.names.length;
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                var mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS_1.default(alias.name), ',$gbl,$loc,[])');
                if (alias.asname) {
                    this.cimportas(alias.name, alias.asname, mod);
                }
                else {
                    var lastDot = alias.name.indexOf('.');
                    if (lastDot !== -1) {
                        this.nameop(alias.name.substr(0, lastDot), astnodes_43.Store, mod);
                    }
                    else {
                        this.nameop(alias.name, astnodes_43.Store, mod);
                    }
                }
            }
        };
        ;
        Compiler.prototype.cfromimport = function (s) {
            var n = s.names.length;
            var names = [];
            for (var i = 0; i < n; ++i) {
                names[i] = s.names[i].name;
            }
            var namesString = names.map(function (name) { return toStringLiteralJS_1.default(name); }).join(', ');
            var mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS_1.default(s.module), ',$gbl,$loc,[', namesString, '])');
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                if (i === 0 && alias.name === "*") {
                    asserts_1.assert(n === 1);
                    out("Sk.importStar(", mod, ",$loc, $gbl);");
                    return;
                }
                var got = this._gr('item', 'Sk.abstr.gattr(', mod, ',', toStringLiteralJS_1.default(alias.name), ')');
                var storeName = alias.name;
                if (alias.asname)
                    storeName = alias.asname;
                this.nameop(storeName, astnodes_43.Store, got);
            }
        };
        ;
        /**
         * builds a code object (js function) for various constructs. used by def,
         * lambda, generator expressions. it isn't used for class because it seemed
         * different enough.
         *
         * handles:
         * - setting up a new scope
         * - decorators (if any)
         * - defaults setup
         * - setup for cell and free vars
         * - setup and modification for generators
         *
         * @param {Object} n ast node to build for
         * @param {string} coname name of code object to build
         * @param {Array} decorator_list ast of decorators if any
         * @param {*} args arguments to function, if any
         * @param {Function} callback called after setup to do actual work of function
         *
         * @returns the name of the newly created function or generator object.
         *
         */
        Compiler.prototype.buildcodeobj = function (n, coname, decorator_list, args, callback) {
            var decos = [];
            var defaults = [];
            var vararg = null;
            var kwarg = null;
            // decorators and defaults have to be evaluated out here before we enter
            // the new scope. we output the defaults and attach them to this code
            // object, but only once we know the name of it (so we do it after we've
            // exited the scope near the end of this function).
            if (decorator_list)
                decos = this.vseqexpr(decorator_list);
            if (args && args.defaults)
                defaults = this.vseqexpr(args.defaults);
            if (args && args.vararg)
                vararg = args.vararg;
            if (args && args.kwarg)
                kwarg = args.kwarg;
            /**
             * @const
             * @type {boolean}
             */
            var containingHasFree = this.u.ste.hasFree;
            /**
             * @const
             * @type {boolean}
             */
            var containingHasCell = this.u.ste.childHasFree;
            /**
             * enter the new scope, and create the first block
             * @const
             * @type {string}
             */
            var scopename = this.enterScope(coname, n, n.lineno);
            var isGenerator = this.u.ste.generator;
            /**
             * @const
             * @type {boolean}
             */
            var hasFree = this.u.ste.hasFree;
            /**
             * @const
             * @type {boolean}
             */
            var hasCell = this.u.ste.childHasFree;
            /**
             * @const
             * @type {boolean}
             */
            var descendantOrSelfHasFree = this.u.ste.hasFree;
            var entryBlock = this.newBlock('codeobj entry');
            //
            // the header of the function, and arguments
            //
            this.u.prefixCode = "var " + scopename + "=(function " + this.niceName(coname) + "$(";
            var funcArgs = [];
            if (isGenerator) {
                if (kwarg) {
                    throw new SyntaxError(coname + "(): keyword arguments in generators not supported");
                }
                if (vararg) {
                    throw new SyntaxError(coname + "(): variable number of arguments in generators not supported");
                }
                funcArgs.push("$gen");
            }
            else {
                if (kwarg)
                    funcArgs.push("$kwa");
                for (var i = 0; args && i < args.args.length; ++i)
                    funcArgs.push(this.nameop(args.args[i].id, astnodes_37.Param));
            }
            if (descendantOrSelfHasFree) {
                funcArgs.push("$free");
            }
            this.u.prefixCode += funcArgs.join(",");
            this.u.prefixCode += "){";
            if (isGenerator)
                this.u.prefixCode += "\n// generator\n";
            if (containingHasFree)
                this.u.prefixCode += "\n// containing has free\n";
            if (containingHasCell)
                this.u.prefixCode += "\n// containing has cell\n";
            if (hasFree)
                this.u.prefixCode += "\n// has free\n";
            if (hasCell)
                this.u.prefixCode += "\n// has cell\n";
            //
            // set up standard dicts/variables
            //
            var locals = "{}";
            if (isGenerator) {
                entryBlock = "$gen.gi$resumeat";
                locals = "$gen.gi$locals";
            }
            var cells = "";
            if (hasCell)
                cells = ",$cell={}";
            // note special usage of 'this' to avoid having to slice globals into
            // all function invocations in call
            this.u.varDeclsCode += "var $blk=" + entryBlock + ",$exc=[],$loc=" + locals + cells + ",$gbl=this,$err;";
            //
            // copy all parameters that are also cells into the cells dict. this is so
            // they can be accessed correctly by nested scopes.
            //
            for (var i = 0; args && i < args.args.length; ++i) {
                var id = args.args[i].id;
                if (this.isCell(id)) {
                    this.u.varDeclsCode += "$cell." + id + "=" + id + ";";
                }
            }
            //
            // make sure correct number of arguments were passed (generators handled below)
            //
            if (!isGenerator) {
                var minargs = args ? args.args.length - defaults.length : 0;
                var maxargs = vararg ? Infinity : (args ? args.args.length : 0);
                var kw = kwarg ? true : false;
                this.u.varDeclsCode += "Sk.builtin.pyCheckArgs(\"" + coname +
                    "\", arguments, " + minargs + ", " + maxargs + ", " + kw +
                    ", " + descendantOrSelfHasFree + ");";
            }
            //
            // initialize default arguments. we store the values of the defaults to
            // this code object as .$defaults just below after we exit this scope.
            //
            if (defaults.length > 0) {
                // defaults have to be "right justified" so if there's less defaults
                // than args we offset to make them match up (we don't need another
                // correlation in the ast)
                var offset = args.args.length - defaults.length;
                for (var i = 0; i < defaults.length; ++i) {
                    var argname = this.nameop(args.args[i + offset].id, astnodes_37.Param);
                    this.u.varDeclsCode += "if(typeof " + argname + " === 'undefined')" + argname + "=" + scopename + ".$defaults[" + i + "];";
                }
            }
            //
            // initialize vararg, if any
            //
            if (vararg) {
                var start = funcArgs.length;
                this.u.varDeclsCode += vararg + "=new Sk.builtins['tuple'](Array.prototype.slice.call(arguments," + start + ")); /*vararg*/";
            }
            //
            // initialize kwarg, if any
            //
            if (kwarg) {
                this.u.varDeclsCode += kwarg + "=new Sk.builtins['dict']($kwa);";
            }
            //
            // finally, set up the block switch that the jump code expects
            //
            // Old switch code
            // this.u.switchCode += "while(true){switch($blk){";
            // this.u.suffixCode = "}break;}});";
            // New switch code to catch exceptions
            this.u.switchCode = "while(true){try{switch($blk){";
            this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}});";
            //
            // jump back to the handler so it can do the main actual work of the
            // function
            //
            callback.call(this, scopename);
            //
            // get a list of all the argument names (used to attach to the code
            // object, and also to allow us to declare only locals that aren't also
            // parameters).
            var argnames;
            if (args && args.args.length > 0) {
                var argnamesarr = [];
                for (var i = 0; i < args.args.length; ++i) {
                    argnamesarr.push(args.args[i].id);
                }
                argnames = argnamesarr.join("', '");
                // store to unit so we know what local variables not to declare
                this.u.argnames = argnamesarr;
            }
            //
            // and exit the code object scope
            //
            this.exitScope();
            //
            // attach the default values we evaluated at the beginning to the code
            // object so that it can get at them to set any arguments that are left
            // unset.
            //
            if (defaults.length > 0)
                out(scopename, ".$defaults=[", defaults.join(','), "];");
            //
            // attach co_varnames (only the argument names) for keyword argument
            // binding.
            //
            if (argnames) {
                out(scopename, ".co_varnames=['", argnames, "'];");
            }
            //
            // attach flags
            //
            if (kwarg) {
                out(scopename, ".co_kwargs=1;");
            }
            //
            // build either a 'function' or 'generator'. the function is just a simple
            // constructor call. the generator is more complicated. it needs to make a
            // new generator every time it's called, so the thing that's returned is
            // actually a function that makes the generator (and passes arguments to
            // the function onwards to the generator). this should probably actually
            // be a function object, rather than a js function like it is now. we also
            // have to build the argument names to pass to the generator because it
            // needs to store all locals into itself so that they're maintained across
            // yields.
            //
            // todo; possibly this should be outside?
            //
            var frees = "";
            if (hasFree) {
                frees = ",$cell";
                // if the scope we're in where we're defining this one has free
                // vars, they may also be cell vars, so we pass those to the
                // closure too.
                if (containingHasFree)
                    frees += ",$free";
            }
            if (isGenerator)
                // Keyword and variable arguments are not currently supported in generators.
                // The call to pyCheckArgs assumes they can't be true.
                if (args && args.args.length > 0) {
                    return this._gr("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgs(\"", coname, "\",arguments,", args.args.length - defaults.length, ",", args.args.length, ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
                }
                else {
                    return this._gr("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgs(\"", coname, "\",arguments,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
                }
            else {
                return this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
            }
        };
        Compiler.prototype.cfunction = function (s) {
            asserts_1.assert(s instanceof astnodes_22.FunctionDef);
            var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function (scopename) {
                this.vseqstmt(s.body);
                out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
            });
            this.nameop(s.name, astnodes_43.Store, funcorgen);
        };
        Compiler.prototype.clambda = function (e) {
            asserts_1.assert(e instanceof astnodes_30.Lambda);
            var func = this.buildcodeobj(e, "<lambda>", null, e.args, function (scopename) {
                var val = this.vexpr(e.body);
                out("return ", val, ";");
            });
            return func;
        };
        Compiler.prototype.cifexp = function (e) {
            var next = this.newBlock('next of ifexp');
            var end = this.newBlock('end of ifexp');
            var ret = this._gr('res', 'null');
            var test = this.vexpr(e.test);
            this._jumpfalse(test, next);
            out(ret, '=', this.vexpr(e.body), ';');
            this._jump(end);
            this.setBlock(next);
            out(ret, '=', this.vexpr(e.orelse), ';');
            this._jump(end);
            this.setBlock(end);
            return ret;
        };
        Compiler.prototype.cgenexpgen = function (generators, genIndex, elt) {
            var start = this.newBlock('start for ' + genIndex);
            var skip = this.newBlock('skip for ' + genIndex);
            // var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
            var end = this.newBlock('end for ' + genIndex);
            var ge = generators[genIndex];
            var iter;
            if (genIndex === 0) {
                // the outer most iterator is evaluated in the scope outside so we
                // have to evaluate it outside and store it into the generator as a
                // local, which we retrieve here.
                iter = "$loc.$iter0";
            }
            else {
                var toiter = this.vexpr(ge.iter);
                iter = "$loc." + this.gensym("iter");
                out(iter, "=", "Sk.abstr.iter(", toiter, ");");
            }
            this._jump(start);
            this.setBlock(start);
            // load targets
            var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
            this._jumpundef(nexti, end); // todo; this should be handled by StopIteration
            // var target = this.vexpr(ge.target, nexti);
            var n = ge.ifs.length;
            for (var i = 0; i < n; ++i) {
                var ifres = this.vexpr(ge.ifs[i]);
                this._jumpfalse(ifres, start);
            }
            if (++genIndex < generators.length) {
                this.cgenexpgen(generators, genIndex, elt);
            }
            if (genIndex >= generators.length) {
                var velt = this.vexpr(elt);
                out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
                this.setBlock(skip);
            }
            this._jump(start);
            this.setBlock(end);
            if (genIndex === 1)
                out("return null;");
        };
        Compiler.prototype.cgenexp = function (e) {
            var gen = this.buildcodeobj(e, "<genexpr>", null, null, function (scopename) {
                this.cgenexpgen(e.generators, 0, e.elt);
            });
            // call the generator maker to get the generator. this is kind of dumb,
            // but the code builder builds a wrapper that makes generators for normal
            // function generators, so we just do it outside (even just new'ing it
            // inline would be fine).
            var gener = this._gr("gener", "Sk.misceval.callsim(", gen, ");");
            // stuff the outermost iterator into the generator after evaluating it
            // outside of the function. it's retrieved by the fixed name above.
            out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
            return gener;
        };
        Compiler.prototype.cclass = function (s) {
            asserts_1.assert(s instanceof astnodes_12.ClassDef);
            // var decos = s.decorator_list;
            // decorators and bases need to be eval'd out here
            // this.vseqexpr(decos);
            var bases = this.vseqexpr(s.bases);
            /**
             * @const
             * @type {string}
             */
            var scopename = this.enterScope(s.name, s, s.lineno);
            var entryBlock = this.newBlock('class entry');
            this.u.prefixCode = "var " + scopename + "=(function $" + s.name + "$class_outer($globals,$locals,$rest){var $gbl=$globals,$loc=$locals;";
            this.u.switchCode += "return(function " + s.name + "(){";
            this.u.switchCode += "var $blk=" + entryBlock + ",$exc=[];while(true){switch($blk){";
            this.u.suffixCode = "}break;}}).apply(null,$rest);});";
            this.u.private_ = s.name;
            this.cbody(s.body);
            out("break;");
            // build class
            // apply decorators
            this.exitScope();
            var wrapped = this._gr('built', 'Sk.misceval.buildClass($gbl,', scopename, ',', toStringLiteralJS_1.default(s.name), ',[', bases, '])');
            // store our new class under the right name
            this.nameop(s.name, astnodes_43.Store, wrapped);
        };
        Compiler.prototype.ccontinue = function (s) {
            if (this.u.continueBlocks.length === 0)
                throw new SyntaxError("'continue' outside loop");
            // todo; continue out of exception blocks
            this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
        };
        /**
         * compiles a statement
         */
        Compiler.prototype.vstmt = function (s) {
            this.u.lineno = s.lineno;
            this.u.linenoSet = false;
            this.annotateSource(s);
            switch (s.constructor) {
                case astnodes_22.FunctionDef:
                    this.cfunction(s);
                    break;
                case astnodes_12.ClassDef:
                    this.cclass(s);
                    break;
                case astnodes_41.Return_:
                    if (this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                        throw new SyntaxError("'return' outside function");
                    if (s.value)
                        out("return ", this.vexpr(s.value), ";");
                    else
                        out("return null;");
                    break;
                case astnodes_16.Delete_:
                    this.vseqexpr(s.targets);
                    break;
                case astnodes_3.Assign:
                    var n = s.targets.length;
                    var val = this.vexpr(s.value);
                    for (var i = 0; i < n; ++i)
                        this.vexpr(s.targets[i], val);
                    break;
                case astnodes_5.AugAssign:
                    return this.caugassign(s);
                case astnodes_39.Print:
                    this.cprint(s);
                    break;
                case astnodes_21.For_:
                    return this.cfor(s);
                case astnodes_50.While_:
                    return this.cwhile(s);
                case astnodes_25.If_:
                    return this.cif(s);
                case astnodes_40.Raise:
                    return this.craise(s);
                case astnodes_46.TryExcept:
                    return this.ctryexcept(s);
                case astnodes_47.TryFinally:
                    return this.ctryfinally(s);
                case astnodes_2.Assert:
                    return this.cassert(s);
                case astnodes_27.Import_:
                    return this.cimport(s);
                case astnodes_28.ImportFrom:
                    return this.cfromimport(s);
                case astnodes_24.Global:
                    break;
                case astnodes_19.Expr:
                    this.vexpr(s.value);
                    break;
                case astnodes_38.Pass:
                    break;
                case astnodes_10.Break_:
                    if (this.u.breakBlocks.length === 0)
                        throw new SyntaxError("'break' outside loop");
                    this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
                    break;
                case astnodes_14.Continue_:
                    this.ccontinue(s);
                    break;
                default:
                    asserts_1.fail("unhandled case in vstmt");
            }
        };
        Compiler.prototype.vseqstmt = function (stmts) {
            for (var i = 0; i < stmts.length; ++i)
                this.vstmt(stmts[i]);
        };
        Compiler.prototype.isCell = function (name) {
            var mangled = mangleName(this.u.private_, name);
            var scope = this.u.ste.getScope(mangled);
            if (scope === SymbolConstants_5.CELL)
                return true;
            return false;
        };
        /**
         * @param {string} name
         * @param {Object} ctx
         * @param {string=} dataToStore
         */
        Compiler.prototype.nameop = function (name, ctx, dataToStore) {
            if ((ctx === astnodes_43.Store || ctx === astnodes_7.AugStore || ctx === astnodes_15.Del) && name === "__debug__") {
                throw new SyntaxError("can not assign to __debug__");
            }
            if ((ctx === astnodes_43.Store || ctx === astnodes_7.AugStore || ctx === astnodes_15.Del) && name === "None") {
                throw new SyntaxError("can not assign to None");
            }
            if (name === "None")
                return "Sk.builtin.none.none$";
            if (name === "True")
                return "Sk.ffi.bool.True";
            if (name === "False")
                return "Sk.ffi.bool.False";
            // Have to do this before looking it up in the scope
            var mangled = mangleName(this.u.private_, name);
            var optype = OP_NAME;
            var scope = this.u.ste.getScope(mangled);
            var dict = null;
            switch (scope) {
                case SymbolConstants_4.FREE:
                    dict = "$free";
                    optype = OP_DEREF;
                    break;
                case SymbolConstants_5.CELL:
                    dict = "$cell";
                    optype = OP_DEREF;
                    break;
                case SymbolConstants_1.LOCAL:
                    // can't do FAST in generators or at module/class scope
                    if (this.u.ste.blockType === SymbolConstants_6.FunctionBlock && !this.u.ste.generator)
                        optype = OP_FAST;
                    break;
                case SymbolConstants_3.GLOBAL_IMPLICIT:
                    if (this.u.ste.blockType === SymbolConstants_6.FunctionBlock)
                        optype = OP_GLOBAL;
                    break;
                case SymbolConstants_2.GLOBAL_EXPLICIT:
                    optype = OP_GLOBAL;
                default:
                    break;
            }
            // have to do this after looking it up in the scope
            mangled = fixReservedNames(mangled);
            mangled = fixReservedWords(mangled);
            // print("mangled", mangled);
            // TODO TODO TODO todo; import * at global scope failing here
            asserts_1.assert(scope || name.charAt(1) === '_');
            // in generator or at module scope, we need to store to $loc, rather that
            // to actual JS stack variables.
            var mangledNoPre = mangled;
            if (this.u.ste.generator || this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                mangled = "$loc." + mangled;
            else if (optype === OP_FAST || optype === OP_NAME)
                this.u.localnames.push(mangled);
            switch (optype) {
                case OP_FAST:
                    switch (ctx) {
                        case astnodes_33.Load:
                        case astnodes_37.Param:
                            // Need to check that it is bound!
                            out("if (typeof ", mangled, " === 'undefined') { throw new Error('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                            return mangled;
                        case astnodes_43.Store:
                            out(mangled, "=", dataToStore, ";");
                            break;
                        case astnodes_15.Del:
                            out("delete ", mangled, ";");
                            break;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_NAME:
                    switch (ctx) {
                        case astnodes_33.Load:
                            var v = this.gensym('loadname');
                            // can't be || for loc.x = 0 or null
                            out("var ", v, "=(typeof ", mangled, " !== 'undefined') ? ", mangled, ":Sk.misceval.loadname('", mangledNoPre, "',$gbl);");
                            return v;
                        case astnodes_43.Store:
                            out(mangled, "=", dataToStore, ";");
                            break;
                        case astnodes_15.Del:
                            out("delete ", mangled, ";");
                            break;
                        case astnodes_37.Param:
                            return mangled;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_GLOBAL:
                    switch (ctx) {
                        case astnodes_33.Load:
                            return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                        case astnodes_43.Store:
                            out("$gbl.", mangledNoPre, "=", dataToStore, ';');
                            break;
                        case astnodes_15.Del:
                            out("delete $gbl.", mangledNoPre);
                            break;
                        default:
                            asserts_1.fail("unhandled case in name op_global");
                    }
                    break;
                case OP_DEREF:
                    switch (ctx) {
                        case astnodes_33.Load:
                            return dict + "." + mangledNoPre;
                        case astnodes_43.Store:
                            out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                            break;
                        case astnodes_37.Param:
                            return mangledNoPre;
                        default:
                            asserts_1.fail("unhandled case in name op_deref");
                    }
                    break;
                default:
                    asserts_1.fail("unhandled case");
            }
        };
        /**
         * @method enterScope
         * @param {string} name
         * @return {string} The generated name of the scope, usually $scopeN.
         */
        Compiler.prototype.enterScope = function (name, key, lineno) {
            var u = new CompilerUnit();
            u.ste = this.st.getStsForAst(key);
            u.name = name;
            u.firstlineno = lineno;
            if (this.u && this.u.private_)
                u.private_ = this.u.private_;
            this.stack.push(this.u);
            this.allUnits.push(u);
            var scopeName = this.gensym('scope');
            u.scopename = scopeName;
            this.u = u;
            this.u.activateScope();
            this.nestlevel++;
            return scopeName;
        };
        Compiler.prototype.exitScope = function () {
            var prev = this.u;
            this.nestlevel--;
            if (this.stack.length - 1 >= 0)
                this.u = this.stack.pop();
            else
                this.u = null;
            if (this.u)
                this.u.activateScope();
            if (prev.name !== "<module>") {
                var mangled = prev.name;
                mangled = fixReservedWords(mangled);
                mangled = fixReservedNames(mangled);
                out(prev.scopename, ".co_name=Sk.builtin.stringToPy('", mangled, "');");
            }
        };
        Compiler.prototype.cbody = function (stmts) {
            for (var i = 0; i < stmts.length; ++i) {
                this.vstmt(stmts[i]);
            }
        };
        Compiler.prototype.cprint = function (s) {
            asserts_1.assert(s instanceof astnodes_39.Print);
            var dest = 'null';
            if (s.dest) {
                dest = this.vexpr(s.dest);
            }
            var n = s.values.length;
            for (var i = 0; i < n; ++i) {
                out("Sk.misceval.print_(Sk.ffi.remapToJs(new Sk.builtins.str(", this.vexpr(s.values[i]), ")));");
            }
            if (s.nl) {
                out("Sk.misceval.print_('\\n');");
            }
        };
        Compiler.prototype.cmod = function (mod) {
            /**
             * @const
             * @type {string}
             */
            var modf = this.enterScope("<module>", mod, 0);
            var entryBlock = this.newBlock('module entry');
            this.u.prefixCode = "var " + modf + "=(function($modname){";
            this.u.varDeclsCode = "var $blk=" + entryBlock + ",$exc=[],$gbl={},$loc=$gbl,$err;$gbl.__name__=$modname;Sk.globals=$gbl;";
            this.u.switchCode = "try {while(true){try{switch($blk){";
            this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}}catch(err){if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) { Sk.misceval.print_(err.toString() + '\\n'); return $loc; } else { throw err; } } });";
            switch (mod.constructor) {
                case astnodes_34.Module:
                    this.cbody(mod.body);
                    out("return $loc;");
                    break;
                default:
                    asserts_1.fail("todo; unhandled case in compilerMod");
            }
            this.exitScope();
            this.result.push(this.outputAllUnits());
            return modf;
        };
        return Compiler;
    }());
    /**
     * Appends "_$rw$" to any word that is in the list of reserved words.
     */
    function fixReservedWords(word) {
        if (reservedWords_1.default[word] !== true) {
            return word;
        }
        return word + "_$rw$";
    }
    /**
     * Appends "_$rn$" to any name that is in the list of reserved names.
     */
    function fixReservedNames(name) {
        if (reservedNames_1.default[name])
            return name + "_$rn$";
        return name;
    }
    /**
     * @param {string} priv
     * @param {string} name
     * @return {string} The mangled name.
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
        return '_' + strpriv + name;
    }
    /**
     * @param {string} source the code
     * @param {string} fileName where it came from
     *
     * @return {{funcname: string, code: string}}
     */
    function compile(source, fileName) {
        var cst = parser_1.parse(fileName, source);
        var ast = builder_1.astFromParse(cst, fileName);
        var st = symtable_1.symbolTable(ast, fileName);
        var c = new Compiler(fileName, st, 0, source);
        return { 'funcname': c.cmod(ast), 'code': c.result.join('') };
    }
    exports.compile = compile;
    ;
    function resetCompiler() {
        gensymCount = 0;
    }
    exports.resetCompiler = resetCompiler;
    ;
});
