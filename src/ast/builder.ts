import { assert, fail } from '../common/asserts';
import { NCH, CHILD, FIND } from '../common/tree';

import { Add } from './types';
// TODO: Conventions
import { Alias } from './types';
import { Arguments } from './types';
import { And } from './types';
import { AnnAssign } from './types';
import { Assert } from './types';
import { Assign } from './types';
import { Attribute } from './types';
import { AugAssign } from './types';
import { AugLoad } from './types';
import { AugStore } from './types';
import { BinOp } from './types';
import { BitAnd } from './types';
import { BitOr } from './types';
import { BitXor } from './types';
import { BoolOp } from './types';
import { BreakStatement } from './types';
import { Call } from './types';
import { ClassDef } from './types';
import { Compare } from './types';
import { Comprehension } from './types';
import { ContinueStatement } from './types';
import { Del } from './types';
import { DeleteStatement } from './types';
import { Dict } from './types';
import { Div } from './types';
import { Ellipsis } from './types';
import { Eq } from './types';
import { ExceptHandler } from './types';
import { Exec } from './types';
import { Expression } from './types';
import { ExpressionStatement } from './types';
import { ExtSlice } from './types';
import { FloorDiv } from './types';
import { FunctionParamDef } from './types';
import { ForStatement } from './types';
import { FunctionDef } from './types';
import { GeneratorExp } from './types';
import { Global } from './types';
import { Gt } from './types';
import { GtE } from './types';
// FIXME: Convention
import { Keyword } from './types';
import { IfStatement } from './types';
import { IfExp } from './types';
import { ImportStatement } from './types';
import { ImportFrom } from './types';
import { Index } from './types';
import { In } from './types';
import { Invert } from './types';
import { Is } from './types';
import { IsNot } from './types';
import { Lambda } from './types';
import { List } from './types';
import { ListComp } from './types';
import { Load } from './types';
import { LShift } from './types';
import { Lt } from './types';
import { LtE } from './types';
import { Mod } from './types';
// import { Module } from './types';
import { Mult } from './types';
import { NonLocal } from './types';
import { Name } from './types';
import { Not } from './types';
import { NotEq } from './types';
import { NotIn } from './types';
import { Num } from './types';
import { Operator } from './types';
import { Or } from './types';
import { Param } from './types';
import { Pass } from './types';
import { Pow } from './types';
import { Print } from './types';
import { Raise } from './types';
import { RangeAnnotated } from './types';
import { ReturnStatement } from './types';
import { RShift } from './types';
import { Slice } from './types';
import { Statement } from './types';
import { Store } from './types';
import { Str } from './types';
import { Sub } from './types';
import { Subscript } from './types';
import { TryExcept } from './types';
import { TryFinally } from './types';
import { Tuple } from './types';
import { UAdd } from './types';
import { UnaryOp } from './types';
import { USub } from './types';
import { WhileStatement } from './types';
import { WithStatement } from './types';
import { Yield } from './types';

import { isNumber, isString } from '../common/base';
import { ParseTables } from '../cst/tables';
import { Tokens as TOK } from '../cst/Tokens';
import { floatAST, intAST, longAST } from './numericLiteral';
import { INumericLiteral } from './types';
import { PyNode } from '../cst/parser';
import { Range } from '../common/Range';
// import { cstDump } from './parser';
import { grammarName } from '../cst/grammarName';

//
// This is pretty much a straight port of ast.c from CPython 2.6.5.
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//
const SYM = ParseTables.sym;

/**
 *
 */
const LONG_THRESHOLD = Math.pow(2, 53);

/**
 * FIXME: Consolidate with parseError in parser.
 */
function syntaxError(message: string, range: Range): SyntaxError {
    assert(isString(message), "message must be a string");
    assert(isNumber(range.begin.line), "lineNumber must be a number");
    const e = new SyntaxError(message/*, fileName*/);
    e['lineNumber'] = range.begin.line;
    return e;
}

class Compiling {
    c_encoding: string;
    constructor(encoding: 'utf-8') {
        this.c_encoding = encoding;
    }
}

/**
 * Asserts that the type of the node is that specified.
 */
function REQ(n: PyNode, type: TOK | number): void {
    // Avoid the cost of building the message string when there is no issue.
    if (n.type !== type) {
        fail(`node must have type ${type} = ${grammarName(type)}, but was ${n.type} = ${grammarName(n.type)}.`);
    }
}

/**
 * Nothing more than assertion that the argument is a string.
 */
function strobj(s: string): string {
    // Avoid the cost of building the message string when there is no issue.
    if (typeof s !== 'string') {
        fail("expecting string, got " + (typeof s));
    }
    // This previously constructed the runtime representation.
    // That may have had an string intern side effect?
    return s;
}

function numStmts(n: PyNode): number {
    switch (n.type) {
        case SYM.single_input:
            if (CHILD(n, 0).type === TOK.T_NEWLINE)
                return 0;
            else
                return numStmts(CHILD(n, 0));
        case SYM.file_input:
            let cnt = 0;
            for (let i = 0; i < NCH(n); ++i) {
                const ch = CHILD(n, i);
                if (ch.type === SYM.stmt) {
                    cnt += numStmts(ch);
                }
            }
            return cnt;
        case SYM.stmt:
            return numStmts(CHILD(n, 0));
        case SYM.compound_stmt:
            return 1;
        case SYM.simple_stmt:
            return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
        case SYM.suite:
            if (NCH(n) === 1)
                return numStmts(CHILD(n, 0));
            else {
                let cnt = 0;
                for (let i = 2; i < NCH(n) - 1; ++i) {
                    cnt += numStmts(CHILD(n, i));
                }
                return cnt;
            }
        default: {
            throw new Error("Non-statement found");
        }
    }
}

function forbiddenCheck(c: Compiling, n: PyNode, x: string | undefined, range: Range): void {
    if (x === "None") throw syntaxError("assignment to None", range);
    if (x === "True" || x === "False") throw syntaxError("assignment to True or False is forbidden", range);
}

/**
 * Set the context ctx for e, recursively traversing e.
 *
 * Only sets context for expr kinds that can appear in assignment context as
 * per the asdl file.
 */
function setContext(c: Compiling, e: Expression, ctx: Store, n: PyNode): void {
    assert(ctx !== AugStore && ctx !== AugLoad);
    let s: Expression[] = null;
    let exprName: string = null;

    if (e instanceof Attribute) {
        if (ctx === Store) forbiddenCheck(c, n, e.attr.value, n.range);
        e.ctx = ctx;
    }
    else if (e instanceof Name) {
        if (ctx === Store) forbiddenCheck(c, n, /*e.attr*/void 0, n.range);
        e.ctx = ctx;
    }
    else if (e instanceof Subscript) {
        e.ctx = ctx;
    }
    else if (e instanceof List) {
        e.ctx = ctx;
        s = e.elts;
    }
    else if (e instanceof Tuple) {
        if (e.elts.length === 0) {
            throw syntaxError("can't assign to ()", n.range);
        }
        e.ctx = ctx;
        s = e.elts;
    }
    else if (e instanceof Lambda) {
        exprName = "lambda";
    }
    else if (e instanceof Call) {
        exprName = "function call";
    }
    else if (e instanceof BoolOp) {
        exprName = "operator";
    }
    else {
        switch (e.constructor) {
            case BoolOp:
            case BinOp:
            case UnaryOp:
                exprName = "operator";
                break;
            case GeneratorExp:
                exprName = "generator expression";
                break;
            case Yield:
                exprName = "yield expression";
                break;
            case ListComp:
                exprName = "list comprehension";
                break;
            case Dict:
            case Num:
            case Str:
                exprName = "literal";
                break;
            case Compare:
                exprName = "comparison expression";
                break;
            case IfExp:
                exprName = "conditional expression";
                break;
            default: {
                throw new Error("unhandled expression in assignment");
            }
        }

    }
    if (exprName) {
        throw syntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName, n.range);
    }

    if (s) {
        for (const e of s) {
            setContext(c, e, ctx, n);
        }
    }
}

const operatorMap: { [token: number]: Operator } = {};
(function () {
    operatorMap[TOK.T_VBAR] = BitOr;
    assert(operatorMap[TOK.T_VBAR] !== undefined, `${TOK.T_VBAR}`);
    // assert(operatorMap[TOK.T_VBAR] === BitOr, `${TOK.T_VBAR}`);
    operatorMap[TOK.T_VBAR] = BitOr;
    operatorMap[TOK.T_CIRCUMFLEX] = BitXor;
    operatorMap[TOK.T_AMPER] = BitAnd;
    operatorMap[TOK.T_LEFTSHIFT] = LShift;
    operatorMap[TOK.T_RIGHTSHIFT] = RShift;
    operatorMap[TOK.T_PLUS] = Add;
    operatorMap[TOK.T_MINUS] = Sub;
    operatorMap[TOK.T_STAR] = Mult;
    operatorMap[TOK.T_SLASH] = Div;
    operatorMap[TOK.T_DOUBLESLASH] = FloorDiv;
    operatorMap[TOK.T_PERCENT] = Mod;
}());

