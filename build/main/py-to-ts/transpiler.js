"use strict";
/// <reference path = "../../node_modules/typescript/lib/typescriptServices.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
// import { assert } from '../pytools/asserts';
var base_1 = require("../pytools/base");
// import { isNumber } from '../pytools/base';
var parser_1 = require("../pytools/parser");
var builder_1 = require("../pytools/builder");
var symtable_1 = require("../pytools/symtable");
var types_1 = require("../pytools/types");
// import { Dict } from '../pytools/types';
// import { Ellipsis } from '../pytools/types';
var types_2 = require("../pytools/types");
// import { Index } from '../pytools/types';
// import { Lambda } from '../pytools/types';
// import { List } from '../pytools/types';
// import { ListComp } from '../pytools/types';
// import { Load } from '../pytools/types';
var types_3 = require("../pytools/types");
var types_4 = require("../pytools/types");
var types_5 = require("../pytools/types");
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
var gensymCount = 0;
function updateDeeply(target, override) {
    function isHashObject(target) {
        return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
    }
    for (var key in override) {
        if (override.hasOwnProperty(key)) {
            var val = override[key];
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
function flattenToString(arr) {
    var result = '';
    for (var i = 0, iz = arr.length; i < iz; ++i) {
        var elem = arr[i];
        result += base_1.isArray(elem) ? flattenToString(elem) : elem;
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
function compile(source, fileName) {
    var resultFile = ts.createSourceFile(fileName, "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    var printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    var code = printer.printNode(ts.EmitHint.Unspecified, transpileModule(source), resultFile);
    return { code: code };
}
exports.compile = compile;
function compileExpression(source, fileName) {
    var resultFile = ts.createSourceFile(fileName, "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    var printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    var code = printer.printNode(ts.EmitHint.Expression, transpileExpression(source), resultFile);
    return { code: code };
}
exports.compileExpression = compileExpression;
function compileSingle(source, fileName) {
    var resultFile = ts.createSourceFile(fileName, "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    var printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    var code = printer.printNode(ts.EmitHint.Expression, transpileSingle(source)[0], resultFile);
    return { code: code };
}
exports.compileSingle = compileSingle;
function resetCompiler() {
    gensymCount = 0;
}
exports.resetCompiler = resetCompiler;
/**
 * Transpiles from Python to JavaScript.
 */
var Transpiler = (function () {
    function Transpiler(st, flags, sourceCodeForAnnotation) {
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
    Transpiler.prototype.module = function (ast, flags) {
        // const node: ts.Node = new Node();
        var body = this.statementList(ast.body, flags);
        return ts.createModuleBlock(body);
        // node.finishProgram(body);
        // return node;
        // throw new Error(`TODO: module`);
    };
    Transpiler.prototype.statementList = function (stmts, flags) {
        var nodes = [];
        var iLen = stmts.length;
        for (var i = 0; i < iLen; i++) {
            var stmt = stmts[i];
            nodes.push(this.statement(stmt, flags));
        }
        return nodes;
    };
    Transpiler.prototype.statement = function (s, flags) {
        // this.u.lineno = s.lineno;
        // this.u.linenoSet = false;
        // this.annotateSource(s);
        if (s instanceof types_2.ExpressionStatement) {
            return ts.createStatement(this.expr(s.value, flags));
        }
        else if (s instanceof types_1.Assign) {
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
                throw new Error("statement(s = " + JSON.stringify(s) + ", flags = " + flags + ")");
            }
        }
    };
    Transpiler.prototype.assert = function (a, flags) {
        throw new Error("Assert");
    };
    Transpiler.prototype.breakStatement = function (b, flags) {
        /*
        if (this.u.breakBlocks.length === 0)
            throw new SyntaxError("'break' outside loop");
        break;
        */
        throw new Error("BreakStatement");
    };
    Transpiler.prototype.classDef = function (c, flags) {
        throw new Error("ClassDef");
    };
    Transpiler.prototype.continueStatement = function (c, flags) {
        throw new Error("ContinueStatement");
    };
    Transpiler.prototype.forStatement = function (fs, flags) {
        throw new Error("ForStatement");
    };
    Transpiler.prototype.functionDef = function (f, flags) {
        throw new Error("FunctionDef");
    };
    Transpiler.prototype.ifStatement = function (fs, flags) {
        throw new Error("IfStatement");
    };
    Transpiler.prototype.importFrom = function (i, flags) {
        // const node = new Node();
        // node.fi
        throw new Error("ImportFrom");
    };
    Transpiler.prototype.importStatement = function (i, flags) {
        throw new Error("ImportStatement");
    };
    Transpiler.prototype.returnStatement = function (rs, flags) {
        /*
        if (this.u.ste.blockType !== FunctionBlock)
            throw new SyntaxError("'return' outside function");
        if (rs.value)
            out("return ", this.vexpr(rs.value), ";");
        else
            out("return null;");
        */
        throw new Error("ClassDef");
    };
    Transpiler.prototype.deleteExpression = function (de, flags) {
        throw new Error("DeleteStatement");
    };
    Transpiler.prototype.assign = function (assign, flags) {
        // const node = new Node();
        // node.finishAssignmentExpression(operator, left, right);
        var right = this.expr(assign.value, flags);
        var n = assign.targets.length;
        var lhs;
        for (var i = 0; i < n; ++i)
            lhs = this.expr(assign.targets[i], flags);
        // return node;
        return ts.createAssignment(lhs, right);
        // throw new Error("Assign");
    };
    Transpiler.prototype.augAssign = function (aa, flags) {
        throw new Error("FunctionDef");
    };
    Transpiler.prototype.expr = function (expr, flags) {
        console.log("" + JSON.stringify(expr));
        if (expr instanceof types_5.Num) {
            return ts.createLiteral(expr.n.value);
        }
        else if (expr instanceof types_4.Name) {
            return ts.createIdentifier(expr.id);
        }
        throw new Error("" + JSON.stringify(expr));
    };
    Transpiler.prototype.print = function (p, flags) {
        throw new Error("Print");
    };
    Transpiler.prototype.raise = function (raise, flags) {
        throw new Error("Raise");
    };
    Transpiler.prototype.tryExcept = function (te, flags) {
        throw new Error("TryExcept");
    };
    Transpiler.prototype.tryFinally = function (tf, flags) {
        throw new Error("TryFinally");
    };
    Transpiler.prototype.whileStatement = function (ws, flags) {
        throw new Error("WhileStatement");
    };
    return Transpiler;
}());
/**
 *
 * @param sourceText
 * @param sourceKind
 */
function transpileModule(sourceText) {
    var cst = parser_1.parse(sourceText, parser_1.SourceKind.File);
    if (typeof cst === 'object') {
        var stmts = builder_1.astFromParse(cst);
        var mod = new types_3.Module(stmts);
        var st = symtable_1.symbolTable(mod);
        var t = new Transpiler(st, 0, sourceText);
        var flags = 0;
        // FIXME: This should be according to the sourceKind.
        return t.module(mod, flags);
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}
exports.transpileModule = transpileModule;
function transpileExpression(sourceText) {
    var cst = parser_1.parse(sourceText, parser_1.SourceKind.Single);
    if (typeof cst === 'object') {
        var expr = builder_1.astFromExpression(cst);
        // const st = symbolTableFromStatements(stmts);
        var t = new Transpiler(undefined, 0, sourceText);
        var flags = 0;
        // FIXME: This should be according to the sourceKind.
        return t.expr(expr, flags);
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}
exports.transpileExpression = transpileExpression;
function transpileSingle(sourceText) {
    var cst = parser_1.parse(sourceText, parser_1.SourceKind.Single);
    if (typeof cst === 'object') {
        var stmts = builder_1.astFromParse(cst);
        var st = symtable_1.symbolTableFromStatements(stmts);
        var t = new Transpiler(st, 0, sourceText);
        var flags = 0;
        // FIXME: This should be according to the sourceKind.
        return t.statementList(stmts, flags);
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}
exports.transpileSingle = transpileSingle;
