import { assert } from '../pytools/asserts';
import { Visitor } from '../pytools/types';
import { Assign } from '../pytools/types';
import { Attribute } from '../pytools/types';
import { BinOp, Add, Sub, Mult, Div, BitOr, BitXor, BitAnd, LShift, RShift, FloorDiv, Mod } from '../pytools/types';
import { Call } from '../pytools/types';
import { ClassDef } from '../pytools/types';
import { Compare, Eq, NotEq, Gt, GtE, Lt, LtE, In, NotIn, Is, IsNot } from '../pytools/types';
import { Dict } from '../pytools/types';
import { ExpressionStatement } from '../pytools/types';
import { FunctionDef } from '../pytools/types';
import { IfStatement } from '../pytools/types';
import { ImportFrom } from '../pytools/types';
import { List } from '../pytools/types';
import { Module } from '../pytools/types';
import { Name } from '../pytools/types';
import { Num } from '../pytools/types';
import { Print } from '../pytools/types';
import { ReturnStatement } from '../pytools/types';
import { Str } from '../pytools/types';
import { parse, PyNode, SourceKind } from '../pytools/parser';
import { astFromParse } from '../pytools/builder';
import { semanticsOfModule } from '../pytools/symtable';
import { SymbolTable } from '../pytools/SymbolTable';
import { SymbolTableScope } from '../pytools/SymbolTableScope';
import { toStringLiteralJS } from '../pytools/toStringLiteralJS';
import { SymbolFlags } from '../pytools/SymbolConstants';
import { DEF_LOCAL } from '../pytools/SymbolConstants';
import { isClassNameByConvention, isMethod } from './utils';
import { TypeWriter, TextAndMappings } from './TypeWriter';
import { MappingTree } from './MappingTree';

/**
 * Provides enhanced scope information beyond the SymbolTableScope.
 */
class PrinterUnit {
    readonly ste: SymbolTableScope;
    readonly name: string;
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
    /**
     * Used to determine whether a local variable has been declared.
     */
    declared: { [name: string]: boolean } = {};
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
    constructor(name: string, ste: SymbolTableScope) {
        assert(typeof name === 'string');
        assert(typeof ste === 'object');
        this.name = name;
        this.ste = ste;

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
    activateScope(): void {
        // Do nothing yet.
    }
    deactivateScope(): void {
        // Do nothing yet.
    }
}

class Printer implements Visitor {
    /**
     * The output of all units.
     */
    public result: string[];
    /**
     * Used to instrument the code with the name of the file.
     */
    // private fileName: string;
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
     * It seems a bit redundant because it can be obtained from the stack.length property.
     */
    private nestlevel: number;
    /**
     * Provides custom information about the current scope.
     * Default is null.
     */
    private u: PrinterUnit;
    /**
     * Pushed(Popped) when entering(leaving) a scope.
     * Default is [].
     * Used to provide the compiler unit as scopes are popped.
     */
    private stack: PrinterUnit[];
    /**
     * Pushed whenever we enter a cope, but never popped.
     */
    private allUnits: PrinterUnit[];
    /**
     * Used to provide comments referencing the original source in the transpiled code.
     */
    private source: string[] | boolean;

    /**
     * The output buffer.
     * This will be joined into a single string.
     */
    private writer: TypeWriter;
    /**
     * Used to provide a unique number for generated symbol names.
     */
    private gensymCount = 0;
    /**
     *
     * @param st The symbol table obtained from semantic analysis.
     * @param flags Not being used yet. May become options.
     * @param sourceText The original source code, provided for annotating the generated code and source mapping.
     */
    constructor(st: SymbolTable, flags: number, sourceText: string) {
        // this.fileName = fileName;
        this.st = st;
        this.flags = flags;
        this.interactive = false;
        this.nestlevel = 0;
        this.u = null;
        this.stack = [];
        this.result = [];
        // this.gensymcount = 0;
        this.allUnits = [];
        this.source = sourceText ? sourceText.split("\n") : false;
        this.writer = new TypeWriter();
    }

    /**
     * This is the entry point for this visitor.
     */
    transpileModule(module: Module): TextAndMappings {

        this.enterScope("<module>", module, 0);
        this.module(module);
        this.exitScope();

        return this.writer.snapshot();
    }

    /**
     * Looks up the SymbolTableScope.
     * Pushes a new PrinterUnit onto the stack.
     * Returns a string identifying the scope.
     * @param name The name that will be assigned to the PrinterUnit.
     * @param key A scope object in the AST from sematic analysis. Provides the mapping to the SymbolTableScope.
     * @param lineno Assigned to the first line numberof the PrinterUnit.
     */
    enterScope(name: string, key: { scopeId: number }, lineno: number): string {
        const u = new PrinterUnit(name, this.st.getStsForAst(key));
        u.firstlineno = lineno;

        if (this.u && this.u.private_) {
            u.private_ = this.u.private_;
        }

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
        if (this.u) {
            this.u.deactivateScope();
        }
        this.nestlevel--;
        if (this.stack.length - 1 >= 0) {
            this.u = this.stack.pop();
        }
        else {
            this.u = null;
        }
        if (this.u) {
            this.u.activateScope();
        }
    }