function getOperator(n: PyNode): { op: Operator; range: Range } {
    assert(operatorMap[n.type] !== undefined, `${n.type}`);
    return { op: operatorMap[n.type], range: n.range };
}

function astForCompOp(c: Compiling, n: PyNode): Lt | Gt | Eq | LtE | GtE | NotEq | In | Is | NotIn | IsNot {
    // comp_op: '<'|'>'|'=='|'>='|'<='|'<>'|'!='|'in'|'not' 'in'|'is' |'is' 'not'
    REQ(n, SYM.comp_op);
    if (NCH(n) === 1) {
        n = CHILD(n, 0);
        switch (n.type) {
            case TOK.T_LESS: return Lt;
            case TOK.T_GREATER: return Gt;
            case TOK.T_EQEQUAL: return Eq;
            case TOK.T_LESSEQUAL: return LtE;
            case TOK.T_GREATEREQUAL: return GtE;
            case TOK.T_NOTEQUAL: return NotEq;
            case TOK.T_NAME:
                if (n.value === "in") return In;
                if (n.value === "is") return Is;
        }
    }
    else if (NCH(n) === 2) {
        if (CHILD(n, 0).type === TOK.T_NAME) {
            if (CHILD(n, 1).value === "in") return NotIn;
            if (CHILD(n, 0).value === "is") return IsNot;
        }
    }
    throw new Error("invalid comp_op");
}

function seqForTestlist(c: Compiling, n: PyNode) {
    /* testlist: test (',' test)* [','] */
    assert(n.type === SYM.testlist ||
        n.type === SYM.listmaker ||
        n.type === SYM.testlist_gexp ||
        n.type === SYM.testlist_safe ||
        n.type === SYM.testlist1);
    const seq: Expression[] = [];
    for (let i = 0; i < NCH(n); i += 2) {
        assert(CHILD(n, i).type === SYM.IfExpr || CHILD(n, i).type === SYM.old_test);
        seq[i / 2] = astForExpr(c, CHILD(n, i));
    }
    return seq;
}

function astForSuite(c: Compiling, n: PyNode): Statement[] {
    /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
    REQ(n, SYM.suite);
    const seq: Statement[] = [];
    let pos = 0;
    let ch: PyNode;
    if (CHILD(n, 0).type === SYM.simple_stmt) {
        n = CHILD(n, 0);
        /* simple_stmt always ends with an NEWLINE and may have a trailing
            * SEMI. */
        let end = NCH(n) - 1;
        if (CHILD(n, end - 1).type === TOK.T_SEMI) {
            end -= 1;
        }
        // by 2 to skip
        for (let i = 0; i < end; i += 2) {
            seq[pos++] = astForStmt(c, CHILD(n, i));
        }
    }
    else {
        for (let i = 2; i < NCH(n) - 1; ++i) {
            ch = CHILD(n, i);
            REQ(ch, SYM.stmt);
            let num = numStmts(ch);
            if (num === 1) {
                // small_stmt or compound_stmt w/ only 1 child
                seq[pos++] = astForStmt(c, ch);
            }
            else {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (let j = 0; j < NCH(ch); j += 2) {
                    if (NCH(CHILD(ch, j)) === 0) {
                        assert(j + 1 === NCH(ch));
                        break;
                    }
                    seq[pos++] = astForStmt(c, CHILD(ch, j));
                }
            }
        }
    }
    assert(pos === numStmts(n));
    return seq;
}

function astForExceptClause(c: Compiling, exc: PyNode, body: PyNode): ExceptHandler {
    /* except_clause: 'except' [test [(',' | 'as') test]] */
    REQ(exc, SYM.except_clause);
    REQ(body, SYM.suite);
    if (NCH(exc) === 1) {
        return new ExceptHandler(null, null, astForSuite(c, body), exc.range);
    }
    else if (NCH(exc) === 2)
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.range);
    else if (NCH(exc) === 4) {
        const e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.range);
    }
    else {
        throw new Error("wrong number of children for except clause");
    }
}

