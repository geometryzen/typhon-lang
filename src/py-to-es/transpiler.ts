/// <reference path = "../../node_modules/typescript/lib/typescriptServices.d.ts" />

import { assert } from '../pytools/asserts';
import { isArray, isNumber } from '../pytools/base';
import { parse } from '../pytools/parser';
import { astFromParse } from '../pytools/builder';
import reservedNames from '../pytools/reservedNames';
import reservedWords from '../pytools/reservedWords';
import SymbolTable from '../pytools/SymbolTable';
import SymbolTableScope from '../pytools/SymbolTableScope';
import { symbolTable } from '../pytools/symtable';
import { toStringLiteralJS } from '../pytools/toStringLiteralJS';

// import {And} from '../pytools/types';
import { Assert } from '../pytools/types';
import { Assign } from '../pytools/types';
import { Attribute } from '../pytools/types';
import { AugAssign } from '../pytools/types';
import { AugLoad } from '../pytools/types';
import { AugStore } from '../pytools/types';
import { BinOp } from '../pytools/types';
import { BoolOp } from '../pytools/types';
import { BreakStatement } from '../pytools/types';
import { Call } from '../pytools/types';
import { ClassDef } from '../pytools/types';
import { Compare } from '../pytools/types';
import { ContinueStatement } from '../pytools/types';
import { Del } from '../pytools/types';
import { DeleteExpression } from '../pytools/types';
import { Dict } from '../pytools/types';
import { Ellipsis } from '../pytools/types';
import { Expr } from '../pytools/types';
import { Expression } from '../pytools/types';
import { ExtSlice } from '../pytools/types';
import { ForStatement } from '../pytools/types';
import { FunctionDef } from '../pytools/types';
import { GeneratorExp } from '../pytools/types';
import { Global } from '../pytools/types';
import { IfStatement } from '../pytools/types';
import { IfExp } from '../pytools/types';
import { ImportStatement } from '../pytools/types';
import { ImportFrom } from '../pytools/types';
import { Index } from '../pytools/types';
import { Lambda } from '../pytools/types';
import { List } from '../pytools/types';
import { ListComp } from '../pytools/types';
import { Load } from '../pytools/types';
import { Module } from '../pytools/types';
import { Name } from '../pytools/types';
import { Num } from '../pytools/types';
import { Param } from '../pytools/types';
import { Pass } from '../pytools/types';
import { Print } from '../pytools/types';
import { Raise } from '../pytools/types';
import { ReturnStatement } from '../pytools/types';
import { Slice } from '../pytools/types';
import { Statement } from '../pytools/types';
import { Store } from '../pytools/types';
import { Str } from '../pytools/types';
import { Subscript } from '../pytools/types';
import { TryExcept } from '../pytools/types';
import { TryFinally } from '../pytools/types';
import { Tuple } from '../pytools/types';
import { UnaryOp } from '../pytools/types';
import { WhileStatement } from '../pytools/types';
import { Yield } from '../pytools/types';

import { LOCAL } from '../pytools/SymbolConstants';
import { GLOBAL_EXPLICIT } from '../pytools/SymbolConstants';
import { GLOBAL_IMPLICIT } from '../pytools/SymbolConstants';
import { FREE } from '../pytools/SymbolConstants';
import { CELL } from '../pytools/SymbolConstants';
import { FunctionBlock } from '../pytools/SymbolConstants';
// TODO: Replace these wit the TypeScript AST
// import {Node} from '../estools/esprima';
// import {generate} from '../estools/escodegen';

const OP_FAST = 0;
const OP_GLOBAL = 1;
const OP_DEREF = 2;
const OP_NAME = 3;
// const D_NAMES = 0;
// const D_FREEVARS = 1;
// const D_CELLVARS = 2;

const Precedence = {
    Sequence: 0,
    Yield: 1,
    Await: 1,
    Assignment: 1,
    Conditional: 2,
    ArrowFunction: 2,
    LogicalOR: 3,
    LogicalAND: 4,
    BitwiseOR: 5,
    BitwiseXOR: 6,
    BitwiseAND: 7,
    Equality: 8,
    Relational: 9,
    BitwiseSHIFT: 10,
    Additive: 11,
    Multiplicative: 12,
    Unary: 13,
    Postfix: 14,
    Call: 15,
    New: 16,
    TaggedTemplate: 17,
    Member: 18,
    Primary: 19
};

// Flags
const F_ALLOW_IN = 1;
const F_ALLOW_CALL = 1 << 1;
const F_ALLOW_UNPARATH_NEW = 1 << 2;
// const F_FUNC_BODY = 1 << 3;
// const F_DIRECTIVE_CTX = 1 << 4;
const F_SEMICOLON_OPT = 1 << 5;

// Expression flag sets
// NOTE: Flag order:
// F_ALLOW_IN
// F_ALLOW_CALL
// F_ALLOW_UNPARATH_NEW
// const E_FTT = F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
// const E_TTF = F_ALLOW_IN | F_ALLOW_CALL;
const E_TTT = F_ALLOW_IN | F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
// const E_TFF = F_ALLOW_IN;
// const E_FFT = F_ALLOW_UNPARATH_NEW;
// const E_TFT = F_ALLOW_IN | F_ALLOW_UNPARATH_NEW;

// Statement flag sets
// NOTE: Flag order:
// F_ALLOW_IN
// F_FUNC_BODY
// F_DIRECTIVE_CTX
// F_SEMICOLON_OPT
const S_TFFF = F_ALLOW_IN;
// const S_TFFT = F_ALLOW_IN | F_SEMICOLON_OPT;
// const S_FFFF = 0x00;
// const S_TFTF = F_ALLOW_IN | F_DIRECTIVE_CTX;
// const S_TTFF = F_ALLOW_IN | F_FUNC_BODY;

/**
 * The output function is scoped at the module level so that it is available without being a parameter.
 * @param {...*} x
 */
let out;

/**
 * We keep track of how many time gensym method on the Compiler is called because ... ?
 */
let gensymCount = 0;

/**
 *
 */
let base;
/**
 *
 */
let indent;
/**
 *
 */
let space;

