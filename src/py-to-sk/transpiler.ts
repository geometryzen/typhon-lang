import { assert, fail } from '../pytools/asserts';
import { parse, SourceKind } from '../pytools/parser';
import { astFromParse } from '../pytools/builder';
import { reservedNames } from '../pytools/reservedNames';
import { reservedWords } from '../pytools/reservedWords';
import { SymbolTable } from '../pytools/SymbolTable';
import { SymbolTableScope } from '../pytools/SymbolTableScope';
import { semanticsOfModule } from '../pytools/symtable';
import { toStringLiteralJS } from '../pytools/toStringLiteralJS';

import { Alias } from '../pytools/types';
import { And } from '../pytools/types';
import { Arguments } from '../pytools/types';
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
import { Comprehension } from '../pytools/types';
import { ContinueStatement } from '../pytools/types';
import { Decorator } from '../pytools/types';
import { Del } from '../pytools/types';
import { DeleteStatement } from '../pytools/types';
import { Dict } from '../pytools/types';
import { Ellipsis } from '../pytools/types';
import { Expression } from '../pytools/types';
import { ExpressionStatement } from '../pytools/types';
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
import { Store } from '../pytools/types';
import { Statement } from '../pytools/types';
import { Str } from '../pytools/types';
import { Subscript } from '../pytools/types';
import { SubscriptContext } from '../pytools/types';
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

const OP_FAST = 0;
const OP_GLOBAL = 1;
const OP_DEREF = 2;
const OP_NAME = 3;
// const D_NAMES = 0;
// const D_FREEVARS = 1;
// const D_CELLVARS = 2;

/**
 * The output function is scoped at the module level so that it is available without being a parameter.
 * @param {...*} x
 */
let out: Function;

/**
 * We keep track of how many time gensym method on the Compiler is called because ... ?
 */