function astForTryStmt(c: Compiling, n: PyNode): TryExcept | TryFinally {
    const nc = NCH(n);
    let nexcept = (nc - 3) / 3;
    let orelse: Statement[] = [];
    let finally_: Statement[] | null = null;

    REQ(n, SYM.try_stmt);
    let body = astForSuite(c, CHILD(n, 2));
    if (CHILD(n, nc - 3).type === TOK.T_NAME) {
        if (CHILD(n, nc - 3).value === "finally") {
            if (nc >= 9 && CHILD(n, nc - 6).type === TOK.T_NAME) {
                /* we can assume it's an "else",
                    because nc >= 9 for try-else-finally and
                    it would otherwise have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 4));
                nexcept--;
            }

            finally_ = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
        else {
            /* we can assume it's an "else",
                otherwise it would have a type of except_clause */
            orelse = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
    }
    else if (CHILD(n, nc - 3).type !== SYM.except_clause) {
        throw syntaxError("malformed 'try' statement", n.range);
    }

    if (nexcept > 0) {
        const handlers: ExceptHandler[] = [];
        for (let i = 0; i < nexcept; ++i) {
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        }
        const exceptSt = new TryExcept(body, handlers, orelse, n.range);

        if (!finally_)
            return exceptSt;

        /* if a 'finally' is present too, we nest the TryExcept within a
            TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }

    assert(finally_ !== null);
    return new TryFinally(body, finally_ as Statement[], n.range);
}


function astForDottedName(c: Compiling, n: PyNode): Attribute | Name {
    REQ(n, SYM.dotted_name);
    const child = CHILD(n, 0);
    let id = new RangeAnnotated(child.value, child.range);
    let e: Attribute | Name = new Name(id, Load);
    for (let i = 2; i < NCH(n); i += 2) {
        const child = CHILD(n, i);
        id = new RangeAnnotated(child.value, child.range);
        e = new Attribute(e, id, Load, n.range);
    }
    return e;
}

function astForDecorator(c: Compiling, n: PyNode): Attribute | Call | Name {
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    const nameExpr = astForDottedName(c, CHILD(n, 1));
    if (NCH(n) === 3) // no args
        return nameExpr;
    else if (NCH(n) === 5) // call with no args
        return new Call(nameExpr, [], [], null, null);
    else
        return astForCall(c, CHILD(n, 3), nameExpr);
}

function astForDecorators(c: Compiling, n: PyNode): (Attribute | Call | Name)[] {
    REQ(n, SYM.decorators);
    const decoratorSeq: (Attribute | Call | Name)[] = [];
    for (let i = 0; i < NCH(n); ++i) {
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    }
    return decoratorSeq;
}

function astForDecorated(c: Compiling, n: PyNode): FunctionDef | ClassDef {
    REQ(n, SYM.decorated);
    const decoratorSeq = astForDecorators(c, CHILD(n, 0));
    assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);

    let thing: FunctionDef | ClassDef | null = null;
    if (CHILD(n, 1).type === SYM.funcdef) {
        thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
    }
    else if (CHILD(n, 1).type === SYM.classdef) {
        thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
    }
    else {
        throw new Error("astForDecorated");
    }
    if (thing) {
        // FIXME: Pass into functions above?
        // thing.range = n.range;
    }
    return thing as (FunctionDef | ClassDef);
}

function astForWithVar(c: Compiling, n: PyNode): Expression {
    REQ(n, SYM.with_var);
    return astForExpr(c, CHILD(n, 1));
}

function astForWithStmt(c: Compiling, n: PyNode): WithStatement {
    /* with_stmt: 'with' test [ with_var ] ':' suite */
    let suiteIndex = 3; // skip with, test, :
    assert(n.type === SYM.with_stmt);
    const contextExpr = astForExpr(c, CHILD(n, 1));
    let optionalVars: Expression | undefined;
    if (CHILD(n, 2).type === SYM.with_var) {
        optionalVars = astForWithVar(c, CHILD(n, 2));
        setContext(c, optionalVars, Store, n);
        suiteIndex = 4;
    }
    return new WithStatement(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.range);
}

function astForExecStmt(c: Compiling, n: PyNode): Exec {
    let globals: Expression | null = null;
    let locals: Expression | null = null;
    const nchildren = NCH(n);
    assert(nchildren === 2 || nchildren === 4 || nchildren === 6);

    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    const expr1 = astForExpr(c, CHILD(n, 1));
    if (nchildren >= 4) {
        globals = astForExpr(c, CHILD(n, 3));
    }
    if (nchildren === 6) {
        locals = astForExpr(c, CHILD(n, 5));
    }
    return new Exec(expr1, globals, locals, n.range);
}

function astForIfStmt(c: Compiling, n: PyNode): IfStatement {
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
        ['else' ':' suite]
    */
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4)
        return new IfStatement(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            [], n.range);

    const s = CHILD(n, 4).value;
    const decider = s.charAt(2); // elSe or elIf
    if (decider === 's') {
        return new IfStatement(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            astForSuite(c, CHILD(n, 6)),
            n.range);
    }
    else if (decider === 'i') {
        let nElif = NCH(n) - 4;
        let hasElse = false;
        let orelse: IfStatement[] = [];
        /* must reference the child nElif+1 since 'else' token is third, not
            * fourth child from the end. */
        if (CHILD(n, nElif + 1).type === TOK.T_NAME && CHILD(n, nElif + 1).value.charAt(2) === 's') {
            hasElse = true;
            nElif -= 3;
        }
        nElif /= 4;

        if (hasElse) {
            orelse = [
                new IfStatement(
                    astForExpr(c, CHILD(n, NCH(n) - 6)),
                    astForSuite(c, CHILD(n, NCH(n) - 4)),
                    astForSuite(c, CHILD(n, NCH(n) - 1)),
                    CHILD(n, NCH(n) - 6).range)];
            nElif--;
        }

        for (let i = 0; i < nElif; ++i) {
            const off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new IfStatement(
                    astForExpr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
                    orelse,
                    CHILD(n, off).range)];
        }
        return new IfStatement(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            orelse, n.range);
    }
    throw new Error("unexpected token in 'if' statement");
}

function astForExprlist(c: Compiling, n: PyNode, context: Del | Store): Expression[] {
    REQ(n, SYM.ExprList);
    const seq: Expression[] = [];
    for (let i = 0; i < NCH(n); i += 2) {
        const e = astForExpr(c, CHILD(n, i));
        seq[i / 2] = e;
        if (context) setContext(c, e, context, CHILD(n, i));
    }
    return seq;
}

function astForDelStmt(c: Compiling, n: PyNode): DeleteStatement {
    REQ(n, SYM.del_stmt);
    return new DeleteStatement(astForExprlist(c, CHILD(n, 1), Del), n.range);
}

function astForGlobalStmt(c: Compiling, n: PyNode): Global {
    REQ(n, SYM.GlobalStmt);
    const s: string[] = [];
    for (let i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.range);
}

function astForNonLocalStmt(c: Compiling, n: PyNode): NonLocal {
    REQ(n, SYM.NonLocalStmt);
    const s: string[] = [];
    for (let i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new NonLocal(s, n.range);
}

function astForAssertStmt(c: Compiling, n: PyNode): Assert {
    /* assert_stmt: 'assert' test [',' test] */
    REQ(n, SYM.assert_stmt);
    if (NCH(n) === 2) {
        return new Assert(astForExpr(c, CHILD(n, 1)), null, n.range);
    }
    else if (NCH(n) === 4) {
        return new Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.range);
    }
    throw new Error("improper number of parts to assert stmt");
}

function aliasForImportName(c: Compiling, n: PyNode): Alias {
    /*
        ImportSpecifier: NAME ['as' NAME]
        dotted_as_name: dotted_name ['as' NAME]
        dotted_name: NAME ('.' NAME)*
    */

    loop: while (true) {
        switch (n.type) {
            case SYM.ImportSpecifier: {
                let str: string = null;
                const nameNode = CHILD(n, 0);
                const name = strobj(nameNode.value);
                const nameRange = nameNode.range;
                if (NCH(n) === 3) {
                    str = CHILD(n, 2).value;
                }
                return new Alias(new RangeAnnotated(name, nameRange), str == null ? null : strobj(str));
            }
            case SYM.dotted_as_name:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue loop;
                }
                else {
                    const a = aliasForImportName(c, CHILD(n, 0));
                    assert(!a.asname);
                    a.asname = strobj(CHILD(n, 2).value);
                    return a;
                }
            case SYM.dotted_name:
                if (NCH(n) === 1) {
                    const nameNode = CHILD(n, 0);
                    const name = strobj(nameNode.value);
                    const nameRange = nameNode.range;
                    return new Alias(new RangeAnnotated(name, nameRange), null);
                }
                else {
                    // create a string of the form a.b.c
                    let str = '';
                    for (let i = 0; i < NCH(n); i += 2) {
                        str += CHILD(n, i).value + ".";
                    }
                    return new Alias(new RangeAnnotated(str.substr(0, str.length - 1), null), null);
                }
            case TOK.T_STAR: {
                return new Alias(new RangeAnnotated("*", n.range), null);
            }
            case TOK.T_NAME: {
                // Temporary.
                return new Alias(new RangeAnnotated(n.value, n.range), null);
            }
            default: {
                throw syntaxError(`unexpected import name ${grammarName(n.type)}`, n.range);
            }
        }
    }
}

function parseModuleSpecifier(c: Compiling, moduleSpecifierNode: PyNode): { value: string; range: Range } {
    REQ(moduleSpecifierNode, SYM.ModuleSpecifier);
    const N = NCH(moduleSpecifierNode);
    let ret = "";
    let range: Range;
    for (let i = 0; i < N; ++i) {
        const child = CHILD(moduleSpecifierNode, i);
        ret = ret + parsestr(c, child.value);
        range = child.range;
    }
    return { value: ret, range };

}

function astForImportStmt(c: Compiling, importStatementNode: PyNode): ImportStatement | ImportFrom {
    REQ(importStatementNode, SYM.import_stmt);
    let nameOrFrom = CHILD(importStatementNode, 0);
    if (nameOrFrom.type === SYM.import_name) {
        const n = CHILD(nameOrFrom, 1);
        REQ(n, SYM.dotted_as_names);
        const aliases = [];
        for (let i = 0; i < NCH(n); i += 2) {
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        }
        return new ImportStatement(aliases, importStatementNode.range);
    }
    else if (nameOrFrom.type === SYM.import_from) {
        // let mod: Alias = null;
        let moduleSpec: { value: string; range: Range };
        let ndots = 0;
        let nchildren: number;
        let idx: number;
        for (idx = 1; idx < NCH(nameOrFrom); ++idx) {
            const child = CHILD(nameOrFrom, idx);
            const childType = child.type;
            if (childType === SYM.dotted_name) {
                // This should be dead code since we support ECMAScript 2015 modules.
                throw syntaxError(`unknown import statement ${grammarName(childType)}.`, child.range);
                // mod = aliasForImportName(c, child);
                // idx++;
                // break;
            }
            else if (childType === SYM.ModuleSpecifier) {
                moduleSpec = parseModuleSpecifier(c, child);
                break;
            }
            else if (childType !== TOK.T_DOT) {
                // Let's be more specific...
                throw syntaxError(`unknown import statement ${grammarName(childType)}.`, child.range);
                // break;
            }
            ndots++;
        }
        ++idx; // skip the import keyword
        let n = nameOrFrom;
        switch (CHILD(nameOrFrom, idx).type) {
            case TOK.T_STAR: {
                // from ... import
                n = CHILD(nameOrFrom, idx);
                nchildren = 1;
                break;
            }
            case TOK.T_LPAR: {
                // from ... import (x, y, z)
                n = CHILD(n, idx + 1);
                nchildren = NCH(n);
                break;
            }
            case SYM.ImportList: {
                // from ... import x, y, z
                n = CHILD(n, idx);
                nchildren = NCH(n);
                if (nchildren % 2 === 0) {
                    throw syntaxError("trailing comma not allowed without surrounding parentheses", n.range);
                }
            }
        }
        const aliases: Alias[] = [];
        if (n.type === TOK.T_STAR) {
            aliases[0] = aliasForImportName(c, n);
        }
        else {
            REQ(n, SYM.import_from);
            const importListNode = CHILD(n, FIND(n, SYM.ImportList));
            astForImportList(c, importListNode, aliases);
        }
        // moduleName = mod ? mod.name : moduleName;
        assert(typeof moduleSpec.value === 'string');
        return new ImportFrom(new RangeAnnotated(moduleSpec.value, moduleSpec.range), aliases, ndots, importStatementNode.range);
    }
    else {
        throw syntaxError(`unknown import statement ${grammarName(nameOrFrom.type)}.`, nameOrFrom.range);
    }
}

function astForImportList(c: Compiling, importListNode: PyNode, aliases: Alias[]): void {
    REQ(importListNode, SYM.ImportList);
    const N = NCH(importListNode);
    for (let i = 0; i < N; i++) {
        const child = CHILD(importListNode, i);
        if (child.type === SYM.ImportSpecifier) {
            aliases.push(aliasForImportName(c, child));
        }
    }
}

