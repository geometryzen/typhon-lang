/// <reference path = "../../node_modules/typescript/lib/typescriptServices.d.ts" />

// import { assert } from '../pytools/asserts';
import { isArray } from '../pytools/base';
// import { isNumber } from '../pytools/base';
import { parse, SourceKind } from '../pytools/parser';
import { astFromExpression, astFromParse } from '../pytools/builder';
// import { reservedNames } from '../pytools/reservedNames';
// import { reservedWords } from '../pytools/reservedWords';
import { CompilerUnit } from '../pytools/compiler';
import { SymbolTable } from '../pytools/SymbolTable';
import { symbolTable, symbolTableFromStatements } from '../pytools/symtable';
// import { toStringLiteralJS } from '../pytools/toStringLiteralJS';

// import {And} from '../pytools/types';
// import { Arguments } from '../pytools/types';
import { Assert } from '../pytools/types';
import { Assign } from '../pytools/types';
// import { Attribute } from '../pytools/types';
import { AugAssign } from '../pytools/types';
// import { AugLoad } from '../pytools/types';
// import { AugStore } from '../pytools/types';
// import { BinOp } from '../pytools/types';
// import { BoolOp } from '../pytools/types';
import { BreakStatement } from '../pytools/types';
// import { Call } from '../pytools/types';
import { ClassDef } from '../pytools/types';
// import { Compare } from '../pytools/types';
// import { Comprehension } from '../pytools/types';
import { ContinueStatement } from '../pytools/types';
// import { Decorator } from '../pytools/types';
// import { Del } from '../pytools/types';
import { DeleteStatement } from '../pytools/types';
// import { Dict } from '../pytools/types';
// import { Ellipsis } from '../pytools/types';
import { ExpressionStatement } from '../pytools/types';
import { Expression } from '../pytools/types';
// import { ExtSlice } from '../pytools/types';
import { ForStatement } from '../pytools/types';
import { FunctionDef } from '../pytools/types';
// import { GeneratorExp } from '../pytools/types';
// import { Global } from '../pytools/types';
import { IfStatement } from '../pytools/types';
// import { IfExp } from '../pytools/types';
import { ImportStatement } from '../pytools/types';
import { ImportFrom } from '../pytools/types';
// import { Index } from '../pytools/types';
// import { Lambda } from '../pytools/types';
// import { List } from '../pytools/types';
// import { ListComp } from '../pytools/types';
// import { Load } from '../pytools/types';
import { Module } from '../pytools/types';
import { Name } from '../pytools/types';
import { Num } from '../pytools/types';
// import { Param } from '../pytools/types';
// import { Pass } from '../pytools/types';
import { Print } from '../pytools/types';
import { Raise } from '../pytools/types';
import { ReturnStatement } from '../pytools/types';
// import { Slice } from '../pytools/types';
import { Statement } from '../pytools/types';
// import { Store } from '../pytools/types';
// import { Str } from '../pytools/types';
// import { Subscript } from '../pytools/types';
// import { SubscriptContext } from '../pytools/types';
import { TryExcept } from '../pytools/types';
import { TryFinally } from '../pytools/types';
// import { Tuple } from '../pytools/types';
// import { UnaryOp } from '../pytools/types';
import { WhileStatement } from '../pytools/types';
// import { Yield } from '../pytools/types';

// import { LOCAL } from '../pytools/SymbolConstants';
// import { GLOBAL_EXPLICIT } from '../pytools/SymbolConstants';
// import { GLOBAL_IMPLICIT } from '../pytools/SymbolConstants';
// import { FREE } from '../pytools/SymbolConstants';
// import { CELL } from '../pytools/SymbolConstants';
// import { FunctionBlock } from '../pytools/SymbolConstants';
// TODO: Replace these with the TypeScript AST
// import {Node} from '../estools/esprima';
// import {generate} from '../estools/escodegen';

// const OP_FAST = 0;
// const OP_GLOBAL = 1;
// const OP_DEREF = 2;
// const OP_NAME = 3;
// const D_NAMES = 0;
// const D_FREEVARS = 1;
// const D_CELLVARS = 2;

/*
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
*/

// Flags
// const F_ALLOW_IN = 1;
// const F_ALLOW_CALL = 1 << 1;
// const F_ALLOW_UNPARATH_NEW = 1 << 2;
// const F_FUNC_BODY = 1 << 3;
// const F_DIRECTIVE_CTX = 1 << 4;
// const F_SEMICOLON_OPT = 1 << 5;

// Expression flag sets
// NOTE: Flag order:
// F_ALLOW_IN
// F_ALLOW_CALL
// F_ALLOW_UNPARATH_NEW
// const E_FTT = F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
// const E_TTF = F_ALLOW_IN | F_ALLOW_CALL;
// const E_TTT = F_ALLOW_IN | F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
// const E_TFF = F_ALLOW_IN;
// const E_FFT = F_ALLOW_UNPARATH_NEW;
// const E_TFT = F_ALLOW_IN | F_ALLOW_UNPARATH_NEW;

// Statement flag sets
// NOTE: Flag order:
// F_ALLOW_IN
// F_FUNC_BODY
// F_DIRECTIVE_CTX
// F_SEMICOLON_OPT
// const S_TFFF = F_ALLOW_IN;
// const S_TFFT = F_ALLOW_IN | F_SEMICOLON_OPT;
// const S_FFFF = 0x00;
// const S_TFTF = F_ALLOW_IN | F_DIRECTIVE_CTX;
// const S_TTFF = F_ALLOW_IN | F_FUNC_BODY;

/**
 * We keep track of how many time gensym method on the Compiler is called because ... ?
 */
let gensymCount = 0;