let gensymCount = 0;

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
    argnames: string[];
    /**
     * Stuff that changes on entry/exit of code blocks. must be saved and restored
     * when returning to a block.
     * Corresponds to the body of a module, class, or function.
     */
    constructor() {
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

class Compiler {
    /**
     * The output of all units.
     */
    public result: string[];
    /**
     * Used to instrument the code with the name of the file.
     */
    private fileName: string;
    /**
     * When a scope is entered, used to obtain the corresponding SymbolTableScope.
     * A CompilerUnit is created for each scope.
     */
    private st: SymbolTable;
    /**
     * Not being used (but being carried through).
     */
    private flags: number;
    /**
     * Not being used. Default is false.
     */
    private interactive: boolean;
    /**
     * Incremented(Decremented) when entering(leaving) a scope.
     * Default is 0.
     * Not being used.
     */
    private nestlevel: number;
    /**
     * Provides custom information about the current scope.
     * Default is null.
     */
    private u: CompilerUnit;
    /**
     * Pushed(Popped) when entering(leaving) a scope.
     * Default is [].
     * Used to provide the compiler unit as scopes are popped.
     */
    private stack: CompilerUnit[];
    /**
     * Pushed whenever we enter a cope, but never popped.
     */
    private allUnits: CompilerUnit[];
    /**
     * Used to provide comments referencing the original source in the transpiled code.
     */
    private source: string[] | boolean;
    /**
     *
     * @param fileName
     * @param st
     * @param flags
     * @param sourceCodeForAnnotation used to add original source to listing if desired
     */
    constructor(fileName: string, st: SymbolTable, flags: number, sourceCodeForAnnotation?: string) {
        this.fileName = fileName;
        this.st = st;
        this.flags = flags;
        this.interactive = false;
        this.nestlevel = 0;
        this.u = null;
        this.stack = [];
        this.result = [];
        // this.gensymcount = 0;
        this.allUnits = [];
        this.source = sourceCodeForAnnotation ? sourceCodeForAnnotation.split("\n") : false;
    }

    getSourceLine(lineno: number) {
        assert(!!this.source);
        return this.source[lineno - 1];
    }

    annotateSource(ast: { lineno?: number, col_offset?: number }) {
        if (this.source) {
            const lineno = ast.lineno;
            const col_offset = ast.col_offset;
            out('\n//');
            out('\n// line ', lineno, ':');
            out('\n// ', this.getSourceLine(lineno));

            //
            out('\n// ');
            for (let i = 0; i < col_offset; ++i) {
                out(" ");
            }
            out("^");

            out("\n//");

            out('\nSk.currLineNo = ', lineno, ';Sk.currColNo = ', col_offset, ';');
            out("\nSk.currFilename = '", this.fileName, "';\n\n");
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

    /**
     * @method _gr
     * @param {string} hint basename for gensym
     * @param {...*} rest
     */
    _gr(hint: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any, argA?: any, argB?: any, argC?: any, argD?: any, argE?: any) {
        const v = this.gensym(hint);
        out("var ", v, "=");
        for (let i = 1; i < arguments.length; ++i) {
            out(arguments[i]);
        }
        out(";");
        return v;
    }

    /**
     * Function to test if an interrupt should occur if the program has been running for too long.
     * This function is executed at every test/branch operation.
     */
    _interruptTest() {
        out("if (typeof Sk.execStart === 'undefined') {Sk.execStart=new Date()}");
        out("if (Sk.execLimit !== null && new Date() - Sk.execStart > Sk.execLimit) {throw new Sk.builtin.TimeLimitError(Sk.timeoutMsg())}");
    }

    _jumpfalse(test: string, block: number): void {
        const cond = this._gr('jfalse', "(", test, "===false||!Sk.misceval.isTrue(", test, "))");
        this._interruptTest();
        out("if(", cond, "){/*test failed */$blk=", block, ";continue;}");
    }

    _jumpundef(test: string, block: number): void {
        this._interruptTest();
        out("if(typeof ", test, " === 'undefined'){$blk=", block, ";continue;}");
    }

    _jumptrue(test: string, block: number): void {
        const cond = this._gr('jtrue', "(", test, "===true||Sk.misceval.isTrue(", test, "))");
        this._interruptTest();
        out("if(", cond, "){/*test passed */$blk=", block, ";continue;}");
    }

    _jump(block: number): void {
        this._interruptTest();
        out("$blk=", block, ";/* jump */continue;");
    }

    ctupleorlist(e: Tuple, data: string, tuporlist: 'tuple' | 'list'): string | undefined {
        assert(tuporlist === 'tuple' || tuporlist === 'list');
        if (e.ctx === Store) {
            for (let i = 0; i < e.elts.length; ++i) {
                this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
            }
            return void 0;
        }
        else if (e.ctx === Load) {
            const items: string[] = [];
            for (let i = 0; i < e.elts.length; ++i) {
                items.push(this._gr('elem', this.vexpr(e.elts[i])));
            }
            return this._gr('load' + tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
        }
        else {
            return void 0;
        }
    }

    cdict(e: Dict): string {
        assert(e.values.length === e.keys.length);
        let items = [];
        for (let i = 0; i < e.values.length; ++i) {
            const v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
            items.push(this.vexpr(e.keys[i]));
            items.push(v);
        }
        return this._gr('loaddict', "new Sk.builtins['dict']([", items, "])");
    }

    clistcompgen(tmpname: string, generators: Comprehension[], genIndex: number, elt: Expression) {
        const start = this.newBlock('list gen start');
        const skip = this.newBlock('list gen skip');
        const anchor = this.newBlock('list gen anchor');

        const l = generators[genIndex];
        const toiter = this.vexpr(l.iter);
        const iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
        this._jump(start);
        this.setBlock(start);

        // load targets
        const nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
        this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
        // var target = this.vexpr(l.target, nexti);

        const n = l.ifs.length;
        for (let i = 0; i < n; ++i) {
            const ifres = this.vexpr(l.ifs[i]);
            this._jumpfalse(ifres, start);
        }

        if (++genIndex < generators.length) {
            this.clistcompgen(tmpname, generators, genIndex, elt);
        }

        if (genIndex >= generators.length) {
            const velt = this.vexpr(elt);
            out(tmpname, ".v.push(", velt, ");");
            this._jump(skip);
            this.setBlock(skip);
        }

        this._jump(start);

        this.setBlock(anchor);

        return tmpname;
    }

    clistcomp(e: ListComp): string {
        assert(e instanceof ListComp);
        const tmp = this._gr("_compr", "new Sk.builtins['list']([])");
        return this.clistcompgen(tmp, e.generators, 0, e.elt);
    }

    cyield(e: Yield): string {
        if (this.u.ste.blockType !== FunctionBlock)
            throw new SyntaxError("'yield' outside function");
        let val = 'null';
        if (e.value)
            val = this.vexpr(e.value);
        const nextBlock = this.newBlock('after yield');
        // return a pair: resume target block and yielded value
        out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
        this.setBlock(nextBlock);
        return '$gen.gi$sentvalue'; // will either be null if none sent, or the value from gen.send(value)
    }

    ccompare(e: Compare): string {
        assert(e.ops.length === e.comparators.length);
        let cur = this.vexpr(e.left);
        const n = e.ops.length;
        const done = this.newBlock("done");
        const fres = this._gr('compareres', 'null');

        for (let i = 0; i < n; ++i) {
            const rhs = this.vexpr(e.comparators[i]);
            const res = this._gr('compare', "Sk.builtin.bool(Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", e.ops[i]['prototype']._astname, "'))");
            out(fres, '=', res, ';');
            this._jumpfalse(res, done);
            cur = rhs;
        }
        this._jump(done);
        this.setBlock(done);
        return fres;
    }

    ccall(e: Call): string {
        const func = this.vexpr(e.func);
        const args = this.vseqexpr(e.args);

        if (e.keywords.length > 0 || e.starargs || e.kwargs) {
            const kwarray = [];
            for (let i = 0; i < e.keywords.length; ++i) {
                kwarray.push("'" + e.keywords[i].arg + "'");
                kwarray.push(this.vexpr(e.keywords[i].value));
            }
            const keywords = "[" + kwarray.join(",") + "]";
            let starargs = "undefined";
            let kwargs = "undefined";
            if (e.starargs)
                starargs = this.vexpr(e.starargs);
            if (e.kwargs)
                kwargs = this.vexpr(e.kwargs);
            return this._gr('call', "Sk.misceval.call(", func, ",", kwargs, ",", starargs, ",", keywords, args.length > 0 ? "," : "", args, ")");
        }
        else {
            return this._gr('call', "Sk.misceval.callsim(", func, args.length > 0 ? "," : "", args, ")");
        }
    }

    cslice(s: Slice): string {
        assert(s instanceof Slice);
        const low = s.lower ? this.vexpr(s.lower) : 'null';
        const high = s.upper ? this.vexpr(s.upper) : 'null';
        const step = s.step ? this.vexpr(s.step) : 'null';
        return this._gr('slice', "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
    }

    vslicesub(s: Number | String | Index | Slice | Ellipsis | ExtSlice): number | string {
        if (s instanceof Number) {
            // Already compiled, should only happen for augmented assignments
            return s.valueOf();
        }
        if (s instanceof String) {
            // Already compiled, should only happen for augmented assignments
            return s.toString();
        }
        else if (s instanceof Index) {
            return this.vexpr(s.value);
        }
        else if (s instanceof Slice) {
            return this.cslice(s);
        }
        else if (s instanceof Ellipsis) {
            throw new Error("TODO: Ellipsis");
        }
        else if (s instanceof ExtSlice) {
            throw new Error("TODO: ExtSlice");
        }
        else {
            throw new Error("invalid subscript kind");
        }
    }

    vslice(s: Number | String | Index | Slice | Ellipsis | ExtSlice, ctx: SubscriptContext, obj: any, dataToStore: string) {
        const subs = this.vslicesub(s);
        return this.chandlesubscr(ctx, obj, subs, dataToStore);
    }

    chandlesubscr(ctx: SubscriptContext, obj: any, subs: String | Number, data: string): string | undefined {
        if (ctx === Load || ctx === AugLoad)
            return this._gr('lsubscr', "Sk.abstr.objectGetItem(", obj, ",", subs, ")");
        else if (ctx === Store || ctx === AugStore) {
            out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
            return void 0;
        }
        else if (ctx === Del) {
            out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
            return void 0;
        }
        else {
            throw new Error("handlesubscr fail");
        }
    }

    cboolop(e: BoolOp): string {
        assert(e instanceof BoolOp);
        let jtype;
        if (e.op === And)
            jtype = this._jumpfalse;
        else
            jtype = this._jumptrue;
        const end = this.newBlock('end of boolop');
        const s = e.values;
        const n = s.length;
        let retval: string;
        for (let i = 0; i < n; ++i) {
            const expres = this.vexpr(s[i]);
            if (i === 0) {
                retval = this._gr('boolopsucc', expres);
            }
            out(retval, "=", expres, ";");
            jtype.call(this, expres, end);
        }
        this._jump(end);
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
    vexpr(e: Expression, data?: string | undefined, augstoreval?: Expression): string {
        if (e.lineno > this.u.lineno) {
            this.u.lineno = e.lineno;
            this.u.linenoSet = false;
        }
        this.annotateSource(e);
        if (e instanceof BoolOp) {
            return this.cboolop(e);
        }
        else if (e instanceof BinOp) {
            return this._gr('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op['prototype']._astname, "')");
        }
        else if (e instanceof UnaryOp) {
            return this._gr('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op['prototype']._astname, "')");
        }
        else if (e instanceof Lambda) {
            return this.clambda(e);
        }
        else if (e instanceof IfExp) {
            return this.cifexp(e);
        }
        else if (e instanceof Dict) {
            return this.cdict(e);
        }
        else if (e instanceof ListComp) {
            return this.clistcomp(e);
        }
        else if (e instanceof GeneratorExp) {
            return this.cgenexp(e);
        }
        else if (e instanceof Yield) {
            return this.cyield(e);
        }
        else if (e instanceof Compare) {
            return this.ccompare(e);
        }
        else if (e instanceof Call) {
            const result = this.ccall(e);
            // After the function call, we've returned to this line
            this.annotateSource(e);
            return result;
        }
        else if (e instanceof Num) {
            if (e.n.isFloat()) {
                return 'Sk.builtin.numberToPy(' + e.n.value + ')';
            }
            else if (e.n.isInt()) {
                return "Sk.ffi.numberToIntPy(" + e.n.value + ")";
            }
            else if (e.n.isLong()) {
                return "Sk.ffi.longFromString('" + e.n.text + "', " + e.n.radix + ")";
            }
            throw new Error("unhandled Num type");
        }
        else if (e instanceof Str) {
            return this._gr('str', 'Sk.builtin.stringToPy(', toStringLiteralJS(e.s), ')');
        }
        else if (e instanceof Attribute) {
            let val: string;
            if (e.ctx !== AugStore)
                val = this.vexpr(e.value);
            let mangled = toStringLiteralJS(e.attr);
            mangled = mangled.substring(1, mangled.length - 1);
            mangled = mangleName(this.u.private_, mangled);
            mangled = fixReservedWords(mangled);
            mangled = fixReservedNames(mangled);
            switch (e.ctx) {
                case AugLoad:
                case Load:
                    return this._gr("lattr", "Sk.abstr.gattr(", val, ",'", mangled, "')");
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
                    fail("todo;");
                    break;
                case Param:
                default:
                    throw new Error("invalid attribute expression");
            }
        }
        else if (e instanceof Subscript) {
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
                    fail("invalid subscript expression");
            }
        }
        else if (e instanceof Name) {
            return this.nameop(e.id, e.ctx, data);
        }
        else if (e instanceof List) {
            return this.ctupleorlist(e, data, 'list');
        }
        else if (e instanceof Tuple) {
            return this.ctupleorlist(e, data, 'tuple');
        }
        else {
            throw new Error("unhandled case in vexpr");
        }
        return void 0;
    }

    /**
     * @param {Array.<Object>} exprs
     * @param {Array.<string>=} data
     */
    vseqexpr(exprs: Expression[], data?: string[]): string[] {

        const missingData = (typeof data === 'undefined');

        assert(missingData || exprs.length === data.length);
        const ret: string[] = [];
        for (let i = 0; i < exprs.length; ++i) {
            ret.push(this.vexpr(exprs[i], (missingData ? undefined : data[i])));
        }
        return ret;
    }

    caugassign(s: AugAssign): string {
        assert(s instanceof AugAssign);
        const e = s.target;
        if (e instanceof Attribute) {
            const auge = new Attribute(e.value, e.attr, AugLoad, e.lineno, e.col_offset);
            const aug = this.vexpr(auge);
            const val = this.vexpr(s.value);
            const res = this._gr('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op['prototype']._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, e.value);
        }
        else if (e instanceof Subscript) {
            // Only compile the subscript value once
            const augsub = this.vslicesub(e.slice);
            const auge = new Subscript(e.value, augsub, AugLoad, e.lineno, e.col_offset);
            const aug = this.vexpr(auge);
            const val = this.vexpr(s.value);
            const res = this._gr('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op['prototype']._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, e.value);
        }
        else if (e instanceof Name) {
            const to = this.nameop(e.id, Load);
            const val = this.vexpr(s.value);
            const res = this._gr('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op['prototype']._astname, "')");
            return this.nameop(e.id, Store, res);
        }
        else {
            throw new Error("unhandled case in augassign");
        }
    }

    /**
     * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
     */
    exprConstant(e: Expression): number {
        switch (e.constructor) {
            case Num:
                throw new Error("Trying to call the runtime for Num");
            // return Sk.misceval.isTrue(e.n);
            case Str:
                throw new Error("Trying to call the runtime for Str");
            // return Sk.misceval.isTrue(e.s);
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

    pushExceptBlock(n: number) {
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

    setupExcept(eb: number) {
        out("$exc.push(", eb, ");");
        // this.pushExceptBlock(eb);
    }

    endExcept() {
        out("$exc.pop();");
    }

    outputLocals(unit: CompilerUnit) {
        const have = {};
        for (let i = 0; unit.argnames && i < unit.argnames.length; ++i)
            have[unit.argnames[i]] = true;
        unit.localnames.sort();
        const output = [];
        for (let i = 0; i < unit.localnames.length; ++i) {
            const name = unit.localnames[i];
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
                ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
                ret += blocks[i].join('');
                /*
                ret += "throw new Sk.builtin.SystemError('internal error: unterminated block');";
                */
            }
            ret += unit.suffixCode;
        }
        return ret;
    }

    cif(s: IfStatement) {
        assert(s instanceof IfStatement);
        const constant = this.exprConstant(s.test);
        // TODO: This looks wierd.
        let end: number;
        if (constant === 0) {
            if (s.alternate) {
                this.vseqstmt(s.alternate);
            }
        }
        else if (constant === 1) {
            this.vseqstmt(s.consequent);
        }
        else {
            end = this.newBlock('end of if');
            const next = this.newBlock('next branch of if');

            const test = this.vexpr(s.test);
            this._jumpfalse(test, next);
            this.vseqstmt(s.consequent);
            this._jump(end);

            this.setBlock(next);
            if (s.alternate) {
                this.vseqstmt(s.alternate);
            }
            this._jump(end);
        }
        this.setBlock(end);

    }

    cwhile(s: WhileStatement): void {
        const constant = this.exprConstant(s.test);
        if (constant === 0) {
            if (s.orelse)
                this.vseqstmt(s.orelse);
        }
        else {
            const top = this.newBlock('while test');
            this._jump(top);
            this.setBlock(top);

            const next = this.newBlock('after while');
            const orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
            const body = this.newBlock('while body');

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
    }

    cfor(s: ForStatement): void {
        const start = this.newBlock('for start');
        const cleanup = this.newBlock('for cleanup');
        const end = this.newBlock('for end');

        this.pushBreakBlock(end);
        this.pushContinueBlock(start);

        // get the iterator
        const toiter = this.vexpr(s.iter);
        let iter: string;
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
        const nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
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
            let inst = '';
            if (s.inst) {
                // handles: raise Error, arguments
                inst = this.vexpr(s.inst);
                out("throw ", this.vexpr(s.type), "(", inst, ");");
            }
            else if (s.type) {
                if (s.type/*.func*/) {  // FIXME: Does not pass the compiler.
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

    ctryexcept(s: TryExcept) {
        const n = s.handlers.length;

        // Create a block for each except clause
        const handlers: number[] = [];
        for (let i = 0; i < n; ++i) {
            handlers.push(this.newBlock("except_" + i + "_"));
        }

        const unhandled = this.newBlock("unhandled");
        const orelse = this.newBlock("orelse");
        const end = this.newBlock("end");

        this.setupExcept(handlers[0]);
        this.vseqstmt(s.body);
        this.endExcept();
        this._jump(orelse);

        for (let i = 0; i < n; ++i) {
            this.setBlock(handlers[i]);
            const handler = s.handlers[i];
            if (!handler.type && i < n - 1) {
                throw new SyntaxError("default 'except:' must be last");
            }

            if (handler.type) {
                // should jump to next handler if err not isinstance of handler.type
                const handlertype = this.vexpr(handler.type);
                const next = (i === n - 1) ? unhandled : handlers[i + 1];

                // this check is not right, should use isinstance, but exception objects
                // are not yet proper Python objects
                const check = this._gr('instance', "$err instanceof ", handlertype);
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
    }

    ctryfinally(s: TryFinally, flags?: number) {
        out("/*todo; tryfinally*/");
        // everything but the finally?
        // TODO: Is this OK?
        this.ctryexcept(s.body[0] as TryExcept);
    }

    cassert(s: Assert): void {
        /* todo; warnings method
        if (s.test instanceof Tuple && s.test.elts.length > 0)
            Sk.warn("assertion is always true, perhaps remove parentheses?");
        */

        const test = this.vexpr(s.test);
        const end = this.newBlock("end");
        this._jumptrue(test, end);
        // todo; exception handling
        // maybe replace with fail?? or just an alert?
        out("throw new Sk.builtin.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
        this.setBlock(end);
    }

    /**
     * @param name
     * @param asname
     * @param mod
     */
    cimportas(name: string, asname: string, mod?: string): string {
        let src = name;
        let dotLoc = src.indexOf(".");
        let cur = mod;
        if (dotLoc !== -1) {
            // if there's dots in the module name, __import__ will have returned
            // the top-level module. so, we need to extract the actual module by
            // getattr'ing up through the names, and then storing the leaf under
            // the name it was to be imported as.
            src = src.substr(dotLoc + 1);
            while (dotLoc !== -1) {
                dotLoc = src.indexOf(".");
                const attr = dotLoc !== -1 ? src.substr(0, dotLoc) : src;
                cur = this._gr('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
                src = src.substr(dotLoc + 1);
            }
        }
        return this.nameop(asname, Store, cur);
    }

    cimport(s: ImportStatement) {
        const n = s.names.length;
        for (let i = 0; i < n; ++i) {
            const alias: Alias = s.names[i];
            const mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS(alias.name), ',$gbl,$loc,[])');

            if (alias.asname) {
                this.cimportas(alias.name, alias.asname, mod);
            }
            else {
                const lastDot = alias.name.indexOf('.');
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
        for (let i = 0; i < n; ++i) {
            names[i] = s.names[i].name;
        }
        const namesString = names.map(function (name) { return toStringLiteralJS(name); }).join(', ');
        const mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS(s.module), ',$gbl,$loc,[', namesString, '])');
        for (let i = 0; i < n; ++i) {
            const alias = s.names[i];
            if (i === 0 && alias.name === "*") {
                assert(n === 1);
                out("Sk.importStar(", mod, ",$loc, $gbl);");
                return;
            }

            const got = this._gr('item', 'Sk.abstr.gattr(', mod, ',', toStringLiteralJS(alias.name), ')');
            let storeName = alias.name;
            if (alias.asname)
                storeName = alias.asname;
            this.nameop(storeName, Store, got);
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
    buildcodeobj(n: { scopeId: number, lineno: number }, coname: string, decorator_list: Decorator[], args: Arguments, callback: (scopename: string) => void) {
        let decos = [];
        let defaults: string[] = [];
        let vararg = null;
        let kwarg = null;

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

        const containingHasFree = this.u.ste.hasFree;
        const containingHasCell = this.u.ste.childHasFree;

        /**
         * enter the new scope, and create the first block
         */
        const scopename = this.enterScope(coname, n, n.lineno);

        const isGenerator = this.u.ste.generator;
        const hasFree = this.u.ste.hasFree;
        const hasCell = this.u.ste.childHasFree;
        const descendantOrSelfHasFree = this.u.ste.hasFree/* || this.u.ste.childHasFree*/;

        let entryBlock: number | string = this.newBlock('codeobj entry');

        //
        // the header of the function, and arguments
        //
        this.u.prefixCode = "var " + scopename + "=(function " + this.niceName(coname) + "$(";

        let funcArgs = [];
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
            for (let i = 0; args && i < args.args.length; ++i)
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
        let locals = "{}";
        if (isGenerator) {
            entryBlock = "$gen.gi$resumeat";
            locals = "$gen.gi$locals";
        }
        let cells = "";
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
            const id = args.args[i].id;
            if (this.isCell(id)) {
                this.u.varDeclsCode += "$cell." + id + "=" + id + ";";
            }
        }

        //
        // make sure correct number of arguments were passed (generators handled below)
        //
        if (!isGenerator) {
            const minargs = args ? args.args.length - defaults.length : 0;
            const maxargs = vararg ? Infinity : (args ? args.args.length : 0);
            const kw = kwarg ? true : false;
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
            const offset = args.args.length - defaults.length;
            for (let i = 0; i < defaults.length; ++i) {
                const argname = this.nameop(args.args[i + offset].id, Param);
                this.u.varDeclsCode += "if(typeof " + argname + " === 'undefined')" + argname + "=" + scopename + ".$defaults[" + i + "];";
            }
        }

        //
        // initialize vararg, if any
        //
        if (vararg) {
            const start = funcArgs.length;
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
        let argnames: string;
        if (args && args.args.length > 0) {
            const argnamesarr: string[] = [];
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
        let frees = "";
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
                return this._gr("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgs(\"",
                    coname, "\",arguments,", args.args.length - defaults.length, ",", args.args.length,
                    ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
            }
            else {
                return this._gr("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgs(\"", coname,
                    "\",arguments,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
            }
        else {
            return this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
        }
    }

    cfunction(s: FunctionDef) {
        assert(s instanceof FunctionDef);
        const funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args,
            (scopename) => {
                this.vseqstmt(s.body);
                out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
            }
        );
        this.nameop(s.name, Store, funcorgen);
    }

    clambda(e: Lambda) {
        assert(e instanceof Lambda);
        const func = this.buildcodeobj(e, "<lambda>", null, e.args, (scopename) => {
            const val = this.vexpr(e.body);
            out("return ", val, ";");
        });
        return func;
    }

    cifexp(e: IfExp) {
        const next = this.newBlock('next of ifexp');
        const end = this.newBlock('end of ifexp');
        const ret = this._gr('res', 'null');

        const test = this.vexpr(e.test);
        this._jumpfalse(test, next);

        out(ret, '=', this.vexpr(e.body), ';');
        this._jump(end);

        this.setBlock(next);
        out(ret, '=', this.vexpr(e.orelse), ';');
        this._jump(end);

        this.setBlock(end);
        return ret;
    }

    cgenexpgen(generators: Comprehension[], genIndex: number, elt: Expression) {
        const start = this.newBlock('start for ' + genIndex);
        const skip = this.newBlock('skip for ' + genIndex);
        // var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
        const end = this.newBlock('end for ' + genIndex);

        const ge = generators[genIndex];

        let iter: string;
        if (genIndex === 0) {
            // the outer most iterator is evaluated in the scope outside so we
            // have to evaluate it outside and store it into the generator as a
            // local, which we retrieve here.
            iter = "$loc.$iter0";
        }
        else {
            const toiter = this.vexpr(ge.iter);
            iter = "$loc." + this.gensym("iter");
            out(iter, "=", "Sk.abstr.iter(", toiter, ");");
        }
        this._jump(start);
        this.setBlock(start);

        // load targets
        const nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
        this._jumpundef(nexti, end); // todo; this should be handled by StopIteration
        // var target = this.vexpr(ge.target, nexti);

        const n = ge.ifs.length;
        for (let i = 0; i < n; ++i) {
            const ifres = this.vexpr(ge.ifs[i]);
            this._jumpfalse(ifres, start);
        }

        if (++genIndex < generators.length) {
            this.cgenexpgen(generators, genIndex, elt);
        }

        if (genIndex >= generators.length) {
            const velt = this.vexpr(elt);
            out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
            this.setBlock(skip);
        }

        this._jump(start);

        this.setBlock(end);

        if (genIndex === 1)
            out("return null;");
    }

    cgenexp(e: GeneratorExp) {
        const gen = this.buildcodeobj(e, "<genexpr>", null, null,
            (scopename) => {
                this.cgenexpgen(e.generators, 0, e.elt);
            });

        // call the generator maker to get the generator. this is kind of dumb,
        // but the code builder builds a wrapper that makes generators for normal
        // function generators, so we just do it outside (even just new'ing it
        // inline would be fine).
        const gener = this._gr("gener", "Sk.misceval.callsim(", gen, ");");
        // stuff the outermost iterator into the generator after evaluating it
        // outside of the function. it's retrieved by the fixed name above.
        out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
        return gener;
    }



    cclass(s: ClassDef) {
        assert(s instanceof ClassDef);
        // var decos = s.decorator_list;

        // decorators and bases need to be eval'd out here
        // this.vseqexpr(decos);

        const bases = this.vseqexpr(s.bases);

        /**
         * @const
         * @type {string}
         */
        const scopename = this.enterScope(s.name, s, s.lineno);
        const entryBlock = this.newBlock('class entry');

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

        const wrapped = this._gr('built', 'Sk.misceval.buildClass($gbl,', scopename, ',', toStringLiteralJS(s.name), ',[', bases, '])');

        // store our new class under the right name
        this.nameop(s.name, Store, wrapped);
    }

    ccontinue(s: ContinueStatement) {
        if (this.u.continueBlocks.length === 0)
            throw new SyntaxError("'continue' outside loop");
        // todo; continue out of exception blocks
        this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
    }

    /**
     * compiles a statement
     */
    vstmt(s: Statement, flags?: number) {
        this.u.lineno = s.lineno;
        this.u.linenoSet = false;

        this.annotateSource(s);

        // TODO: Does not need to be exceptional anymore.
        if (s instanceof DeleteStatement) {
            this.vseqexpr(s.targets);
        }

        switch (s.constructor) {
            case FunctionDef:
                this.cfunction(s as FunctionDef);
                break;
            case ClassDef:
                this.cclass(s as ClassDef);
                break;
            case ReturnStatement: {
                if (this.u.ste.blockType !== FunctionBlock)
                    throw new SyntaxError("'return' outside function");
                if ((s as ReturnStatement).value)
                    out("return ", this.vexpr((<ReturnStatement>s).value), ";");
                else
                    out("return null;");
                break;
            }
            case Assign:
                const assign = s as Assign;
                const n = assign.targets.length;
                const val = this.vexpr((<Assign>s).value);
                for (let i = 0; i < n; ++i)
                    this.vexpr(assign.targets[i], val);
                break;
            case AugAssign:
                return this.caugassign(s as AugAssign);
            case Print:
                this.cprint(s as Print);
                break;
            case ForStatement:
                return this.cfor(s as ForStatement);
            case WhileStatement:
                return this.cwhile(s as WhileStatement);
            case IfStatement:
                return this.cif(s as IfStatement);
            case Raise:
                return this.craise(s as Raise);
            case TryExcept:
                return this.ctryexcept(s as TryExcept);
            case TryFinally:
                return this.ctryfinally(s as TryFinally);
            case Assert:
                return this.cassert(s as Assert);
            case ImportStatement:
                return this.cimport(s as ImportStatement);
            case ImportFrom:
                return this.cfromimport(s as ImportFrom);
            case Global:
                break;
            case ExpressionStatement:
                this.vexpr((s as ExpressionStatement).value);
                break;
            case Pass:
                break;
            case BreakStatement:
                if (this.u.breakBlocks.length === 0)
                    throw new SyntaxError("'break' outside loop");
                this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
                break;
            case ContinueStatement:
                this.ccontinue(s as ContinueStatement);
                break;
            default:
                fail("unhandled case in vstmt");
        }
    }

    vseqstmt(stmts: Statement[]) {
        for (let i = 0; i < stmts.length; ++i) this.vstmt(stmts[i]);
    }

    isCell(name: string): boolean {
        const mangled = mangleName(this.u.private_, name);
        const scope = this.u.ste.getScope(mangled);
        if (scope === CELL)
            return true;
        return false;
    }

    /**
     * @param {string} name
     * @param {Object} ctx
     * @param {string=} dataToStore
     */
    nameop(name: string, ctx: AugStore | Store | Del, dataToStore?: string): string {
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
        let mangled = mangleName(this.u.private_, name);
        let optype = OP_NAME;
        const scope = this.u.ste.getScope(mangled);
        let dict = null;
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
        if (this.u.ste.generator || this.u.ste.blockType !== FunctionBlock)
            mangled = "$loc." + mangled;
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
                        out(mangled, "=", dataToStore, ";");
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
                        const v = this.gensym('loadname');
                        // can't be || for loc.x = 0 or null
                        out("var ", v, "=(typeof ", mangled, " !== 'undefined') ? ", mangled, ":Sk.misceval.loadname('", mangledNoPre, "',$gbl);");
                        return v;
                    case Store:
                        out(mangled, "=", dataToStore, ";");
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
                        return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                    case Store:
                        out("$gbl.", mangledNoPre, "=", dataToStore, ';');
                        break;
                    case Del:
                        out("delete $gbl.", mangledNoPre);
                        break;
                    default:
                        fail("unhandled case in name op_global");
                }
                break;
            case OP_DEREF:
                switch (ctx) {
                    case Load:
                        return dict + "." + mangledNoPre;
                    case Store:
                        out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                        break;
                    case Param:
                        return mangledNoPre;
                    default:
                        fail("unhandled case in name op_deref");
                }
                break;
            default:
                fail("unhandled case");
        }
        return void 0;
    }

    /**
     * @method enterScope
     * @param {string} name
     * @return {string} The generated name of the scope, usually $scopeN.
     */
    enterScope(name: string, key: { scopeId: number }, lineno: number): string {
        const u = new CompilerUnit();
        u.ste = this.st.getStsForAst(key);
        u.name = name;
        u.firstlineno = lineno;

        if (this.u && this.u.private_)
            u.private_ = this.u.private_;

        this.stack.push(this.u);
        this.allUnits.push(u);
        const scopeName = this.gensym('scope');
        u.scopename = scopeName;

        this.u = u;
        this.u.activateScope();

        this.nestlevel++;

        return scopeName;
    }

    exitScope() {
        const prev = this.u;
        this.nestlevel--;
        if (this.stack.length - 1 >= 0)
            this.u = this.stack.pop();
        else
            this.u = null;
        if (this.u)
            this.u.activateScope();

        if (prev.name !== "<module>") {
            let mangled = prev.name;
            mangled = fixReservedWords(mangled);
            mangled = fixReservedNames(mangled);
            out(prev.scopename, ".co_name=Sk.builtin.stringToPy('", mangled, "');");
        }
    }

    cbody(stmts: Statement[], flags?: number) {
        for (let i = 0; i < stmts.length; ++i) {
            this.vstmt(stmts[i]);
        }
    }

    cprint(s: Print) {
        assert(s instanceof Print);
        let dest = 'null';
        if (s.dest) {
            dest = this.vexpr(s.dest);
        }

        const n = s.values.length;
        for (let i = 0; i < n; ++i) {
            out("Sk.misceval.print_(Sk.ffi.remapToJs(new Sk.builtins.str(", this.vexpr(s.values[i]), ")));");
        }
        if (s.nl) {
            out("Sk.misceval.print_('\\n');");
        }
    }

    cmod(mod: Module, flags?: number): string {

        const modf = this.enterScope("<module>", mod, 0);

        const entryBlock = this.newBlock('module entry');
        this.u.prefixCode = "var " + modf + "=(function($modname){";
        this.u.varDeclsCode = "var $blk=" + entryBlock + ",$exc=[],$gbl={},$loc=$gbl,$err;$gbl.__name__=$modname;Sk.globals=$gbl;";

        this.u.switchCode = "try {while(true){try{switch($blk){";
        this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}}catch(err){if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) { Sk.misceval.print_(err.toString() + '\\n'); return $loc; } else { throw err; } } });";

        switch (mod.constructor) {
            case Module:
                this.cbody(mod.body);
                out("return $loc;");
                break;
            default:
                fail("todo; unhandled case in compilerMod");
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
    let strpriv = null;

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
export function compile(sourceText: string, fileName: string) {
    const cst = parse(sourceText, SourceKind.File);
    if (typeof cst === 'object') {
        const stmts = astFromParse(cst);
        const mod = new Module(stmts);
        const st = semanticsOfModule(mod);
        const c = new Compiler(fileName, st, 0, sourceText);
        return { 'funcname': c.cmod(mod), 'code': c.result.join('') };
    }
    else {
        throw new Error("");
    }
}

export function resetCompiler() {
    gensymCount = 0;
}