function astForTestlistGexp(c: Compiling, n: PyNode): Expression | Tuple {
    assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    if (NCH(n) > 1 && CHILD(n, 1).type === SYM.gen_for)
        return astForGenexp(c, n);
    return astForTestlist(c, n);
}

function astForListcomp(c: Compiling, n: PyNode): ListComp {
    function countListFors(c: Compiling, n: PyNode): number {
        let nfors = 0;
        let ch = CHILD(n, 1);
        count_list_for: while (true) {
            nfors++;
            REQ(ch, SYM.list_for);
            if (NCH(ch) === 5)
                ch = CHILD(ch, 4);
            else
                return nfors;
            count_list_iter: while (true) {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.list_for)
                    continue count_list_for;
                else if (ch.type === SYM.list_if) {
                    if (NCH(ch) === 3) {
                        ch = CHILD(ch, 2);
                        continue count_list_iter;
                    }
                    else
                        return nfors;
                }
                break;
            }
            // FIXME: What does a break at the end of a function do?
            break;
        }
        throw new Error("TODO: Should this be returning void 0?");
    }

    function countListIfs(c: Compiling, n: PyNode): number {
        let nifs = 0;
        while (true) {
            REQ(n, SYM.list_iter);
            if (CHILD(n, 0).type === SYM.list_for)
                return nifs;
            n = CHILD(n, 0);
            REQ(n, SYM.list_if);
            nifs++;
            if (NCH(n) === 2)
                return nifs;
            n = CHILD(n, 2);
        }
    }

    REQ(n, SYM.listmaker);
    assert(NCH(n) > 1);
    const elt = astForExpr(c, CHILD(n, 0));
    const nfors = countListFors(c, n);
    const listcomps: Comprehension[] = [];
    let ch = CHILD(n, 1);
    for (let i = 0; i < nfors; ++i) {
        REQ(ch, SYM.list_for);
        const forch = CHILD(ch, 1);
        const t = astForExprlist(c, forch, Store);
        const expression = astForTestlist(c, CHILD(ch, 3));
        let lc: Comprehension;
        if (NCH(forch) === 1)
            lc = new Comprehension(t[0], expression, []);
        else
            lc = new Comprehension(new Tuple(t, Store, ch.range), expression, []);

        if (NCH(ch) === 5) {
            ch = CHILD(ch, 4);
            const nifs = countListIfs(c, ch);
            const ifs: Expression[] = [];
            for (let j = 0; j < nifs; ++j) {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.list_if);
                ifs[j] = astForExpr(c, CHILD(ch, 1));
                if (NCH(ch) === 3)
                    ch = CHILD(ch, 2);
            }
            if (ch.type === SYM.list_iter)
                ch = CHILD(ch, 0);
            lc.ifs = ifs;
        }
        listcomps[i] = lc;
    }
    return new ListComp(elt, listcomps, n.range);
}

function astForUnaryExpr(c: Compiling, n: PyNode): Expression {
    if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2) {
        const pfactor = CHILD(n, 1);
        if (pfactor.type === SYM.UnaryExpr && NCH(pfactor) === 1) {
            const ppower = CHILD(pfactor, 0);
            if (ppower.type === SYM.PowerExpr && NCH(ppower) === 1) {
                const patom = CHILD(ppower, 0);
                if (patom.type === SYM.AtomExpr) {
                    const pnum = CHILD(patom, 0);
                    if (pnum.type === TOK.T_NUMBER) {
                        pnum.value = "-" + pnum.value;
                        return astForAtomExpr(c, patom);
                    }
                }
            }
        }
    }

    const expression = astForExpr(c, CHILD(n, 1));
    switch (CHILD(n, 0).type) {
        case TOK.T_PLUS: return new UnaryOp(UAdd, expression, n.range);
        case TOK.T_MINUS: return new UnaryOp(USub, expression, n.range);
        case TOK.T_TILDE: return new UnaryOp(Invert, expression, n.range);
    }

    throw new Error("unhandled UnaryExpr");
}

function astForForStmt(c: Compiling, n: PyNode): ForStatement {
    let seq: Statement[] = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9) {
        seq = astForSuite(c, CHILD(n, 8));
    }
    const nodeTarget = CHILD(n, 1);
    const _target = astForExprlist(c, nodeTarget, Store);
    let target;
    if (NCH(nodeTarget) === 1)
        target = _target[0];
    else
        target = new Tuple(_target, Store, n.range);

    return new ForStatement(target,
        astForTestlist(c, CHILD(n, 3)),
        astForSuite(c, CHILD(n, 5)),
        seq, n.range);
}

function astForCall(c: Compiling, n: PyNode, func: Expression): Call {
    /*
        arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
                | '**' test)
        argument: [test '='] test [gen_for]        # Really [keyword '='] test
    */
    REQ(n, SYM.arglist);
    let nargs = 0;
    let nkeywords = 0;
    let ngens = 0;
    for (let i = 0; i < NCH(n); ++i) {
        const ch = CHILD(n, i);
        if (ch.type === SYM.argument) {
            if (NCH(ch) === 1) nargs++;
            else if (CHILD(ch, 1).type === SYM.gen_for) ngens++;
            else nkeywords++;
        }
    }
    if (ngens > 1 || (ngens && (nargs || nkeywords)))
        throw syntaxError("Generator expression must be parenthesized if not sole argument", n.range);
    if (nargs + nkeywords + ngens > 255)
        throw syntaxError("more than 255 arguments", n.range);
    const args: Expression[] = [];
    const keywords: Keyword[] = [];
    nargs = 0;
    nkeywords = 0;
    let vararg: Expression = null;
    let kwarg: Expression = null;
    for (let i = 0; i < NCH(n); ++i) {
        const ch = CHILD(n, i);
        if (ch.type === SYM.argument) {
            if (NCH(ch) === 1) {
                if (nkeywords) throw syntaxError("non-keyword arg after keyword arg", n.range);
                if (vararg) throw syntaxError("only named arguments may follow *expression", n.range);
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else {
                const e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) {
                    throw syntaxError("lambda cannot contain assignment", n.range);
                } else if (e.constructor !== Name) {
                    throw syntaxError("keyword can't be an expression", n.range);
                }
                // TODO: Why does TypeScript think that the type is never?
                const key = (e as Expression).id;
                forbiddenCheck(c, CHILD(ch, 0), key.value, n.range);
                for (let k = 0; k < nkeywords; ++k) {
                    const tmp = keywords[k].arg.value;
                    if (tmp === key.value) throw syntaxError("keyword argument repeated", n.range);
                }
                keywords[nkeywords++] = new Keyword(key, astForExpr(c, CHILD(ch, 2)));
            }
        }
        else if (ch.type === TOK.T_STAR)
            vararg = astForExpr(c, CHILD(n, ++i));
        else if (ch.type === TOK.T_DOUBLESTAR)
            kwarg = astForExpr(c, CHILD(n, ++i));
    }
    // Convert keywords to a Dict, which is one arg
    const keywordDict = keywordsToDict(keywords);
    if (keywordDict.keys.length !== 0) {
        args.push(keywordDict);
    }
    return new Call(func, args, [], vararg, kwarg);
}

function keywordsToDict(keywords: Keyword[]): Dict {
    let keys: Expression[] = [];
    let values: Expression[] = [];
    for (const keyword of keywords) {
        values.push(keyword.value);
        keys.push(new Name(new RangeAnnotated(keyword.arg.value, keyword.arg.range), Load));
    }
    return new Dict(keys, values);
}

function astForTrailer(c: Compiling, node: PyNode, leftExpr: Expression): Attribute | Call | Subscript {
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
        subscriptlist: subscript (',' subscript)* [',']
        subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
        */

    const n = node;
    const childZero = CHILD(n, 0);
    const childOne = CHILD(n, 1);
    const childTwo = CHILD(n, 2);
    REQ(n, SYM.trailer);
    if (childZero.type === TOK.T_LPAR) {
        if (NCH(n) === 2) {
            return new Call(leftExpr, [], [], null, null);
        }
        else {
            return astForCall(c, childOne, leftExpr);
        }
    }
    else if (childZero.type === TOK.T_DOT) {
        return new Attribute(leftExpr, new RangeAnnotated(childOne.value, childOne.range), Load, n.range);
    }
    else {
        REQ(childZero, TOK.T_LSQB);
        REQ(childTwo, TOK.T_RSQB);
        const n = childOne;
        if (NCH(n) === 1)
            return new Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), Load, n.range);
        else {
            /* The grammar is ambiguous here. The ambiguity is resolved
                by treating the sequence as a tuple literal if there are
                no slice features.
            */
            let simple = true;
            const slices: (Ellipsis | Index | Name | Slice)[] = [];
            for (let j = 0; j < NCH(n); j += 2) {
                const slc = astForSlice(c, CHILD(n, j));
                if (slc.constructor !== Index) {
                    simple = false;
                }
                slices[j / 2] = slc;
            }
            if (!simple) {
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n.range);
            }
            const elts: Tuple[] = [];
            for (let j = 0; j < slices.length; ++j) {
                let slc = slices[j];
                if (slc instanceof Index) {
                    assert(slc.value !== null && slc.value !== undefined);
                    elts[j] = slc.value;
                }
                else {
                    assert(slc instanceof Index);
                }
            }
            const e = new Tuple(elts, Load, n.range);
            return new Subscript(leftExpr, new Index(e), Load, n.range);
        }
    }
}