function updateDeeply(target: any, override: any) {

    function isHashObject(target: any) {
        return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
    }

    for (let key in override) {
        if (override.hasOwnProperty(key)) {
            const val = override[key];
            if (isHashObject(val)) {
                if (isHashObject(target[key])) {
                    updateDeeply(target[key], val);
                }
                else {
                    target[key] = updateDeeply({}, val);
                }
            }
            else {
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
function flattenToString(arr: any): string {
    let result = '';
    for (let i = 0, iz = arr.length; i < iz; ++i) {
        const elem = arr[i];
        result += isArray(elem) ? flattenToString(elem) : elem;
    }
    return result;
}

/*
function withIndent(fn: (base: number) => void) {
    let previousBase: number = base;
    base += indent;
    fn(base);
    base = previousBase;
}
*/

/**
 * TODO: Rename compileModule
 */
export function compile(source: string, fileName: string): { code: string } {
    const resultFile = ts.createSourceFile(fileName, "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const code = printer.printNode(ts.EmitHint.Unspecified, transpileModule(source), resultFile);
    return { code };
}

export function compileExpression(source: string, fileName: string): { code: string } {
    const resultFile = ts.createSourceFile(fileName, "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const code = printer.printNode(ts.EmitHint.Expression, transpileExpression(source), resultFile);
    return { code };
}

export function compileSingle(source: string, fileName: string): { code: string } {
    const resultFile = ts.createSourceFile(fileName, "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const code = printer.printNode(ts.EmitHint.Expression, transpileSingle(source)[0], resultFile);
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
    private st: SymbolTable | undefined;
    private flags: number;
    private interactive: boolean;
    private nestlevel: number;
    private u: CompilerUnit;
    private stack: CompilerUnit[];
    private allUnits: CompilerUnit[];
    private source: string[] | boolean;
    constructor(st: SymbolTable | undefined, flags: number, sourceCodeForAnnotation: string) {
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
    module(ast: Module, flags: number): ts.ModuleBlock {
        // const node: ts.Node = new Node();
        const body = this.statementList(ast.body, flags);
        return ts.createModuleBlock(body);
        // node.finishProgram(body);
        // return node;
        // throw new Error(`TODO: module`);
    }
    statementList(stmts: Statement[], flags: number): ts.Statement[] {
        const nodes: ts.Statement[] = [];
        const iLen = stmts.length;
        for (let i = 0; i < iLen; i++) {
            const stmt = stmts[i];
            nodes.push(this.statement(stmt, flags));
        }
        return nodes;
    }
    statement(s: Statement, flags: number): ts.Statement {
        // this.u.lineno = s.lineno;
        // this.u.linenoSet = false;

        // this.annotateSource(s);
        if (s instanceof ExpressionStatement) {
            return ts.createStatement(this.expr(s.value, flags));
        }
        else if (s instanceof Assign) {
            return ts.createStatement(this.assign(s, flags));
        }

        switch (s.constructor) {
            /*
            case FunctionDef:
                return this.functionDef(s, flags);
            case ClassDef:
                return this.classDef(s, flags);
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
            */
            default: {
                throw new Error(`statement(s = ${JSON.stringify(s)}, flags = ${flags})`);
            }
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
    deleteExpression(de: DeleteStatement, flags: number): ts.Node {
        throw new Error("DeleteStatement");
    }
    assign(assign: Assign, flags: number): ts.BinaryExpression {
        // const node = new Node();
        // node.finishAssignmentExpression(operator, left, right);
        const right = this.expr(assign.value, flags);
        const n = assign.targets.length;
        let lhs: ts.Expression;
        for (let i = 0; i < n; ++i)
            lhs = this.expr(assign.targets[i], flags);
        // return node;
        return ts.createAssignment(lhs, right);

        // throw new Error("Assign");
    }
    augAssign(aa: AugAssign, flags: number): ts.Node {
        throw new Error("FunctionDef");
    }
    expr(expr: Expression, flags: number): ts.Expression {
        console.log(`${JSON.stringify(expr)}`);
        if (expr instanceof Num) {
            return ts.createLiteral(expr.n.value);
        }
        else if (expr instanceof Name) {
            return ts.createIdentifier(expr.id);
        }
        throw new Error(`${JSON.stringify(expr)}`);
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

/**
 *
 * @param sourceText
 * @param sourceKind
 */
export function transpileModule(sourceText: string): ts.ModuleBlock {
    const cst = parse(sourceText, SourceKind.File);
    if (typeof cst === 'object') {
        const stmts = astFromParse(cst);
        const mod = new Module(stmts);
        const st = symbolTable(mod);
        const t = new Transpiler(st, 0, sourceText);
        const flags = 0;
        // FIXME: This should be according to the sourceKind.
        return t.module(mod, flags);
    }
    else {
        throw new Error(`Error parsing source for file.`);
    }
}

export function transpileExpression(sourceText: string): ts.Expression {
    const cst = parse(sourceText, SourceKind.Single);
    if (typeof cst === 'object') {
        const expr = astFromExpression(cst);
        // const st = symbolTableFromStatements(stmts);
        const t = new Transpiler(undefined, 0, sourceText);
        const flags = 0;
        // FIXME: This should be according to the sourceKind.
        return t.expr(expr, flags);
    }
    else {
        throw new Error(`Error parsing source for file.`);
    }
}

export function transpileSingle(sourceText: string): ts.Statement[] {
    const cst = parse(sourceText, SourceKind.Single);
    if (typeof cst === 'object') {
        const stmts = astFromParse(cst);
        const st = symbolTableFromStatements(stmts);
        const t = new Transpiler(st, 0, sourceText);
        const flags = 0;
        // FIXME: This should be according to the sourceKind.
        return t.statementList(stmts, flags);
    }
    else {
        throw new Error(`Error parsing source for file.`);
    }
}