    /**
     * Generates a unique symbol name for the provided namespace.
     */
    gensym(namespace?: 'scope'): string {
        let symbolName = namespace || '';
        symbolName = '$' + symbolName;
        symbolName += this.gensymCount++;
        return symbolName;
    }

    // Everything below here is an implementation of the Visitor
    assign(assign: Assign): void {
        this.writer.beginStatement();
        // TODO: Declaration.
        // TODO: How to deal with multiple target?
        for (const target of assign.targets) {
            if (target instanceof Name) {
                const flags: SymbolFlags = this.u.ste.symFlags[target.id];
                if (flags && DEF_LOCAL) {
                    if (this.u.declared[target.id]) {
                        // The variable has already been declared.
                    }
                    else {
                        // We use let for now because we would need to look ahead for more assignments.
                        // The smenatic analysis could count the number of assignments in the current scope?
                        this.writer.write("let ", null);
                        this.u.declared[target.id] = true;
                    }
                }
            }
            target.accept(this);
        }
        this.writer.assign("=", assign.eqRange);
        assign.value.accept(this);
        this.writer.endStatement();
    }
    attribute(attribute: Attribute): void {
        attribute.value.accept(this);
        this.writer.write(".", null);
        this.writer.write(attribute.attr, null);
    }
    binOp(be: BinOp): void {
        be.lhs.accept(this);
        const op = be.op;
        const opRange = be.opRange;
        switch (op) {
            case Add: {
                this.writer.binOp("+", opRange);
                break;
            }
            case Sub: {
                this.writer.binOp("-", opRange);
                break;
            }
            case Mult: {
                this.writer.binOp("*", opRange);
                break;
            }
            case Div: {
                this.writer.binOp("/", opRange);
                break;
            }
            case BitOr: {
                this.writer.binOp("|", opRange);
                break;
            }
            case BitXor: {
                this.writer.binOp("^", opRange);
                break;
            }
            case BitAnd: {
                this.writer.binOp("&", opRange);
                break;
            }
            case LShift: {
                this.writer.binOp("<<", opRange);
                break;
            }
            case RShift: {
                this.writer.binOp(">>", opRange);
                break;
            }
            case Mod: {
                this.writer.binOp("%", opRange);
                break;
            }
            case FloorDiv: {
                // TODO: What is the best way to handle FloorDiv.
                // This doesn't actually exist in TypeScript.
                this.writer.binOp("//", opRange);
                break;
            }
            default: {
                throw new Error(`Unexpected binary operator ${op}: ${typeof op}`);
            }
        }
        be.rhs.accept(this);
    }
    callExpression(ce: Call): void {
        if (ce.func instanceof Name) {
            if (isClassNameByConvention(ce.func)) {
                this.writer.write("new ", null);
            }
        }
        else if (ce.func instanceof Attribute) {
            if (isClassNameByConvention(ce.func)) {
                this.writer.write("new ", null);
            }
        }
        else {
            throw new Error(`Call.func must be a Name ${ce.func}`);
        }
        ce.func.accept(this);
        this.writer.openParen();
        for (let i = 0; i < ce.args.length; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            const arg = ce.args[i];
            arg.accept(this);
        }
        for (let i = 0; i < ce.keywords.length; ++i) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            ce.keywords[i].value.accept(this);
        }
        if (ce.starargs) {
            ce.starargs.accept(this);
        }
        if (ce.kwargs) {
            ce.kwargs.accept(this);
        }
        this.writer.closeParen();
    }
    classDef(cd: ClassDef): void {
        this.writer.write("class", null);
        this.writer.space();
        this.writer.name(cd.name, cd.nameRange);
        // this.writer.openParen();
        // this.writer.closeParen();
        this.writer.beginBlock();
        /*
        this.writer.write("constructor");
        this.writer.openParen();
        this.writer.closeParen();
        this.writer.beginBlock();
        this.writer.endBlock();
        */
        for (const stmt of cd.body) {
            stmt.accept(this);
        }
        this.writer.endBlock();
    }
    compareExpression(ce: Compare) {
        ce.left.accept(this);
        for (const op of ce.ops) {
            switch (op) {
                case Eq: {
                    this.writer.write("===", null);
                    break;
                }
                case NotEq: {
                    this.writer.write("!==", null);
                    break;
                }
                case Lt: {
                    this.writer.write("<", null);
                    break;
                }
                case LtE: {
                    this.writer.write("<=", null);
                    break;
                }
                case Gt: {
                    this.writer.write(">", null);
                    break;
                }
                case GtE: {
                    this.writer.write(">=", null);
                    break;
                }
                case Is: {
                    this.writer.write("===", null);
                    break;
                }
                case IsNot: {
                    this.writer.write("!==", null);
                    break;
                }
                case In: {
                    this.writer.write(" in ", null);
                    break;
                }
                case NotIn: {
                    this.writer.write(" not in ", null);
                    break;
                }
                default: {
                    throw new Error(`Unexpected comparison expression operator: ${op}`);
                }
            }
        }
        for (const comparator of ce.comparators) {
            comparator.accept(this);
        }
    }
    dict(dict: Dict): void {
        const keys = dict.keys;
        const values = dict.values;
        const N = keys.length;
        this.writer.beginObject();
        for (let i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            keys[i].accept(this);
            this.writer.write(":", null);
            values[i].accept(this);
        }
        this.writer.endObject();
    }
    expressionStatement(s: ExpressionStatement): void {
        this.writer.beginStatement();
        s.value.accept(this);
        this.writer.endStatement();
    }
    functionDef(functionDef: FunctionDef): void {
        const isClassMethod = isMethod(functionDef);
        if (!isClassMethod) {
            this.writer.write("function ", null);
        }
        this.writer.write(functionDef.name, null);
        this.writer.openParen();
        for (let i = 0; i < functionDef.args.args.length; i++) {
            const arg = functionDef.args.args[i];
            if (i === 0) {
                if (arg.id === 'self') {
                    // Ignore.
                }
                else {
                    arg.accept(this);
                }
            }
            else {
                arg.accept(this);
            }
        }
        this.writer.closeParen();
        this.writer.beginBlock();
        for (const stmt of functionDef.body) {
            stmt.accept(this);
        }
        this.writer.endBlock();
    }
    ifStatement(i: IfStatement): void {
        this.writer.write("if", null);
        this.writer.openParen();
        i.test.accept(this);
        this.writer.closeParen();
        this.writer.beginBlock();
        for (const con of i.consequent) {
            con.accept(this);
        }
        this.writer.endBlock();
    }
    importFrom(importFrom: ImportFrom): void {
        this.writer.beginStatement();
        this.writer.write("import ", null);
        this.writer.beginBlock();
        for (let i = 0; i < importFrom.names.length; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            const alias = importFrom.names[i];
            this.writer.write(alias.name, null);
            if (alias.asname) {
                this.writer.write(" as ", null);
                this.writer.write(alias.asname, null);
            }
        }
        this.writer.endBlock();
        this.writer.write(" from ", null);
        this.writer.beginQuote();
        // TODO: Escaping?
        this.writer.write(importFrom.module, null);
        this.writer.endQuote();
        this.writer.endStatement();
    }
    list(list: List): void {
        const elements = list.elts;
        const N = elements.length;
        this.writer.write('[', null);
        for (let i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            elements[i].accept(this);
        }
        this.writer.write(']', null);
    }
    module(m: Module): void {
        for (const stmt of m.body) {
            stmt.accept(this);
        }
    }
    name(name: Name): void {
        // TODO: Since 'True' and 'False' are reserved words in Python,
        // syntactic analysis (parsing) should be sufficient to identify
        // this name as a boolean expression - avoiding this overhead.
        switch (name.id) {
            case 'True': {
                this.writer.name('true', name.range);
                break;
            }
            case 'False': {
                this.writer.name('false', name.range);
                break;
            }
            default: {
                this.writer.name(name.id, name.range);
            }
        }
    }
    num(num: Num): void {
        const n = num.n;
        this.writer.num(n.toString(), num.range);
    }
    print(print: Print): void {
        this.writer.name("console", null);
        this.writer.write(".", null);
        this.writer.name("log", null);
        this.writer.openParen();
        for (const value of print.values) {
            value.accept(this);
        }
        this.writer.closeParen();
    }
    returnStatement(rs: ReturnStatement): void {
        this.writer.beginStatement();
        this.writer.write("return", null);
        this.writer.write(" ", null);
        rs.value.accept(this);
        this.writer.endStatement();
    }
    str(str: Str): void {
        const s = str.s;
        // const begin = str.begin;
        // const end = str.end;
        // TODO: AST is not preserving the original quoting, or maybe a hint.
        this.writer.write(toStringLiteralJS(s), null);
    }
}

export function transpileModule(sourceText: string): { code: string; sourceMap: MappingTree; cst: PyNode; mod: Module; symbolTable: SymbolTable; } {
    const cst = parse(sourceText, SourceKind.File);
    if (typeof cst === 'object') {
        const stmts = astFromParse(cst);
        const mod = new Module(stmts);
        const symbolTable = semanticsOfModule(mod);
        const printer = new Printer(symbolTable, 0, sourceText);
        const textAndMappings = printer.transpileModule(mod);
        const code = textAndMappings.text;
        const sourceMap = textAndMappings.tree;
        return { code, sourceMap, cst, mod, symbolTable };
    }
    else {
        throw new Error(`Error parsing source for file.`);
    }
}