function astForFlowStmt(c: Compiling, n: PyNode): BreakStatement | ExpressionStatement | Raise {
    REQ(n, SYM.flow_stmt);
    const ch = CHILD(n, 0);
    switch (ch.type) {
        case SYM.break_stmt: return new BreakStatement(n.range);
        case SYM.continue_stmt: return new ContinueStatement(n.range);
        case SYM.yield_stmt:
            return new ExpressionStatement(astForExpr(c, CHILD(ch, 0)), n.range);
        case SYM.return_stmt:
            if (NCH(ch) === 1)
                return new ReturnStatement(null, n.range);
            else
                return new ReturnStatement(astForTestlist(c, CHILD(ch, 1)), n.range);
        case SYM.raise_stmt: {
            if (NCH(ch) === 1)
                return new Raise(null, null, null, n.range);
            else if (NCH(ch) === 2)
                return new Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.range);
            else if (NCH(ch) === 4)
                return new Raise(
                    astForExpr(c, CHILD(ch, 1)),
                    astForExpr(c, CHILD(ch, 3)),
                    null, n.range);
            else if (NCH(ch) === 6)
                return new Raise(
                    astForExpr(c, CHILD(ch, 1)),
                    astForExpr(c, CHILD(ch, 3)),
                    astForExpr(c, CHILD(ch, 5)),
                    n.range);
            else {
                throw new Error("unhandled flow statement");
            }
        }
        default: {
            throw new Error("unexpected flow_stmt");
        }
    }
}

function astForArguments(c: Compiling, n: PyNode): Arguments {
    /* parameters: '(' [varargslist] ')'
        varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
            | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
    */
    let ch: PyNode;
    let vararg: string = null;
    let kwarg: string = null;
    if (n.type === SYM.parameters) {
        if (NCH(n) === 2) // () as arglist
            return new Arguments([], null, null, []);
        n = CHILD(n, 1); // n is a varargslist here on out
    }
    REQ(n, SYM.varargslist);

    const args: FunctionParamDef[] = [];
    const defaults: Expression[] = [];

    /* fpdef: NAME [':' IfExpr] | '(' fplist ')'
        fplist: fpdef (',' fpdef)* [',']
    */
    let foundDefault = false;
    let i = 0;
    let j = 0; // index for defaults
    let k = 0; // index for args
    // loop through the children of the varargslist
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
            // If it is a fpdef - act here
            case SYM.fpdef:
                let complexArgs = 0;
                let parenthesized = false;
                handle_fpdef: while (true) {
                    if (i + 1 < NCH(n) && CHILD(n, i + 1).type === TOK.T_EQUAL) {
                        defaults[j++] = astForExpr(c, CHILD(n, i + 2));
                        i += 2;
                        foundDefault = true;
                    }
                    else if (foundDefault) {
                        /* def f((x)=4): pass should raise an error.
                            def f((x, (y))): pass will just incur the tuple unpacking warning. */
                        if (parenthesized && !complexArgs)
                            throw syntaxError("parenthesized arg with default", n.range);
                        throw syntaxError("non-default argument follows default argument", n.range);
                    }

                    // For unpacking a tuple
                    if (NCH(ch) === 3 && ch.children[2].type === TOK.T_RPAR) {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1) {
                            throw syntaxError("tuple parameter unpacking has been removed", n.range);
                        }
                        else {
                            /* def foo((x)): setup for checking NAME below. */
                            /* Loop because there can be many parens and tuple
                                unpacking mixed in. */
                            parenthesized = true;
                            ch = CHILD(ch, 0);
                            assert(ch.type === SYM.fpdef);
                            continue handle_fpdef;
                        }
                    }
                    // childzero here is possibly the 'NAME' in fpdef: NAME [':' IfExpr]
                    const childZero = CHILD(ch, 0);
                    if (childZero.type === TOK.T_NAME) {
                        forbiddenCheck(c, n, childZero.value, n.range);
                        const id = new RangeAnnotated(childZero.value, childZero.range);
                        /**
                         * Setting the type of the param here, will be third child of fpdef if it exists
                         * If it doesn't exist then set the type as null and have typescript attempt to infer it later
                         */
                        const paramTypeNode: PyNode = CHILD(ch, 2);

                        if (paramTypeNode) {
                            let paramTypeExpr = astForExpr(c, paramTypeNode);
                            args[k++] = new FunctionParamDef(new Name(id, Param), paramTypeExpr);
                        }
                        else {
                            args[k++] = new FunctionParamDef(new Name(id, Param));
                        }

                    }
                    i += 2;
                    if (parenthesized)
                        throw syntaxError("parenthesized argument names are invalid", n.range);
                    break;
                }
                break;
            case TOK.T_STAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.range);
                vararg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            case TOK.T_DOUBLESTAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.range);
                kwarg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            default: {
                throw new Error("unexpected node in varargslist");
            }
        }
    }
    return new Arguments(args, vararg, kwarg, defaults);
}

function astForFuncdef(c: Compiling, n: PyNode, decoratorSeq: (Attribute | Call | Name)[]): FunctionDef {
    /**
     * funcdef: ['export'] def' NAME parameters ['->' IfExpr] ':' suite
     */
    REQ(n, SYM.funcdef);
    const numberOfChildren: number = NCH(n);
    let ch1: PyNode;
    let name: string;
    let args: Arguments;
    // Name and args are 1 node further if 'export' exists
    if (numberOfChildren !== 8 && numberOfChildren !== 6) {
        ch1 = CHILD(n, 1);
        name = strobj(ch1.value);
        forbiddenCheck(c, ch1, name, n.range);
        args = astForArguments(c, CHILD(n, 2));
    }
    else {
        ch1 = CHILD(n, 2);
        name = strobj(ch1.value);
        forbiddenCheck(c, ch1, name, n.range);
        args = astForArguments(c, CHILD(n, 3));
    }

    // suite is either 4, 6 or 7, depending on whether functype exists
    let body: Statement[];
    let returnType: Expression;

    // Neither Export nor FuncType exist
    if (numberOfChildren === 5) {
        body = astForSuite(c, CHILD(n, 4));
        returnType = null;
    }
    // Only Export exists
    else if (numberOfChildren === 6) {
        body = astForSuite(c, CHILD(n, 5));
        returnType = null;
    }
    // Only FuncType exists
    else if (numberOfChildren === 7) {
        returnType = astForExpr(c, CHILD(n, 4));
        body = astForSuite(c, CHILD(n, 6));
    }
    // Export AND FuncType exist
    else if (numberOfChildren === 8) {
        returnType = astForExpr(c, CHILD(n, 5));
        body = astForSuite(c, CHILD(n, 7));
    }
    else {
        fail(`Was expecting 5, 7 or 8 children, received ${numberOfChildren} children`);
    }

    return new FunctionDef(new RangeAnnotated(name, ch1.range), args, body, returnType, decoratorSeq, n.range);
}

function astForClassBases(c: Compiling, n: PyNode): Expression[] {
    const numberOfChildren = NCH(n);
    assert(numberOfChildren > 0);
    REQ(n, SYM.testlist);
    if (numberOfChildren === 1) {
        return [astForExpr(c, CHILD(n, 0))];
    }
    return seqForTestlist(c, n);
}