function updateDeeply(target, override) {
    var key, val;

    function isHashObject(target) {
        return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
    }

    for (key in override) {
        if (override.hasOwnProperty(key)) {
            val = override[key];
            if (isHashObject(val)) {
                if (isHashObject(target[key])) {
                    updateDeeply(target[key], val);
                } else {
                    target[key] = updateDeeply({}, val);
                }
            } else {
                target[key] = val;
            }
        }
    }
    return target;
}

/**
 * flatten an array to a string, where the array can contain
 * either strings or nested arrays
 */
function flattenToString(arr) {
    var i, iz, elem, result = '';
    for (i = 0, iz = arr.length; i < iz; ++i) {
        elem = arr[i];
        result += isArray(elem) ? flattenToString(elem) : elem;
    }
    return result;
}

function withIndent(fn: (base) => any) {
    let previousBase = base;
    base += indent;
    fn(base);
    base = previousBase;
}

/**
 * FIXME: CompilerUnit is coupled to this module by the out variable.
 */
class CompilerUnit {
    ste: SymbolTableScope;
    name: string;
    /**
     * Some sort of private name?
     */
    private_: string;
    firstlineno: number;
    lineno: number;
    /**
     * Has the line number been set?
     */
    linenoSet: boolean;
    localnames: string[];
    blocknum: number;
    /**
     * TODO: What are these blocks?
     */
    blocks: any[];
    curblock: number;
    scopename: string;
    prefixCode: string;
    varDeclsCode: string;
    switchCode: string;
    suffixCode: string;
    breakCode: string;
    breakBlocks: number[];
    continueBlocks: number[];
    exceptBlocks: number[];
    finallyBlocks: number[];
    argnames: any[];
    /**
     * @constructor
     *
     * Stuff that changes on entry/exit of code blocks. must be saved and restored
     * when returning to a block.
     *
     * Corresponds to the body of a module, class, or function.
     */
    constructor() {
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
    activateScope() {
        // The 'arguments' object cannot be referenced in an arrow function in ES3 and ES5.
        // That's why we use a standard function expression.
        const self = this;
        out = function () {
            const b = self.blocks[self.curblock];
            for (let i = 0; i < arguments.length; ++i)
                b.push(arguments[i]);
        };
    }
}

export class Compiler {
    public result: string[];
    private fileName: string;
    private st: SymbolTable;
    private flags: number;
    private interactive: boolean;
    private nestlevel: number;
    private u: CompilerUnit;
    private stack: CompilerUnit[];
    private allUnits: CompilerUnit[];
    private source: string[] | boolean;
    /**
     * @constructor
     * @param fileName {string}
     * @param st {SymbolTable}
     * @param flags {number}
     * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
     */
    constructor(fileName: string, st: SymbolTable, flags: number, sourceCodeForAnnotation: string) {
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

    getSourceLine(lineno: number) {
        assert(!!this.source);
        return this.source[lineno - 1];
    }

    annotateSource(ast) {
        if (this.source) {
            // const lineno = ast.lineno;
            const col_offset = ast.col_offset;
            // out('\n//');
            // out('\n// line ', lineno, ':');
            // out('\n// ', this.getSourceLine(lineno));

            //
            // out('\n// ');
            for (var i = 0; i < col_offset; ++i) {
                out(" ");
            }
            // out("^");

            // out("\n//");

            // out('\nSk.currLineNo = ', lineno, ';Sk.currColNo = ', col_offset, ';');
            // out("\nSk.currFilename = '", this.fileName, "';\n\n");
        }
    }

    gensym(hint?: string): string {
        hint = hint || '';
        hint = '$' + hint;
        hint += gensymCount++;
        return hint;
    }

    niceName(roughName: string): string {
        return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
    }

    emitArgs(arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any, argA?: any, argB?: any, argC?: any, argD?: any, argE?: any): void {
        for (let i = 1; i < arguments.length; ++i) {
            out(arguments[i]);
        }
    }

    ctupleorlist(e, data, tuporlist) {
        assert(tuporlist === 'tuple' || tuporlist === 'list');
        if (e.ctx === Store) {
            for (let i = 0; i < e.elts.length; ++i) {
                this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
            }
        }
        else if (e.ctx === Load) {
            // const items = [];
            for (let i = 0; i < e.elts.length; ++i) {
                // items.push(this.emitArgs('elem', this.vexpr(e.elts[i])));
            }
        }
    }

    cdict(e) {
        assert(e.values.length === e.keys.length);
        const items = [];
        for (var i = 0; i < e.values.length; ++i) {
            var v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
            items.push(this.vexpr(e.keys[i]));
            items.push(v);
        }
    }

    clistcompgen(tmpname, generators, genIndex, elt) {
        var start = this.newBlock('list gen start');
        var skip = this.newBlock('list gen skip');
        var anchor = this.newBlock('list gen anchor');

        var l = generators[genIndex];
        // const toiter = this.vexpr(l.iter);
        this.setBlock(start);

        var n = l.ifs.length;
        for (var i = 0; i < n; ++i) {
            // var ifres = this.vexpr(l.ifs[i]);
        }

        if (++genIndex < generators.length) {
            this.clistcompgen(tmpname, generators, genIndex, elt);
        }

        if (genIndex >= generators.length) {
            var velt = this.vexpr(elt);
            out(tmpname, ".v.push(", velt, ");");
            this.setBlock(skip);
        }

        this.setBlock(anchor);

        return tmpname;
    }

    clistcomp(e: ListComp) {
        assert(e instanceof ListComp);
        // return this.clistcompgen(tmp, e.generators, 0, e.elt);
    }

    cyield(e) {
        if (this.u.ste.blockType !== FunctionBlock)
            throw new SyntaxError("'yield' outside function");
        var val = 'null';
        if (e.value)
            val = this.vexpr(e.value);
        var nextBlock = this.newBlock('after yield');
        // return a pair: resume target block and yielded value
        out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
        this.setBlock(nextBlock);
        return '$gen.gi$sentvalue'; // will either be null if none sent, or the value from gen.send(value)
    }

    ccompare(e: Compare) {
        assert(e.ops.length === e.comparators.length);
        var cur = this.vexpr(e.left);
        var n = e.ops.length;
        var done = this.newBlock("done");

        for (var i = 0; i < n; ++i) {
            var rhs = this.vexpr(e.comparators[i]);
            cur = rhs;
        }
        this.setBlock(done);
    }

    ccall(e: Call): void {
        const func = this.vexpr(e.func);
        const args = this.vseqexpr(e.args);

        if (e.keywords.length > 0 || e.starargs || e.kwargs) {
            const kwarray: string[] = [];
            for (let i = 0; i < e.keywords.length; ++i) {
                kwarray.push("'" + e.keywords[i].arg + "'");
                kwarray.push(this.vexpr(e.keywords[i].value));
            }
            // const keywords = "[" + kwarray.join(",") + "]";
            let starargs = "undefined";
            let kwargs = "undefined";
            if (e.starargs) {
                starargs = this.vexpr(e.starargs);
            }
            if (e.kwargs) {
                kwargs = this.vexpr(e.kwargs);
            }
        }
        else {
            this.emitArgs(func, "(", args, ")");
        }
    }

    cslice(s) {
        assert(s instanceof Slice);
        // const low = s.lower ? this.vexpr(s.lower) : 'null';
        // const high = s.upper ? this.vexpr(s.upper) : 'null';
        // const step = s.step ? this.vexpr(s.step) : 'null';
    }

    vslicesub(s) {
        var subs;
        switch (s.constructor) {
            case Number:
            case String:
                // Already compiled, should only happen for augmented assignments
                subs = s;
                break;
            case Index:
                subs = this.vexpr(s.value);
                break;
            case Slice:
                subs = this.cslice(s);
                break;
            case Ellipsis:
            case ExtSlice:
                throw new Error("todo;");
            // break;
            default:
                throw new Error("invalid subscript kind");
        }
        return subs;
    }

    vslice(s, ctx, obj, dataToStore) {
        var subs = this.vslicesub(s);
        return this.chandlesubscr(ctx, obj, subs, dataToStore);
    }

    chandlesubscr(ctx, obj, subs, data) {
        if (ctx === Load || ctx === AugLoad) {
            // TODO
        }
        else if (ctx === Store || ctx === AugStore)
            out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
        else if (ctx === Del)
            out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
        else
            throw new Error("handlesubscr fail");
    }

    cboolop(e) {
        assert(e instanceof BoolOp);
        var end = this.newBlock('end of boolop');
        var s = e.values;
        var n = s.length;
        var retval;
        for (var i = 0; i < n; ++i) {
            var expres = this.vexpr(s[i]);
            if (i === 0) {
                // TODO
            }
            out(retval, " = ", expres, ";");
        }
        this.setBlock(end);
        return retval;
    }

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
    vexpr(e, data?, augstoreval?) {
        if (e.lineno > this.u.lineno) {
            this.u.lineno = e.lineno;
            this.u.linenoSet = false;
        }
        // this.annotateSource(e);
        switch (e.constructor) {
            case BoolOp:
                return this.cboolop(e);
            case BinOp:
                return this.emitArgs('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
            case UnaryOp:
                return this.emitArgs('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
            case Lambda:
                return this.clambda(e);
            case IfExp:
                return this.cifexp(e);
            case Dict:
                return this.cdict(e);
            case ListComp:
                return this.clistcomp(e);
            case GeneratorExp:
                return this.cgenexp(e);
            case Yield:
                return this.cyield(e);
            case Compare:
                return this.ccompare(e);
            case Call:
                var result = this.ccall(e);
                // After the function call, we've returned to this line
                this.annotateSource(e);
                return result;
            case Num: {
                const num = <Num>e;
                if (num.n.isFloat()) {
                    return num.n.value.toString();
                }
                else if (num.n.isInt()) {
                    return num.n.value.toString();
                }
                else if (e.n.isLong()) {
                    return "longFromString('" + e.n.text + "', " + e.n.radix + ")";
                }
                throw new Error("unhandled Num type");
            }
            case Str: {
                const str = <Str>e;
                return toStringLiteralJS(str.s);
            }
            case Attribute:
                var val;
                if (e.ctx !== AugStore)
                    val = this.vexpr(e.value);
                var mangled = toStringLiteralJS(e.attr);
                mangled = mangled.substring(1, mangled.length - 1);
                mangled = mangleName(this.u.private_, mangled);
                mangled = fixReservedWords(mangled);
                mangled = fixReservedNames(mangled);
                switch (e.ctx) {
                    case AugLoad:
                    case Load:
                        return this.emitArgs("lattr", "Sk.abstr.gattr(", val, ",'", mangled, "')");
                    case AugStore:
                        out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                        val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                        out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                        out("}");
                        break;
                    case Store:
                        out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                        break;
                    case Del:
                        throw new Error("todo;");
                    // break;
                    case Param:
                    default:
                        throw new Error("invalid attribute expression");
                }
                break;
            case Subscript:
                switch (e.ctx) {
                    case AugLoad:
                    case Load:
                    case Store:
                    case Del:
                        return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                    case AugStore: {
                        out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                        const val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                        this.vslice(e.slice, e.ctx, val, data);
                        out("}");
                        break;
                    }
                    case Param:
                    default:
                        throw new Error("invalid subscript expression");
                }
                break;
            case Name:
                return this.nameop(e.id, e.ctx, data);
            case List:
                return this.ctupleorlist(e, data, 'list');
            case Tuple:
                return this.ctupleorlist(e, data, 'tuple');
            default:
                throw new Error("unhandled case in vexpr");
        }
    }

    /**
     * @param {Array.<Object>} exprs
     * @param {Array.<string>=} data
     */
    vseqexpr(exprs, data?: string[]) {
        /**
         * @const
         * @type {boolean}
         */
        var missingData = (typeof data === 'undefined');

        assert(missingData || exprs.length === data.length);
        var ret = [];
        for (var i = 0; i < exprs.length; ++i) {
            ret.push(this.vexpr(exprs[i], (missingData ? undefined : data[i])));
        }
        return ret;
    }

    caugassign(s: AugAssign) {
        assert(s instanceof AugAssign);
        const e = s.target;
        switch (e.constructor) {
            case Attribute: {
                const auge = new Attribute(e.value, e.attr, AugLoad, e.lineno, e.col_offset);
                const aug = this.vexpr(auge);
                const val = this.vexpr(s.value);
                const res = this.emitArgs('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                auge.ctx = AugStore;
                return this.vexpr(auge, res, e.value);
            }
            case Subscript: {
                // Only compile the subscript value once
                const augsub = this.vslicesub(e.slice);
                const auge = new Subscript(e.value, augsub, AugLoad, e.lineno, e.col_offset);
                const aug = this.vexpr(auge);
                const val = this.vexpr(s.value);
                const res = this.emitArgs('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                auge.ctx = AugStore;
                return this.vexpr(auge, res, e.value);
            }
            case Name: {
                const to = this.nameop(e.id, Load);
                const val = this.vexpr(s.value);
                const res = this.emitArgs('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
                return this.nameop(e.id, Store, res);
            }
            default:
                throw new Error("unhandled case in augassign");
        }
    }

    /**
     * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
     */
    exprConstant(e) {
        switch (e.constructor) {
            case Num:
                throw new Error("Trying to call the runtime for Num");
            // return Sk.misceval.isTrue(e.n);
            // break;
            case Str:
                throw new Error("Trying to call the runtime for Str");
            // return Sk.misceval.isTrue(e.s);
            // break;
            case Name:
            // todo; do __debug__ test here if opt
            default:
                return -1;
        }
    }

    newBlock(name: string) {
        const ret = this.u.blocknum++;
        this.u.blocks[ret] = [];
        this.u.blocks[ret]._name = name || '<unnamed>';
        return ret;
    }

    setBlock(n: number) {
        assert(n >= 0 && n < this.u.blocknum);
        this.u.curblock = n;
    }

    pushBreakBlock(n: number) {
        assert(n >= 0 && n < this.u.blocknum);
        this.u.breakBlocks.push(n);
    }

    popBreakBlock() {
        this.u.breakBlocks.pop();
    }

    pushContinueBlock(n: number) {
        assert(n >= 0 && n < this.u.blocknum);
        this.u.continueBlocks.push(n);
    }

    popContinueBlock() {
        this.u.continueBlocks.pop();
    }

    pushExceptBlock(n) {
        assert(n >= 0 && n < this.u.blocknum);
        this.u.exceptBlocks.push(n);
    }

    popExceptBlock() {
        this.u.exceptBlocks.pop();
    }

    pushFinallyBlock(n: number) {
        assert(n >= 0 && n < this.u.blocknum);
        this.u.finallyBlocks.push(n);
    }

    popFinallyBlock() {
        this.u.finallyBlocks.pop();
    }

    setupExcept(eb) {
        out("$exc.push(", eb, ");");
        // this.pushExceptBlock(eb);
    }

    endExcept() {
        out("$exc.pop();");
    }

    outputLocals(unit) {
        var have = {};
        for (let i = 0; unit.argnames && i < unit.argnames.length; ++i)
            have[unit.argnames[i]] = true;
        unit.localnames.sort();
        var output = [];
        for (let i = 0; i < unit.localnames.length; ++i) {
            var name = unit.localnames[i];
            if (have[name] === undefined) {
                output.push(name);
                have[name] = true;
            }
        }
        if (output.length > 0)
            return "var " + output.join(",") + "; /* locals */";
        return "";
    }

    outputAllUnits() {
        let ret = '';
        for (let j = 0; j < this.allUnits.length; ++j) {
            const unit = this.allUnits[j];
            ret += unit.prefixCode;
            ret += this.outputLocals(unit);
            ret += unit.varDeclsCode;
            ret += unit.switchCode;
            const blocks = unit.blocks;
            for (let i = 0; i < blocks.length; ++i) {
                // ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
                ret += blocks[i].join('');
                /*
                ret += "throw new Sk.builtin.SystemError('internal error: unterminated block');";
                */
            }
            ret += unit.suffixCode;
        }
        return ret;
    }

    generateExpression(expression: Expression, s, flags?: number): string {
        return "";
    }

    generateStatements(statement: Statement[], s, flags?: number): string {
        return "";
    }

    maybeBlock(one, flags: number): string {
        return "";
    }

    maybeBlockSuffix(one, two): string {
        return "";
    }

    ifStatement(stmt: IfStatement, flags: number) {
        assert(stmt instanceof IfStatement);
        assert(isNumber(flags));
        let result;
        let bodyFlags: number;
        let semicolonOptional: boolean;
        withIndent(() => {
            result = [
                'if' + space + '(',
                this.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                ')'
            ];
        });
        semicolonOptional = !!(flags & F_SEMICOLON_OPT);
        bodyFlags = S_TFFF;
        if (semicolonOptional) {
            bodyFlags |= F_SEMICOLON_OPT;
        }
        if (stmt.alternate) {
            result.push(this.maybeBlock(stmt.consequent, S_TFFF));
            result = this.maybeBlockSuffix(stmt.consequent, result);
            /*
            if (stmt.alternate.type === Syntax.IfStatement) {
                result = join(result, ['else ', this.generateStatements(stmt.alternate, bodyFlags)]);
            } else {
                result = join(result, join('else', this.maybeBlock(stmt.alternate, bodyFlags)));
            }
            */
        } else {
            result.push(this.maybeBlock(stmt.consequent, bodyFlags));
        }
        return result;
    }

    cwhile(s: WhileStatement, flags: number) {
        var constant = this.exprConstant(s.test);
        if (constant === 0) {
            if (s.orelse)
                this.vseqstmt(s.orelse, flags);
        }
        else {
            var top = this.newBlock('while test');
            this.setBlock(top);

            var next = this.newBlock('after while');
            var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
            var body = this.newBlock('while body');

            this.pushBreakBlock(next);
            this.pushContinueBlock(top);

            this.setBlock(body);
            this.vseqstmt(s.body, flags);

            this.popContinueBlock();
            this.popBreakBlock();

            if (s.orelse.length > 0) {
                this.setBlock(orelse);
                this.vseqstmt(s.orelse, flags);
            }

            this.setBlock(next);
        }
    }

    cfor(s: ForStatement, flags: number) {
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
            iter = this.emitArgs("iter", "Sk.abstr.iter(", toiter, ")");

        this.setBlock(start);

        // load targets
        // var nexti = this.emitArgs('next', "Sk.abstr.iternext(", iter, ")");
        // var target = this.vexpr(s.target, nexti);

        // execute body
        this.vseqstmt(s.body, flags);

        this.setBlock(cleanup);
        this.popContinueBlock();
        this.popBreakBlock();

        this.vseqstmt(s.orelse, flags);

        this.setBlock(end);
    }

    craise(s: Raise) {
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
    }

    ctryexcept(s: TryExcept, flags: number) {
        var n = s.handlers.length;

        // Create a block for each except clause
        var handlers = [];
        for (let i = 0; i < n; ++i) {
            handlers.push(this.newBlock("except_" + i + "_"));
        }

        var unhandled = this.newBlock("unhandled");
        var orelse = this.newBlock("orelse");
        var end = this.newBlock("end");

        this.setupExcept(handlers[0]);
        this.vseqstmt(s.body, flags);
        this.endExcept();

        for (let i = 0; i < n; ++i) {
            this.setBlock(handlers[i]);
            var handler = s.handlers[i];
            if (!handler.type && i < n - 1) {
                throw new SyntaxError("default 'except:' must be last");
            }

            if (handler.type) {
                // should jump to next handler if err not isinstance of handler.type
                // var handlertype = this.vexpr(handler.type);
                // var next = (i === n - 1) ? unhandled : handlers[i + 1];

                // this check is not right, should use isinstance, but exception objects
                // are not yet proper Python objects
                // var check = this.emitArgs('instance', "$err instanceof ", handlertype);
            }

            if (handler.name) {
                this.vexpr(handler.name, "$err");
            }

            // Need to execute finally before leaving body if an exception is raised
            this.vseqstmt(handler.body, flags);
        }

        // If no except clause catches exception, throw it again
        this.setBlock(unhandled);
        // Should execute finally first
        out("throw $err;");

        this.setBlock(orelse);
        this.vseqstmt(s.orelse, flags);
        this.setBlock(end);
    }

    ctryfinally(s: TryFinally, flags: number) {
        out("/*todo; tryfinally*/");
        // everything but the finally?
        this.ctryexcept(s.body[0], flags);
    }

    cassert(s: Assert) {
        /* todo; warnings method
        if (s.test instanceof Tuple && s.test.elts.length > 0)
            Sk.warn("assertion is always true, perhaps remove parentheses?");
        */

        // var test = this.vexpr(s.test);
        var end = this.newBlock("end");
        // todo; exception handling
        // maybe replace with fail?? or just an alert?
        out("throw new Sk.builtin.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
        this.setBlock(end);
    }

    /**
     * @param {string} name
     * @param {string} asname
     * @param {string=} mod
     */
    cimportas(name, asname, mod) {
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
                cur = this.emitArgs('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
                src = src.substr(dotLoc + 1);
            }
        }
        return this.nameop(asname, Store, cur);
    }

    cimport(s: ImportStatement) {
        const n = s.names.length;
        for (var i = 0; i < n; ++i) {
            var alias = s.names[i];
            var mod = this.emitArgs('module', 'Sk.builtin.__import__(', toStringLiteralJS(alias.name), ',$gbl,$loc,[])');

            if (alias.asname) {
                this.cimportas(alias.name, alias.asname, mod);
            }
            else {
                var lastDot = alias.name.indexOf('../pytools');
                if (lastDot !== -1) {
                    this.nameop(alias.name.substr(0, lastDot), Store, mod);
                }
                else {
                    this.nameop(alias.name, Store, mod);
                }
            }
        }
    }

    cfromimport(s: ImportFrom) {
        const n = s.names.length;
        const names: string[] = [];
        for (var i = 0; i < n; ++i) {
            names[i] = s.names[i].name;
        }
        // const namesString = names.map(function(name) { return toStringLiteralJS(name); }).join(', ');
        for (let i = 0; i < n; ++i) {
            const alias = s.names[i];
            if (i === 0 && alias.name === "*") {
                assert(n === 1);
                out(`import * from ${toStringLiteralJS(s.module)};`);
                return;
            }
        }
    }

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
    buildcodeobj(n, coname, decorator_list, args, callback) {
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
        var descendantOrSelfHasFree = this.u.ste.hasFree/* || this.u.ste.childHasFree*/;

        var entryBlock: number | string = this.newBlock('codeobj entry');

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
                funcArgs.push(this.nameop(args.args[i].id, Param));
        }
        if (descendantOrSelfHasFree) {
            funcArgs.push("$free");
        }
        this.u.prefixCode += funcArgs.join(",");

        this.u.prefixCode += "){";

        if (isGenerator) this.u.prefixCode += "\n// generator\n";
        if (containingHasFree) this.u.prefixCode += "\n// containing has free\n";
        if (containingHasCell) this.u.prefixCode += "\n// containing has cell\n";
        if (hasFree) this.u.prefixCode += "\n// has free\n";
        if (hasCell) this.u.prefixCode += "\n// has cell\n";

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
        for (let i = 0; args && i < args.args.length; ++i) {
            var id = args.args[i].id;
            if (this.isCell(id)) {
                this.u.varDeclsCode += "$cell." + id + " = " + id + ";";
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
            for (let i = 0; i < defaults.length; ++i) {
                var argname = this.nameop(args.args[i + offset].id, Param);
                this.u.varDeclsCode += "if(typeof " + argname + " === 'undefined')" + argname + " = " + scopename + ".$defaults[" + i + "];";
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
            for (let i = 0; i < args.args.length; ++i) {
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
        // build either a 'function' or 'generator'../pytools the function is just a simple
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
                return this.emitArgs("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgs(\"",
                    coname, "\",arguments,", args.args.length - defaults.length, ",", args.args.length,
                    ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
            }
            else {
                return this.emitArgs("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgs(\"", coname,
                    "\",arguments,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
            }
        else {
            return this.emitArgs("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
        }
    }

    cfunction(s: FunctionDef) {
        assert(s instanceof FunctionDef);
        var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args,
            (scopename) => {
                this.vseqstmt(s.body);
                out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
            }
        );
        this.nameop(s.name, Store, funcorgen);
    }

    clambda(e) {
        assert(e instanceof Lambda);
        var func = this.buildcodeobj(e, "<lambda>", null, e.args, (scopename) => {
            var val = this.vexpr(e.body);
            out("return ", val, ";");
        });
        return func;
    }

    cifexp(e) {
        var next = this.newBlock('next of ifexp');
        var end = this.newBlock('end of ifexp');
        var ret = this.emitArgs('res', 'null');

        // var test = this.vexpr(e.test);

        out(ret, '=', this.vexpr(e.body), ';');

        this.setBlock(next);
        out(ret, '=', this.vexpr(e.orelse), ';');

        this.setBlock(end);
        return ret;
    }

    cgenexpgen(generators, genIndex, elt) {
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
            out(iter, " = ", "Sk.abstr.iter(", toiter, ");");
        }
        this.setBlock(start);

        // load targets
        // var nexti = this.emitArgs('next', "Sk.abstr.iternext(", iter, ")");
        // var target = this.vexpr(ge.target, nexti);

        var n = ge.ifs.length;
        for (var i = 0; i < n; ++i) {
            // var ifres = this.vexpr(ge.ifs[i]);
        }

        if (++genIndex < generators.length) {
            this.cgenexpgen(generators, genIndex, elt);
        }

        if (genIndex >= generators.length) {
            var velt = this.vexpr(elt);
            out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
            this.setBlock(skip);
        }

        this.setBlock(end);

        if (genIndex === 1)
            out("return null;");
    }

    cgenexp(e) {
        var gen = this.buildcodeobj(e, "<genexpr>", null, null,
            (scopename) => {
                this.cgenexpgen(e.generators, 0, e.elt);
            });

        // call the generator maker to get the generator. this is kind of dumb,
        // but the code builder builds a wrapper that makes generators for normal
        // function generators, so we just do it outside (even just new'ing it
        // inline would be fine).
        var gener = this.emitArgs("gener", "Sk.misceval.callsim(", gen, ");");
        // stuff the outermost iterator into the generator after evaluating it
        // outside of the function. it's retrieved by the fixed name above.
        out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
        return gener;
    }



    cclass(s: ClassDef, flags: number) {
        assert(s instanceof ClassDef);
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

        this.cbody(s.body, flags);
        out("break;");

        // build class

        // apply decorators

        this.exitScope();

        var wrapped = this.emitArgs('built', 'Sk.misceval.buildClass($gbl,', scopename, ',', toStringLiteralJS(s.name), ',[', bases, '])');

        // store our new class under the right name
        this.nameop(s.name, Store, wrapped);
    }

    ccontinue(s: ContinueStatement) {
        if (this.u.continueBlocks.length === 0)
            throw new SyntaxError("'continue' outside loop");
    }

    /**
     * compiles a statement
     */
    vstmt(s: Statement, flags: number) {
        this.u.lineno = s.lineno;
        this.u.linenoSet = false;

        this.annotateSource(s);

        switch (s.constructor) {
            case FunctionDef:
                this.cfunction(<FunctionDef>s);
                break;
            case ClassDef:
                this.cclass(<ClassDef>s, flags);
                break;
            case ReturnStatement: {
                const rs = <ReturnStatement>s;
                if (this.u.ste.blockType !== FunctionBlock)
                    throw new SyntaxError("'return' outside function");
                if (rs.value)
                    out("return ", this.vexpr(rs.value), ";");
                else
                    out("return null;");
                break;
            }
            case DeleteExpression:
                this.vseqexpr((<DeleteExpression>s).targets);
                break;
            case Assign: {
                const assign = <Assign>s;
                var n = assign.targets.length;
                var val = this.vexpr(assign.value);
                for (var i = 0; i < n; ++i)
                    this.vexpr(assign.targets[i], val);
                break;
            }
            case AugAssign: {
                return this.caugassign(<AugAssign>s);
            }
            case Print: {
                this.cprint(<Print>s);
                break;
            }
            case ForStatement: {
                return this.cfor(<ForStatement>s, flags);
            }
            case WhileStatement: {
                return this.cwhile(<WhileStatement>s, flags);
            }
            case IfStatement: {
                return this.ifStatement(<IfStatement>s, flags);
            }
            case Raise: {
                return this.craise(<Raise>s);
            }
            case TryExcept: {
                return this.ctryexcept(<TryExcept>s, flags);
            }
            case TryFinally: {
                return this.ctryfinally(<TryFinally>s, flags);
            }
            case Assert: {
                return this.cassert(<Assert>s);
            }
            case ImportStatement:
                return this.cimport(<ImportStatement>s);
            case ImportFrom:
                return this.cfromimport(<ImportFrom>s);
            case Global:
                break;
            case Expr:
                this.vexpr((<Expr>s).value);
                break;
            case Pass:
                break;
            case BreakStatement:
                if (this.u.breakBlocks.length === 0)
                    throw new SyntaxError("'break' outside loop");
                break;
            case ContinueStatement:
                this.ccontinue(<ContinueStatement>s);
                break;
            default:
                throw new Error("unhandled case in vstmt");
        }
    }

    vseqstmt(stmts: Statement[], flags?: number) {
        for (let i = 0; i < stmts.length; ++i) this.vstmt(stmts[i], flags);
    }

    isCell(name: string): boolean {
        var mangled = mangleName(this.u.private_, name);
        var scope = this.u.ste.getScope(mangled);
        if (scope === CELL)
            return true;
        return false;
    }

    /**
     * @param {string} name
     * @param {Object} ctx
     * @param {string=} dataToStore
     */
    nameop(name: string, ctx, dataToStore?): string {
        if ((ctx === Store || ctx === AugStore || ctx === Del) && name === "__debug__") {
            throw new SyntaxError("can not assign to __debug__");
        }
        if ((ctx === Store || ctx === AugStore || ctx === Del) && name === "None") {
            throw new SyntaxError("can not assign to None");
        }

        if (name === "None") return "Sk.builtin.none.none$";
        if (name === "True") return "Sk.ffi.bool.True";
        if (name === "False") return "Sk.ffi.bool.False";

        // Have to do this before looking it up in the scope
        var mangled = mangleName(this.u.private_, name);
        var optype = OP_NAME;
        var scope = this.u.ste.getScope(mangled);
        var dict = null;
        switch (scope) {
            case FREE:
                dict = "$free";
                optype = OP_DEREF;
                break;
            case CELL:
                dict = "$cell";
                optype = OP_DEREF;
                break;
            case LOCAL:
                // can't do FAST in generators or at module/class scope
                if (this.u.ste.blockType === FunctionBlock && !this.u.ste.generator)
                    optype = OP_FAST;
                break;
            case GLOBAL_IMPLICIT:
                if (this.u.ste.blockType === FunctionBlock)
                    optype = OP_GLOBAL;
                break;
            case GLOBAL_EXPLICIT:
                optype = OP_GLOBAL;
            default:
                break;
        }

        // have to do this after looking it up in the scope
        mangled = fixReservedNames(mangled);
        mangled = fixReservedWords(mangled);

        // print("mangled", mangled);
        // TODO TODO TODO todo; import * at global scope failing here
        assert(scope || name.charAt(1) === '_');

        // in generator or at module scope, we need to store to $loc, rather that
        // to actual JS stack variables.
        const mangledNoPre = mangled;
        if (this.u.ste.generator || this.u.ste.blockType !== FunctionBlock) {
            // No need to change mangled.
        }
        else if (optype === OP_FAST || optype === OP_NAME)
            this.u.localnames.push(mangled);

        switch (optype) {
            case OP_FAST:
                switch (ctx) {
                    case Load:
                    case Param:
                        // Need to check that it is bound!
                        out("if (typeof ", mangled, " === 'undefined') { throw new Error('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                        return mangled;
                    case Store:
                        out(mangled, " = ", dataToStore, ";");
                        break;
                    case Del:
                        out("delete ", mangled, ";");
                        break;
                    default:
                        throw new Error("unhandled");
                }
                break;
            case OP_NAME:
                switch (ctx) {
                    case Load:
                        out(mangledNoPre);
                        break;
                    case Store:
                        out(mangled, " = ", dataToStore, ";");
                        break;
                    case Del:
                        out("delete ", mangled, ";");
                        break;
                    case Param:
                        return mangled;
                    default:
                        throw new Error("unhandled");
                }
                break;
            case OP_GLOBAL:
                switch (ctx) {
                    case Load:
                        return mangledNoPre;
                    case Store:
                        out("$gbl.", mangledNoPre, " = ", dataToStore, ';');
                        break;
                    case Del:
                        out("delete $gbl.", mangledNoPre);
                        break;
                    default:
                        throw new Error("unhandled case in name op_global");
                }
                break;
            case OP_DEREF:
                switch (ctx) {
                    case Load:
                        return dict + "." + mangledNoPre;
                    case Store:
                        out(dict, ".", mangledNoPre, " = ", dataToStore, ";");
                        break;
                    case Param:
                        return mangledNoPre;
                    default:
                        throw new Error("unhandled case in name op_deref");
                }
                break;
            default:
                throw new Error("unhandled case");
        }
        throw new Error("TODO");
    }

    /**
     * @method enterScope
     * @param {string} name
     * @return {string} The generated name of the scope, usually $scopeN.
     */
    enterScope(name: string, key, lineno: number) {
        const u = new CompilerUnit();
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
    }

    exitScope() {
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
    }

    /**
     *
     */
    cbody(stmts: Statement[], flags: number) {
        for (let i = 0; i < stmts.length; ++i) {
            this.vstmt(stmts[i], flags);
        }
    }

    cprint(s: Print) {
        assert(s instanceof Print);
        var dest = 'null';
        if (s.dest) {
            dest = this.vexpr(s.dest);
        }

        var n = s.values.length;
        for (var i = 0; i < n; ++i) {
            // out("Sk.misceval.print_(Sk.ffi.remapToJs(new Sk.builtins.str(", this.vexpr(s.values[i]), ")));");
        }
        if (s.nl) {
            // out("Sk.misceval.print_('\\n');");
        }
    }

    cmod(mod: Module, flags: number) {

        const modf = this.enterScope("<module>", mod, 0);

        /* const entryBlock = */ this.newBlock('module entry');
        // this.u.prefixCode = "var " + modf + "=(function($modname){";
        // this.u.varDeclsCode = "var $blk=" + entryBlock + ",$exc=[],$gbl={},$loc=$gbl,$err;$gbl.__name__=$modname;Sk.globals=$gbl;";

        // this.u.switchCode = "try {while(true){try{switch($blk){";
        // this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}}catch(err){if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) { Sk.misceval.print_(err.toString() + '\\n'); return $loc; } else { throw err; } } });";

        switch (mod.constructor) {
            case Module:
                this.cbody(mod.body, flags);
                break;
            default:
                throw new Error("todo; unhandled case in compilerMod");
        }
        this.exitScope();

        this.result.push(this.outputAllUnits());
        return modf;
    }

}

/**
 * Appends "_$rw$" to any word that is in the list of reserved words.
 */
function fixReservedWords(word: string): string {
    if (reservedWords[word] !== true) {
        return word;
    }
    return word + "_$rw$";
}

/**
 * Appends "_$rn$" to any name that is in the list of reserved names.
 */
function fixReservedNames(name: string): string {
    if (reservedNames[name])
        return name + "_$rn$";
    return name;
}

/**
 * @param {string} priv
 * @param {string} name
 * @return {string} The mangled name.
 */
function mangleName(priv: string, name: string): string {
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
 * @return {{code: string}}
 */
export function compile(source: string, fileName: string): { code: string } {
    const node: ts.Node = transpile(source, fileName);
    // TODO: We need a serializer from TypeScript.
    const code = `Need serializer from TypeScript ${node}`;
    //  const code = generate(node, {});
    return { code };
}

export function resetCompiler() {
    gensymCount = 0;
}

/**
 * Transpiles from Python to JavaScript.
 */
class Transpiler {
    public result: string[];
    private fileName: string;
    private st: SymbolTable;
    private flags: number;
    private interactive: boolean;
    private nestlevel: number;
    private u: CompilerUnit;
    private stack: CompilerUnit[];
    private allUnits: CompilerUnit[];
    private source: string[] | boolean;
    constructor(fileName: string, st: SymbolTable, flags: number, sourceCodeForAnnotation: string) {
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
    module(ast: Module, flags: number): ts.Node {
        // const node: ts.Node = new Node();
        // const body = this.statementList(ast.body, flags);
        // node.finishProgram(body);
        // return node;
        throw new Error(`TODO: module`);
    }
    statementList(stmts: Statement[], flags): ts.Node[] {
        const nodes: ts.Node[] = [];
        const iLen = stmts.length;
        for (let i = 0; i < iLen; i++) {
            const stmt = stmts[i];
            nodes.push(this.statement(stmt, flags));
        }
        return nodes;
    }
    statement(s: Statement, flags: number): ts.Node {
        // this.u.lineno = s.lineno;
        // this.u.linenoSet = false;

        //        this.annotateSource(s);

        switch (s.constructor) {
            case FunctionDef:
                return this.functionDef(<FunctionDef>s, flags);
            case ClassDef:
                return this.classDef(<ClassDef>s, flags);
            case ReturnStatement: {
                return this.returnStatement(<ReturnStatement>s, flags);
            }
            case DeleteExpression:
                return this.deleteExpression((<DeleteExpression>s), flags);
            case Assign: {
                return this.assign(<Assign>s, flags);
            }
            case AugAssign: {
                return this.augAssign(<AugAssign>s, flags);
            }
            case Print: {
                this.print(<Print>s, flags);
                throw new Error("Print");
                // break;
            }
            case ForStatement: {
                return this.forStatement(<ForStatement>s, flags);
            }
            case WhileStatement: {
                return this.whileStatement(<WhileStatement>s, flags);
            }
            case IfStatement: {
                return this.ifStatement(<IfStatement>s, flags);
            }
            case Raise: {
                return this.raise(<Raise>s, flags);
            }
            case TryExcept: {
                return this.tryExcept(<TryExcept>s, flags);
            }
            case TryFinally: {
                return this.tryFinally(<TryFinally>s, flags);
            }
            case Assert: {
                return this.assert(<Assert>s, flags);
            }
            case ImportStatement:
                return this.importStatement(<ImportStatement>s, flags);
            case ImportFrom:
                return this.importFrom(<ImportFrom>s, flags);
            case Global:
                throw new Error("Gloabl");
            // break;
            case Expr:
                return this.expr((<Expr>s), flags);
            case Pass:
                throw new Error("Pass");
            // break;
            case BreakStatement:
                return this.breakStatement((<BreakStatement>s), flags);
            case ContinueStatement:
                return this.continueStatement(<ContinueStatement>s, flags);
            default:
                throw new Error("statement");
        }
    }
    assert(a: Assert, flags: number): ts.Node {
        throw new Error("Assert");
    }
    breakStatement(b: BreakStatement, flags: number): ts.Node {
        /*
        if (this.u.breakBlocks.length === 0)
            throw new SyntaxError("'break' outside loop");
        break;
        */
        throw new Error("BreakStatement");
    }
    classDef(c: ClassDef, flags: number): ts.Node {
        throw new Error("ClassDef");
    }
    continueStatement(c: ContinueStatement, flags: number): ts.Node {
        throw new Error("ContinueStatement");
    }
    forStatement(fs: ForStatement, flags: number): ts.Node {
        throw new Error("ForStatement");
    }
    functionDef(f: FunctionDef, flags: number): ts.Node {
        throw new Error("FunctionDef");
    }
    ifStatement(fs: IfStatement, flags: number): ts.Node {
        throw new Error("IfStatement");
    }
    importFrom(i: ImportFrom, flags: number): ts.Node {
        // const node = new Node();
        // node.fi
        throw new Error("ImportFrom");
    }
    importStatement(i: ImportStatement, flags: number): ts.Node {
        throw new Error("ImportStatement");
    }
    returnStatement(rs: ReturnStatement, flags: number): ts.Node {
        /*
        if (this.u.ste.blockType !== FunctionBlock)
            throw new SyntaxError("'return' outside function");
        if (rs.value)
            out("return ", this.vexpr(rs.value), ";");
        else
            out("return null;");
        */
        throw new Error("ClassDef");
    }
    deleteExpression(de: DeleteExpression, flags: number): ts.Node {
        throw new Error("DeleteExpression");
    }
    assign(assign: Assign, flags: number): ts.Node {
        // const node = new Node();
        // node.finishAssignmentExpression(operator, left, right);
        /*
        var n = assign.targets.length;
        var val = this.vexpr(assign.value);
        for (var i = 0; i < n; ++i)
            this.vexpr(assign.targets[i], val);
        */
        // return node;
        throw new Error("Assign");
    }
    augAssign(aa: AugAssign, flags: number): ts.Node {
        throw new Error("FunctionDef");
    }
    expr(expr: Expr, flags: number): ts.Node {
        throw new Error("Expr");
    }
    print(p: Print, flags: number): ts.Node {
        throw new Error("Print");
    }
    raise(raise: Raise, flags: number): ts.Node {
        throw new Error("Raise");
    }
    tryExcept(te: TryExcept, flags: number): ts.Node {
        throw new Error("TryExcept");
    }
    tryFinally(tf: TryFinally, flags: number): ts.Node {
        throw new Error("TryFinally");
    }
    whileStatement(ws: WhileStatement, flags: number): ts.Node {
        throw new Error("WhileStatement");
    }
}

export function transpile(source: string, fileName: string): ts.Node {
    const cst = parse(fileName, source);
    const ast = astFromParse(cst, fileName);
    const st = symbolTable(ast, fileName);
    const t = new Transpiler(fileName, st, 0, source);
    const flags = 0;
    return t.module(ast, flags);
}