function astForClassdef(c: Compiling, node: PyNode, decoratorSeq: (Attribute | Call | Name)[]) {
    /**
     * ['export'] 'class' NAME ['(' [testlist] ')'] ':' suite
     */
    const n = node;
    const numberOfChildren = NCH(n);
    REQ(n, SYM.classdef);
    let nameNode;
    let className;
    let nameRange;
    if (numberOfChildren !== 5 && numberOfChildren !== 8) {
        if (numberOfChildren !== 7 || CHILD(n, 4).type !== TOK.T_RPAR) {
            nameNode = CHILD(n, 1);
            forbiddenCheck(c, n, nameNode.value, n.range);
            className = strobj(nameNode.value);
            nameRange = nameNode.range;
        }

    }
    else {
        nameNode = CHILD(n, 2);
        forbiddenCheck(c, n, nameNode.value, n.range);
        className = strobj(nameNode.value);
        nameRange = nameNode.range;
    }

    // If grammar looks like 'class NAME : suite'
    if (numberOfChildren === 4) {
        return new ClassDef(new RangeAnnotated(className, nameRange), [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.range);
    }
    // If grammar looks like 'export class NAME : suite'
    if (numberOfChildren === 5) {
        // temp
    }
    // If grammar looks like 'export class NAME '(' ')' : suite'
    if (numberOfChildren === 7 && CHILD(n, 3).type !== TOK.T_RPAR) {
        // temp
    }
    // If grammar looks like 'export class NAME '(' testlist ')' : suite '
    if (numberOfChildren === 8) {
        // temp
    }
    const c3 = CHILD(n, 3);
    // If grammar looks like 'class NAME '(' ')' : suite'
    if (c3.type === TOK.T_RPAR) {
        return new ClassDef(new RangeAnnotated(className, nameRange), [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.range);
    }
    // Otherwise grammar looks like 'class NAME '(' testlist ')' : suite'
    // ClassBases are 'testlist'
    const bases = astForClassBases(c, c3);
    const s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(new RangeAnnotated(className, nameRange), bases, s, decoratorSeq, n.range);
}

function astForLambdef(c: Compiling, n: PyNode): Lambda {
    let args: Arguments;
    let expression: Expression;
    if (NCH(n) === 3) {
        args = new Arguments([], null, null, []);
        expression = astForExpr(c, CHILD(n, 2));
    }
    else {
        args = astForArguments(c, CHILD(n, 1));
        expression = astForExpr(c, CHILD(n, 3));
    }
    return new Lambda(args, expression, n.range);
}

function astForGenexp(c: Compiling, n: PyNode): GeneratorExp {
    /* testlist_gexp: test ( gen_for | (',' test)* [','] )
        argument: [test '='] test [gen_for]       # Really [keyword '='] test */
    assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    assert(NCH(n) > 1);

    function countGenFors(c: Compiling, n: PyNode): number {
        let nfors = 0;
        let ch = CHILD(n, 1);
        count_gen_for: while (true) {
            nfors++;
            REQ(ch, SYM.gen_for);
            if (NCH(ch) === 5)
                ch = CHILD(ch, 4);
            else
                return nfors;
            count_gen_iter: while (true) {
                REQ(ch, SYM.gen_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.gen_for)
                    continue count_gen_for;
                else if (ch.type === SYM.gen_if) {
                    if (NCH(ch) === 3) {
                        ch = CHILD(ch, 2);
                        continue count_gen_iter;
                    }
                    else
                        return nfors;
                }
                break;
            }
            break;
        }
        throw new Error("logic error in countGenFors");
    }

    function countGenIfs(c: Compiling, n: PyNode): number {
        let nifs = 0;
        while (true) {
            REQ(n, SYM.gen_iter);
            if (CHILD(n, 0).type === SYM.gen_for)
                return nifs;
            n = CHILD(n, 0);
            REQ(n, SYM.gen_if);
            nifs++;
            if (NCH(n) === 2)
                return nifs;
            n = CHILD(n, 2);
        }
    }

    const elt = astForExpr(c, CHILD(n, 0));
    const nfors = countGenFors(c, n);
    const genexps: Comprehension[] = [];
    let ch = CHILD(n, 1);
    for (let i = 0; i < nfors; ++i) {
        REQ(ch, SYM.gen_for);
        const forch = CHILD(ch, 1);
        const t = astForExprlist(c, forch, Store);
        let expression = astForExpr(c, CHILD(ch, 3));
        let ge: Comprehension;
        if (NCH(forch) === 1)
            ge = new Comprehension(t[0], expression, []);
        else
            ge = new Comprehension(new Tuple(t, Store, ch.range), expression, []);
        if (NCH(ch) === 5) {
            ch = CHILD(ch, 4);
            const nifs = countGenIfs(c, ch);
            const ifs: Expression[] = [];
            for (let j = 0; j < nifs; ++j) {
                REQ(ch, SYM.gen_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.gen_if);
                expression = astForExpr(c, CHILD(ch, 1));
                ifs[j] = expression;
                if (NCH(ch) === 3)
                    ch = CHILD(ch, 2);
            }
            if (ch.type === SYM.gen_iter)
                ch = CHILD(ch, 0);
            ge.ifs = ifs;
        }
        genexps[i] = ge;
    }
    return new GeneratorExp(elt, genexps, n.range);
}

function astForWhileStmt(c: Compiling, n: PyNode): WhileStatement {
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.range);
    else if (NCH(n) === 7)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.range);
    throw new Error("wrong number of tokens for 'while' stmt");
}

function astForAugassign(c: Compiling, n: PyNode): Add | Sub | FloorDiv | Div | Mod | LShift | RShift | BitAnd | BitXor | BitOr | Pow | Mult {
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0)) {
        case '+': return Add;
        case '-': return Sub;
        case '/': {
            if (n.value.charAt(1) === '/') {
                return FloorDiv;
            } else {
                return Div;
            }
        }
        case '%': return Mod;
        case '<': return LShift;
        case '>': return RShift;
        case '&': return BitAnd;
        case '^': return BitXor;
        case '|': return BitOr;
        case '*': {
            if (n.value.charAt(1) === '*') {
                return Pow;
            }
            else {
                return Mult;
            }
        }
        default: {
            throw new Error("invalid augassign");
        }
    }
}

function astForBinop(c: Compiling, n: PyNode): BinOp {
    /* Must account for a sequence of expressions.
        How should A op B op C by represented?
        BinOp(BinOp(A, op, B), op, C).
    */
    let result = new BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.range);
    const nops = (NCH(n) - 1) / 2;
    for (let i = 1; i < nops; ++i) {
        const nextOper = CHILD(n, i * 2 + 1);
        const tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, getOperator(nextOper), tmp, nextOper.range);
    }
    return result;

}

function astForTestlist(c: Compiling, n: PyNode): Expression | Tuple {
    /* testlist_gexp: test (',' test)* [','] */
    /* testlist: test (',' test)* [','] */
    /* testlist_safe: test (',' test)+ [','] */
    /* testlist1: test (',' test)* */
    assert(NCH(n) > 0);
    if (n.type === SYM.testlist_gexp) {
        if (NCH(n) > 1) {
            assert(CHILD(n, 1).type !== SYM.gen_for);
        }
    }
    else {
        assert(n.type === SYM.testlist || n.type === SYM.testlist_safe || n.type === SYM.testlist1);
    }

    if (NCH(n) === 1) {
        return astForExpr(c, CHILD(n, 0));
    }
    else {
        return new Tuple(seqForTestlist(c, n), Load, n.range);
    }

}

function astForExprStmt(c: Compiling, node: PyNode): Assign | ExpressionStatement {
    // Prevent assignment.
    const n = node;
    REQ(n, SYM.ExprStmt);
    if (NCH(n) === 1) {
        return new ExpressionStatement(astForTestlist(c, CHILD(n, 0)), n.range);
    }
    else if (CHILD(n, 1).type === SYM.augassign) {
        let ch = CHILD(n, 0);
        const expr1 = astForTestlist(c, ch);
        switch (expr1.constructor) {
            case GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", n.range);
            case Yield: throw syntaxError("augmented assignment to yield expression not possible", n.range);
            case Name: {
                const varName = expr1.id;
                forbiddenCheck(c, ch, varName.value, n.range);

                break;
            }
            case Attribute:
            case Subscript:
                break;
            default:
                throw syntaxError("illegal expression for augmented assignment", n.range);
        }
        setContext(c, expr1, Store, ch);

        ch = CHILD(n, 2);
        let expr2: Expression;
        if (ch.type === SYM.testlist) {
            expr2 = astForTestlist(c, ch);
        }
        else
            expr2 = astForExpr(c, ch);

        return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.range);
    }
    else if (CHILD(n, 1).type === SYM.annasign) {
        // annasign
        // ':' 'IfExpr' ['=' 'IfExpr]
        const ch = CHILD(n, 0);
        const annasignChild = CHILD(n, 1);
        const type: Expression = astForExpr(c, CHILD(annasignChild, 1));
        const eq = CHILD(annasignChild, 2); // Equals sign
        if (eq) {
            REQ(eq, TOK.T_EQUAL);
            const variable: Expression[] = [astForTestlist(c, ch)]; // variable is the first node (before the annasign)
            const valueNode = CHILD(annasignChild, 3);
            let value: Expression;
            if (valueNode.type === SYM.testlist) {
                value = astForTestlist(c, valueNode);
            }
            else {
                value = astForExpr(c, valueNode);
            }
            return new Assign(variable, value, n.range, eq.range, type);
        }
        else {
            return new AnnAssign(type, astForTestlist(c, ch), n.range);
        }
    }
    else {
        // normal assignment
        const eq = CHILD(n, 1);
        REQ(eq, TOK.T_EQUAL);
        const targets: Expression[] = [];
        const N = NCH(n);
        for (let i = 0; i < N - 2; i += 2) {
            const ch = CHILD(n, i);
            if (ch.type === SYM.YieldExpr) throw syntaxError("assignment to yield expression not possible", n.range);
            const e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        const value = CHILD(n, N - 1);
        let expression: Expression;
        if (value.type === SYM.testlist)
            expression = astForTestlist(c, value);
        else
            expression = astForExpr(c, value);
        return new Assign(targets, expression, n.range, eq.range);
    }
}

function astForIfexpr(c: Compiling, n: PyNode): IfExp {
    assert(NCH(n) === 5);
    return new IfExp(
        astForExpr(c, CHILD(n, 2)),
        astForExpr(c, CHILD(n, 0)),
        astForExpr(c, CHILD(n, 4)),
        n.range);
}

// escape() was deprecated in JavaScript 1.5. Use encodeURI or encodeURIComponent instead.
function escape(s: string): string {
    return encodeURIComponent(s);
}

/**
 * s is a python-style string literal, including quote characters and u/r/b
 * prefixes. Returns decoded string object.
 */
function parsestr(c: Compiling, s: string): string {
    // const encodeUtf8 = function(s) { return unescape(encodeURIComponent(s)); };
    const decodeUtf8 = function (s: string) { return decodeURIComponent(escape(s)); };
    const decodeEscape = function (s: string, quote: string) {
        const len = s.length;
        let ret = '';
        for (let i = 0; i < len; ++i) {
            let c = s.charAt(i);
            if (c === '\\') {
                ++i;
                c = s.charAt(i);
                if (c === 'n') ret += "\n";
                else if (c === '\\') ret += "\\";
                else if (c === 't') ret += "\t";
                else if (c === 'r') ret += "\r";
                else if (c === 'b') ret += "\b";
                else if (c === 'f') ret += "\f";
                else if (c === 'v') ret += "\v";
                else if (c === '0') ret += "\0";
                else if (c === '"') ret += '"';
                else if (c === '\'') ret += '\'';
                else if (c === '\n') /* escaped newline, join lines */ {/* Do nothing */ }
                else if (c === 'x') {
                    const d0 = s.charAt(++i);
                    const d1 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16));
                }
                else if (c === 'u' || c === 'U') {
                    const d0 = s.charAt(++i);
                    const d1 = s.charAt(++i);
                    const d2 = s.charAt(++i);
                    const d3 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16), parseInt(d2 + d3, 16));
                }
                else {
                    // Leave it alone
                    ret += "\\" + c;
                }
            }
            else {
                ret += c;
            }
        }
        return ret;
    };

    let quote = s.charAt(0);
    let rawmode = false;

    if (quote === 'u' || quote === 'U') {
        s = s.substr(1);
        quote = s.charAt(0);
    }
    else if (quote === 'r' || quote === 'R') {
        s = s.substr(1);
        quote = s.charAt(0);
        rawmode = true;
    }
    assert(quote !== 'b' && quote !== 'B', "todo; haven't done b'' strings yet");

    assert(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
    s = s.substr(1, s.length - 2);

    if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote) {
        assert(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
        s = s.substr(2, s.length - 4);
    }

    if (rawmode || s.indexOf('\\') === -1) {
        return strobj(decodeUtf8(s));
    }
    return strobj(decodeEscape(s, quote));
}

/**
 *
 */
function parsestrplus(c: Compiling, n: PyNode): string {
    REQ(CHILD(n, 0), TOK.T_STRING);
    let ret = "";
    for (let i = 0; i < NCH(n); ++i) {
        const child = CHILD(n, i);
        try {
            ret = ret + parsestr(c, child.value);
        }
        catch (x) {
            throw syntaxError("invalid string (possibly contains a unicode character)", child.range);
        }
    }
    return ret;
}

function parsenumber(c: Compiling, s: string, range: Range): INumericLiteral {
    const endChar = s.charAt(s.length - 1);

    if (endChar === 'j' || endChar === 'J') {
        throw syntaxError("complex numbers are currently unsupported", range);
    }

    if (s.indexOf('.') !== -1) {
        return floatAST(s);
    }

    // Handle integers of various bases
    let tmp = s;
    let value: number;
    let radix = 10;
    let neg = false;
    if (s.charAt(0) === '-') {
        tmp = s.substr(1);
        neg = true;
    }

    if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'x' || tmp.charAt(1) === 'X')) {
        // Hex
        tmp = tmp.substring(2);
        value = parseInt(tmp, 16);
        radix = 16;
    }
    else if ((s.indexOf('e') !== -1) || (s.indexOf('E') !== -1)) {
        // Float with exponent (needed to make sure e/E wasn't hex first)
        return floatAST(s);
    }
    else if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'b' || tmp.charAt(1) === 'B')) {
        // Binary
        tmp = tmp.substring(2);
        value = parseInt(tmp, 2);
        radix = 2;
    }
    else if (tmp.charAt(0) === '0') {
        if (tmp === "0") {
            // Zero
            value = 0;
        }
        else {
            // Octal (Leading zero, but not actually zero)
            if (endChar === 'l' || endChar === 'L') {
                return longAST(s.substr(0, s.length - 1), 8);
            }
            else {
                radix = 8;
                tmp = tmp.substring(1);
                if ((tmp.charAt(0) === 'o') || (tmp.charAt(0) === 'O')) {
                    tmp = tmp.substring(1);
                }
                value = parseInt(tmp, 8);
            }
        }
    }
    else {
        // Decimal
        if (endChar === 'l' || endChar === 'L') {
            return longAST(s.substr(0, s.length - 1), radix);
        }
        else {
            value = parseInt(tmp, radix);
        }
    }

    // Convert to long
    if (value > LONG_THRESHOLD && Math.floor(value) === value && (s.indexOf('e') === -1 && s.indexOf('E') === -1)) {
        // TODO: Does radix zero make sense?
        return longAST(s, 0);
    }

    if (endChar === 'l' || endChar === 'L') {
        return longAST(s.substr(0, s.length - 1), radix);
    }
    else {
        if (neg) {
            return intAST(-value);
        }
        else {
            return intAST(value);
        }
    }
}

function astForSlice(c: Compiling, node: PyNode): Ellipsis | Index | Name | Slice {
    const n = node;
    REQ(n, SYM.subscript);
    let ch = CHILD(n, 0);
    let lower: Expression = null;
    let upper: Expression = null;
    let step: Expression = null;
    if (ch.type === TOK.T_DOT) {
        return new Ellipsis();
    }
    if (NCH(n) === 1 && ch.type === SYM.IfExpr) {
        return new Index(astForExpr(c, ch) as Tuple);
    }
    if (ch.type === SYM.IfExpr) {
        lower = astForExpr(c, ch);
    }
    if (ch.type === TOK.T_COLON) {
        if (NCH(n) > 1) {
            const n2 = CHILD(n, 1);
            if (n2.type === SYM.IfExpr)
                upper = astForExpr(c, n2);
        }
    }
    else if (NCH(n) > 2) {
        const n2 = CHILD(n, 2);
        if (n2.type === SYM.IfExpr) {
            upper = astForExpr(c, n2);
        }
    }

    ch = CHILD(n, NCH(n) - 1);
    if (ch.type === SYM.sliceop) {
        if (NCH(ch) === 1) {
            ch = CHILD(ch, 0);
            step = new Name(new RangeAnnotated("None", null), Load);
        }
        else {
            ch = CHILD(ch, 1);
            if (ch.type === SYM.IfExpr)
                step = astForExpr(c, ch);
        }
    }
    return new Slice(lower, upper, step);
}

function astForAtomExpr(c: Compiling, n: PyNode): Name | Expression {
    const c0 = CHILD(n, 0);
    switch (c0.type) {
        case TOK.T_NAME:
            // All names start in Load context, but may be changed later
            return new Name(new RangeAnnotated(c0.value, c0.range), Load);
        case TOK.T_STRING: {
            // FIXME: Owing to the way that Python allows string concatenation, this is imprecise.
            return new Str(new RangeAnnotated(parsestrplus(c, n), n.range));
        }
        case TOK.T_NUMBER: {
            return new Num(new RangeAnnotated(parsenumber(c, c0.value, c0.range), n.range));
        }
        case TOK.T_LPAR: { // various uses for parens
            const c1 = CHILD(n, 1);
            if (c1.type === TOK.T_RPAR) {
                return new Tuple([], Load, n.range);
            }
            if (c1.type === SYM.YieldExpr) {
                return astForExpr(c, c1) as Yield;
            }
            if (NCH(c1) > 1 && CHILD(c1, 1).type === SYM.gen_for) {
                return astForGenexp(c, c1);
            }
            return astForTestlistGexp(c, c1);
        }
        case TOK.T_LSQB: { // list or listcomp
            const c1 = CHILD(n, 1);
            if (c1.type === TOK.T_RSQB)
                return new List([], Load, n.range);
            REQ(c1, SYM.listmaker);
            if (NCH(c1) === 1 || CHILD(c1, 1).type === TOK.T_COMMA)
                return new List(seqForTestlist(c, c1), Load, n.range);
            else
                return astForListcomp(c, c1);
        }
        case TOK.T_LBRACE: {
            /* dictmaker: test ':' test (',' test ':' test)* [','] */
            const c1 = CHILD(n, 1);
            const N = NCH(c1);
            // var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
            const keys: Expression[] = [];
            const values: Expression[] = [];
            for (let i = 0; i < N; i += 4) {
                keys[i / 4] = astForExpr(c, CHILD(c1, i));
                values[i / 4] = astForExpr(c, CHILD(c1, i + 2));
            }
            return new Dict(keys, values, n.range);
        }
        case TOK.T_BACKQUOTE: {
            throw syntaxError("backquote not supported, use repr()", n.range);
        }
        default: {
            throw new Error(`unhandled atom '${grammarName(c0.type)}'`);
        }
    }
}

function astForPowerExpr(c: Compiling, node: PyNode): Expression {
    const n = node;
    REQ(n, SYM.PowerExpr);
    const N = NCH(n);
    const NminusOne = N - 1;
    let e: Expression = astForAtomExpr(c, CHILD(n, 0));
    if (N === 1) return e;
    for (let i = 1; i < N; ++i) {
        const ch = CHILD(n, i);
        if (ch.type !== SYM.trailer) {
            break;
        }
        e = astForTrailer(c, ch, e);
    }
    if (CHILD(n, NminusOne).type === SYM.UnaryExpr) {
        const f = astForExpr(c, CHILD(n, NminusOne));
        return new BinOp(e, { op: Pow, range: null }, f, n.range);
    }
    else {
        return e;
    }
}

function astForExpr(c: Compiling, n: PyNode): Expression {
    LOOP: while (true) {
        switch (n.type) {
            case SYM.IfExpr:
            case SYM.old_test:
                if (CHILD(n, 0).type === SYM.LambdaExpr || CHILD(n, 0).type === SYM.old_LambdaExpr)
                    return astForLambdef(c, CHILD(n, 0));
                else if (NCH(n) > 1)
                    return astForIfexpr(c, n);
            // fallthrough
            case SYM.OrExpr:
            case SYM.AndExpr:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                const seq: Expression[] = [];
                for (let i = 0; i < NCH(n); i += 2) {
                    seq[i / 2] = astForExpr(c, CHILD(n, i));
                }
                if (CHILD(n, 1).value === "and") {
                    return new BoolOp(And, seq, n.range);
                }
                assert(CHILD(n, 1).value === "or");
                return new BoolOp(Or, seq, n.range);
            case SYM.NotExpr:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    return new UnaryOp(Not, astForExpr(c, CHILD(n, 1)), n.range);
                }
            case SYM.ComparisonExpr:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    const ops = [];
                    const cmps = [];
                    for (let i = 1; i < NCH(n); i += 2) {
                        ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                        cmps[(i - 1) / 2] = astForExpr(c, CHILD(n, i + 1));
                    }
                    return new Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.range);
                }
            case SYM.ArithmeticExpr:
            case SYM.GeometricExpr:
            case SYM.ShiftExpr:
            case SYM.BitwiseOrExpr:
            case SYM.BitwiseXorExpr:
            case SYM.BitwiseAndExpr:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForBinop(c, n);
            case SYM.YieldExpr:
                let exp: Expression = null;
                if (NCH(n) === 2) {
                    exp = astForTestlist(c, CHILD(n, 1));
                }
                return new Yield(exp, n.range);
            case SYM.UnaryExpr:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForUnaryExpr(c, n);
            case SYM.PowerExpr:
                return astForPowerExpr(c, n);
            default: {
                throw new Error("unhandled expr"/*, "n.type: %d", n.type*/);
            }
        }
    }
}

function astForPrintStmt(c: Compiling, n: PyNode): Print {
    let start = 1;
    let dest: Expression = null;
    REQ(n, SYM.print_stmt);
    if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT) {
        dest = astForExpr(c, CHILD(n, 2));
        start = 4;
    }
    const seq: Expression[] = [];
    for (let i = start, j = 0; i < NCH(n); i += 2, ++j) {
        seq[j] = astForExpr(c, CHILD(n, i));
    }
    const nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
    return new Print(dest, seq, nl, n.range);
}

function astForStmt(c: Compiling, n: PyNode): Statement {
    if (n.type === SYM.stmt) {
        assert(NCH(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.simple_stmt) {
        assert(numStmts(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.small_stmt) {
        REQ(n, SYM.small_stmt);
        n = CHILD(n, 0);
        switch (n.type) {
            case SYM.ExprStmt: return astForExprStmt(c, n);
            case SYM.print_stmt: return astForPrintStmt(c, n);
            case SYM.del_stmt: return astForDelStmt(c, n);
            case SYM.pass_stmt: return new Pass(n.range);
            case SYM.flow_stmt: return astForFlowStmt(c, n);
            case SYM.import_stmt: return astForImportStmt(c, n);
            case SYM.GlobalStmt: return astForGlobalStmt(c, n);
            case SYM.NonLocalStmt: return astForNonLocalStmt(c, n);
            case SYM.exec_stmt: return astForExecStmt(c, n);
            case SYM.assert_stmt: return astForAssertStmt(c, n);
            default: {
                throw new Error("unhandled small_stmt");
            }
        }
    }
    else {
        const ch = CHILD(n, 0);
        REQ(n, SYM.compound_stmt);
        switch (ch.type) {
            case SYM.if_stmt: return astForIfStmt(c, ch);
            case SYM.while_stmt: return astForWhileStmt(c, ch);
            case SYM.for_stmt: return astForForStmt(c, ch);
            case SYM.try_stmt: return astForTryStmt(c, ch);
            case SYM.with_stmt: return astForWithStmt(c, ch);
            case SYM.funcdef: return astForFuncdef(c, ch, []);
            case SYM.classdef: return astForClassdef(c, ch, []);
            case SYM.decorated: return astForDecorated(c, ch);
            default: {
                throw new Error("unhandled compound_stmt");
            }
        }
    }
}

export function astFromExpression(n: PyNode): Expression {
    const c = new Compiling("utf-8");
    return astForExpr(c, n);
}

export function astFromParse(n: PyNode): Statement[] {
    const c = new Compiling("utf-8");

    const stmts: Statement[] = [];
    let k = 0;
    for (let i = 0; i < NCH(n) - 1; ++i) {
        let ch = CHILD(n, i);
        if (n.type === TOK.T_NEWLINE)
            continue;
        REQ(ch, SYM.stmt);
        const num = numStmts(ch);
        if (num === 1) {
            stmts[k++] = astForStmt(c, ch);
        }
        else {
            ch = CHILD(ch, 0);
            REQ(ch, SYM.simple_stmt);
            for (let j = 0; j < num; ++j) {
                stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
            }
        }
    }
    return stmts;
    /*
    switch (n.type) {
        case SYM.file_input:
        case SYM.eval_input: {
            throw new Error("todo;");
        }
        case SYM.single_input: {
            throw new Error("todo;");
        }
        default: {
            throw new Error("todo;");
        }
    }
    */
}

export function astDump(node: Expression | Statement): string {
    const _format = function (node: Expression | Statement | boolean | any[]): string {
        if (node === null) {
            return "None";
        }
        else if (node['prototype'] && node['prototype']._astname !== undefined && node['prototype']._isenum) {
            // TODO: Replace the _isenum classes with real TypeScript enum.
            // TODO: Why do we have the parens?
            return node['prototype']._astname + "()";
        }
        else if (node['_astname'] !== undefined) {
            const fields = [];
            for (let i = 0; i < node['_fields'].length; i += 2) {
                const a = node['_fields'][i]; // field name
                const b = node['_fields'][i + 1](node); // field getter func
                fields.push([a, _format(b)]);
            }
            const attrs: string[] = [];
            for (let i = 0; i < fields.length; ++i) {
                const field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
            }
            const fieldstr = attrs.join(',');
            return node['_astname'] + "(" + fieldstr + ")";
        }
        else if (Array.isArray(node)) {
            const elems = [];
            for (let i = 0; i < node.length; ++i) {
                const x = node[i];
                elems.push(_format(x));
            }
            const elemsstr = elems.join(',');
            return "[" + elemsstr.replace(/^\s+/, '') + "]";
        }
        else {
            let ret: string;
            if (node === true) ret = "True";
            else if (node === false) ret = "False";
            else ret = "" + node;
            return ret;
        }
    };

    return _format(node);
}
