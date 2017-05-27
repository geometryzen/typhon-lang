import { assert } from './asserts';
import { NCH, CHILD } from './tree';

import { Add } from './types';
// TODO: Conventions
import { Alias } from './types';
import { Arguments } from './types';
import { And } from './types';
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
import { Name } from './types';
import { NonLocal } from './types';
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

import { isArrayLike, isNumber, isString } from './base';
import { ParseTables } from './tables';
import { Tokens as TOK } from './Tokens';
import { floatAST, intAST, longAST } from './numericLiteral';
import { INumericLiteral } from './INumericLiteral';
import { PyNode } from './parser';

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
 * @param message
 * @param lineNumber
 */
function syntaxError(message: string, lineNumber?: number): SyntaxError {
    assert(isString(message), "message must be a string");
    assert(isNumber(lineNumber), "lineNumber must be a number");
    const e = new SyntaxError(message/*, fileName*/);
    e['lineNumber'] = lineNumber;
    return e;
}

class Compiling {
    c_encoding: string;
    constructor(encoding: 'utf-8') {
        this.c_encoding = encoding;
    }
}

function REQ(n: PyNode, type: TOK): void {
    assert(n.type === type, "node wasn't expected type");
}

function strobj(s: string): string {
    assert(typeof s === "string", "expecting string, got " + (typeof s));
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

function forbiddenCheck(c: Compiling, n: PyNode, x?: string, lineno?: number): void {
    if (x === "None") throw syntaxError("assignment to None", lineno);
    if (x === "True" || x === "False") throw syntaxError("assignment to True or False is forbidden", lineno);
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
        if (ctx === Store) forbiddenCheck(c, n, e.attr, n.lineno);
        e.ctx = ctx;
    }
    else if (e instanceof Name) {
        if (ctx === Store) forbiddenCheck(c, n, /*e.attr*/void 0, n.lineno);
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
            throw syntaxError("can't assign to ()", n.lineno);
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
        throw syntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName, n.lineno);
    }

    if (s) {
        for (let i = 0; i < s.length; ++i) {
            setContext(c, s[i], ctx, n);
        }
    }
}

const operatorMap: { [token: number]: Operator } = {};
(function () {
    operatorMap[TOK.T_VBAR] = BitOr;
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

function getOperator(n: PyNode): Operator {
    assert(operatorMap[n.type] !== undefined);
    return operatorMap[n.type];
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
    if (NCH(exc) === 1)
        return new ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 2)
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 4) {
        const e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
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
        throw syntaxError("malformed 'try' statement", n.lineno);
    }

    if (nexcept > 0) {
        const handlers: ExceptHandler[] = [];
        for (let i = 0; i < nexcept; ++i)
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        const exceptSt = new TryExcept(body, handlers, orelse, n.lineno, n.col_offset);

        if (!finally_)
            return exceptSt;

        /* if a 'finally' is present too, we nest the TryExcept within a
            TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }

    assert(finally_ !== null);
    return new TryFinally(body, finally_ as Statement[], n.lineno, n.col_offset);
}


function astForDottedName(c: Compiling, n: PyNode): Attribute | Name {
    REQ(n, SYM.dotted_name);
    const lineno = n.lineno;
    const col_offset = n.col_offset;
    let id = strobj(CHILD(n, 0).value as string);
    let e: Attribute | Name = new Name(id, Load, lineno, col_offset);
    for (let i = 2; i < NCH(n); i += 2) {
        id = strobj(CHILD(n, i).value as string);
        e = new Attribute(e, id, Load, lineno, col_offset);
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
        return new Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
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
        thing.lineno = n.lineno;
        thing.col_offset = n.col_offset;
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
    return new WithStatement(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
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
    return new Exec(expr1, globals, locals, n.lineno, n.col_offset);
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
            [], n.lineno, n.col_offset);

    const s = CHILD(n, 4).value;
    const decider = s.charAt(2); // elSe or elIf
    if (decider === 's') {
        return new IfStatement(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            astForSuite(c, CHILD(n, 6)),
            n.lineno, n.col_offset);
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
                    CHILD(n, NCH(n) - 6).lineno,
                    CHILD(n, NCH(n) - 6).col_offset)];
            nElif--;
        }

        for (let i = 0; i < nElif; ++i) {
            const off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new IfStatement(
                    astForExpr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
                    orelse,
                    CHILD(n, off).lineno,
                    CHILD(n, off).col_offset)];
        }
        return new IfStatement(
            astForExpr(c, CHILD(n, 1)),
            astForSuite(c, CHILD(n, 3)),
            orelse, n.lineno, n.col_offset);
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
    return new DeleteStatement(astForExprlist(c, CHILD(n, 1), Del), n.lineno, n.col_offset);
}

function astForGlobalStmt(c: Compiling, n: PyNode): Global {
    REQ(n, SYM.GlobalStmt);
    const s: string[] = [];
    for (let i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.lineno, n.col_offset);
}

function astForNonLocalStmt(c: Compiling, n: PyNode): NonLocal {
    REQ(n, SYM.NonLocalStmt);
    const s: string[] = [];
    for (let i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new NonLocal(s, n.lineno, n.col_offset);
}

function astForAssertStmt(c: Compiling, n: PyNode): Assert {
    /* assert_stmt: 'assert' test [',' test] */
    REQ(n, SYM.assert_stmt);
    if (NCH(n) === 2) {
        return new Assert(astForExpr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
    }
    else if (NCH(n) === 4) {
        return new Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.lineno, n.col_offset);
    }
    throw new Error("improper number of parts to assert stmt");
}

function aliasForImportName(c: Compiling, n: PyNode): Alias {
    /*
        import_as_name: NAME ['as' NAME]
        dotted_as_name: dotted_name ['as' NAME]
        dotted_name: NAME ('.' NAME)*
    */

    loop: while (true) {
        switch (n.type) {
            case SYM.import_as_name:
                let str: string = null;
                const name = strobj(CHILD(n, 0).value);
                if (NCH(n) === 3)
                    str = CHILD(n, 2).value;
                return new Alias(name, str == null ? null : strobj(str));
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
                if (NCH(n) === 1)
                    return new Alias(strobj(CHILD(n, 0).value), null);
                else {
                    // create a string of the form a.b.c
                    let str = '';
                    for (let i = 0; i < NCH(n); i += 2)
                        str += CHILD(n, i).value + ".";
                    return new Alias(strobj(str.substr(0, str.length - 1)), null);
                }
            case TOK.T_STAR:
                return new Alias(strobj("*"), null);
            default:
                throw syntaxError("unexpected import name", n.lineno);
        }
    }
}

function astForImportStmt(c: Compiling, n: PyNode): ImportStatement | ImportFrom {
    REQ(n, SYM.import_stmt);
    let lineno = n.lineno;
    const col_offset = n.col_offset;
    n = CHILD(n, 0);
    if (n.type === SYM.import_name) {
        n = CHILD(n, 1);
        REQ(n, SYM.dotted_as_names);
        const aliases = [];
        for (let i = 0; i < NCH(n); i += 2)
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        return new ImportStatement(aliases, lineno, col_offset);
    }
    else if (n.type === SYM.import_from) {
        let mod: Alias = null;
        let ndots = 0;
        let nchildren: number;
        let idx: number;
        for (idx = 1; idx < NCH(n); ++idx) {
            if (CHILD(n, idx).type === SYM.dotted_name) {
                mod = aliasForImportName(c, CHILD(n, idx));
                idx++;
                break;
            }
            else if (CHILD(n, idx).type !== TOK.T_DOT)
                break;
            ndots++;
        }
        ++idx; // skip the import keyword
        switch (CHILD(n, idx).type) {
            case TOK.T_STAR:
                // from ... import
                n = CHILD(n, idx);
                nchildren = 1;
                break;
            case TOK.T_LPAR:
                // from ... import (x, y, z)
                n = CHILD(n, idx + 1);
                nchildren = NCH(n);
                break;
            case SYM.import_as_names:
                // from ... import x, y, z
                n = CHILD(n, idx);
                nchildren = NCH(n);
                if (nchildren % 2 === 0)
                    throw syntaxError("trailing comma not allowed without surrounding parentheses", n.lineno);
        }
        const aliases = [];
        if (n.type === TOK.T_STAR)
            aliases[0] = aliasForImportName(c, n);
        else
            for (let i = 0; i < NCH(n); i += 2) {
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            }
        const modname = mod ? mod.name : "";
        return new ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
    }
    throw syntaxError("unknown import statement", n.lineno);
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
            lc = new Comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);

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
    return new ListComp(elt, listcomps, n.lineno, n.col_offset);
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
        case TOK.T_PLUS: return new UnaryOp(UAdd, expression, n.lineno, n.col_offset);
        case TOK.T_MINUS: return new UnaryOp(USub, expression, n.lineno, n.col_offset);
        case TOK.T_TILDE: return new UnaryOp(Invert, expression, n.lineno, n.col_offset);
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
        target = new Tuple(_target, Store, n.lineno, n.col_offset);

    return new ForStatement(target,
        astForTestlist(c, CHILD(n, 3)),
        astForSuite(c, CHILD(n, 5)),
        seq, n.lineno, n.col_offset);
}

function astForCall(c: Compiling, n: PyNode, func: Attribute | Name): Call {
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
        throw syntaxError("Generator expression must be parenthesized if not sole argument", n.lineno);
    if (nargs + nkeywords + ngens > 255)
        throw syntaxError("more than 255 arguments", n.lineno);
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
                if (nkeywords) throw syntaxError("non-keyword arg after keyword arg", n.lineno);
                if (vararg) throw syntaxError("only named arguments may follow *expression", n.lineno);
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else {
                const e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) throw syntaxError("lambda cannot contain assignment", n.lineno);
                else if (e.constructor !== Name) throw syntaxError("keyword can't be an expression", n.lineno);
                const key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key, n.lineno);
                for (let k = 0; k < nkeywords; ++k) {
                    const tmp = keywords[k].arg;
                    if (tmp === key) throw syntaxError("keyword argument repeated", n.lineno);
                }
                keywords[nkeywords++] = new Keyword(key, astForExpr(c, CHILD(ch, 2)));
            }
        }
        else if (ch.type === TOK.T_STAR)
            vararg = astForExpr(c, CHILD(n, ++i));
        else if (ch.type === TOK.T_DOUBLESTAR)
            kwarg = astForExpr(c, CHILD(n, ++i));
    }
    return new Call(func, args, keywords, vararg, kwarg, func.lineno, func.col_offset);
}

function astForTrailer(c: Compiling, n: PyNode, leftExpr: Attribute | Name): Attribute | Call | Subscript {
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
        subscriptlist: subscript (',' subscript)* [',']
        subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
        */
    REQ(n, SYM.trailer);
    if (CHILD(n, 0).type === TOK.T_LPAR) {
        if (NCH(n) === 2)
            return new Call(leftExpr, [], [], null, null, n.lineno, n.col_offset);
        else
            return astForCall(c, CHILD(n, 1), leftExpr);
    }
    else if (CHILD(n, 0).type === TOK.T_DOT)
        return new Attribute(leftExpr, strobj(CHILD(n, 1).value), Load, n.lineno, n.col_offset);
    else {
        REQ(CHILD(n, 0), TOK.T_LSQB);
        REQ(CHILD(n, 2), TOK.T_RSQB);
        n = CHILD(n, 1);
        if (NCH(n) === 1)
            return new Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), Load, n.lineno, n.col_offset);
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
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n.lineno, n.col_offset);
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
            const e = new Tuple(elts, Load, n.lineno, n.col_offset);
            return new Subscript(leftExpr, new Index(e), Load, n.lineno, n.col_offset);
        }
    }
}

function astForFlowStmt(c: Compiling, n: PyNode): BreakStatement | ExpressionStatement | Raise {
    REQ(n, SYM.flow_stmt);
    const ch = CHILD(n, 0);
    switch (ch.type) {
        case SYM.break_stmt: return new BreakStatement(n.lineno, n.col_offset);
        case SYM.continue_stmt: return new ContinueStatement(n.lineno, n.col_offset);
        case SYM.yield_stmt:
            return new ExpressionStatement(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
        case SYM.return_stmt:
            if (NCH(ch) === 1)
                return new ReturnStatement(null, n.lineno, n.col_offset);
            else
                return new ReturnStatement(astForTestlist(c, CHILD(ch, 1)), n.lineno, n.col_offset);
        case SYM.raise_stmt: {
            if (NCH(ch) === 1)
                return new Raise(null, null, null, n.lineno, n.col_offset);
            else if (NCH(ch) === 2)
                return new Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.lineno, n.col_offset);
            else if (NCH(ch) === 4)
                return new Raise(
                    astForExpr(c, CHILD(ch, 1)),
                    astForExpr(c, CHILD(ch, 3)),
                    null, n.lineno, n.col_offset);
            else if (NCH(ch) === 6)
                return new Raise(
                    astForExpr(c, CHILD(ch, 1)),
                    astForExpr(c, CHILD(ch, 3)),
                    astForExpr(c, CHILD(ch, 5)),
                    n.lineno, n.col_offset);
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
        n = CHILD(n, 1);
    }
    REQ(n, SYM.varargslist);

    const args: Name[] = [];
    const defaults: Expression[] = [];

    /* fpdef: NAME | '(' fplist ')'
        fplist: fpdef (',' fpdef)* [',']
    */
    let foundDefault = false;
    let i = 0;
    let j = 0; // index for defaults
    let k = 0; // index for args
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
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
                            throw syntaxError("parenthesized arg with default", n.lineno);
                        throw syntaxError("non-default argument follows default argument", n.lineno);
                    }

                    if (NCH(ch) === 3) {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1) {
                            throw syntaxError("tuple parameter unpacking has been removed", n.lineno);
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
                    if (CHILD(ch, 0).type === TOK.T_NAME) {
                        forbiddenCheck(c, n, CHILD(ch, 0).value, n.lineno);
                        const id = strobj(CHILD(ch, 0).value);
                        args[k++] = new Name(id, Param, ch.lineno, ch.col_offset);
                    }
                    i += 2;
                    if (parenthesized)
                        throw syntaxError("parenthesized argument names are invalid", n.lineno);
                    break;
                }
                break;
            case TOK.T_STAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                vararg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            case TOK.T_DOUBLESTAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
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
    /* funcdef: 'def' NAME parameters ':' suite */
    REQ(n, SYM.funcdef);
    const name = strobj(CHILD(n, 1).value);
    forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value, n.lineno);
    const args = astForArguments(c, CHILD(n, 2));
    const body = astForSuite(c, CHILD(n, 4));
    return new FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
}

function astForClassBases(c: Compiling, n: PyNode): Expression[] {
    assert(NCH(n) > 0);
    REQ(n, SYM.testlist);
    if (NCH(n) === 1) {
        return [astForExpr(c, CHILD(n, 0))];
    }
    return seqForTestlist(c, n);
}

function astForClassdef(c: Compiling, n: PyNode, decoratorSeq: (Attribute | Call | Name)[]) {
    REQ(n, SYM.classdef);
    forbiddenCheck(c, n, CHILD(n, 1).value, n.lineno);
    const classname = strobj(CHILD(n, 1).value);
    if (NCH(n) === 4)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
    if (CHILD(n, 3).type === TOK.T_RPAR)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);

    const bases = astForClassBases(c, CHILD(n, 3));
    const s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
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
    return new Lambda(args, expression, n.lineno, n.col_offset);
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
            ge = new Comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);
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
    return new GeneratorExp(elt, genexps, n.lineno, n.col_offset);
}

function astForWhileStmt(c: Compiling, n: PyNode): WhileStatement {
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    else if (NCH(n) === 7)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
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
    let result = new BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.lineno, n.col_offset);
    const nops = (NCH(n) - 1) / 2;
    for (let i = 1; i < nops; ++i) {
        const nextOper = CHILD(n, i * 2 + 1);
        const newoperator = getOperator(nextOper);
        const tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
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
        return new Tuple(seqForTestlist(c, n), Load, n.lineno, n.col_offset);
    }

}

function astForExprStmt(c: Compiling, n: PyNode): ExpressionStatement {
    REQ(n, SYM.ExprStmt);
    if (NCH(n) === 1)
        return new ExpressionStatement(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
    else if (CHILD(n, 1).type === SYM.augassign) {
        let ch = CHILD(n, 0);
        const expr1 = astForTestlist(c, ch);
        switch (expr1.constructor) {
            case GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", n.lineno);
            case Yield: throw syntaxError("augmented assignment to yield expression not possible", n.lineno);
            case Name:
                const varName = expr1.id;
                forbiddenCheck(c, ch, varName, n.lineno);
                break;
            case Attribute:
            case Subscript:
                break;
            default:
                throw syntaxError("illegal expression for augmented assignment", n.lineno);
        }
        setContext(c, expr1, Store, ch);

        ch = CHILD(n, 2);
        let expr2: Expression;
        if (ch.type === SYM.testlist)
            expr2 = astForTestlist(c, ch);
        else
            expr2 = astForExpr(c, ch);

        return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
    }
    else {
        // normal assignment
        REQ(CHILD(n, 1), TOK.T_EQUAL);
        const targets = [];
        for (let i = 0; i < NCH(n) - 2; i += 2) {
            const ch = CHILD(n, i);
            if (ch.type === SYM.YieldExpr) throw syntaxError("assignment to yield expression not possible", n.lineno);
            const e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        const value = CHILD(n, NCH(n) - 1);
        let expression: Expression;
        if (value.type === SYM.testlist)
            expression = astForTestlist(c, value);
        else
            expression = astForExpr(c, value);
        return new Assign(targets, expression, n.lineno, n.col_offset);
    }
}

function astForIfexpr(c: Compiling, n: PyNode): IfExp {
    assert(NCH(n) === 5);
    return new IfExp(
        astForExpr(c, CHILD(n, 2)),
        astForExpr(c, CHILD(n, 0)),
        astForExpr(c, CHILD(n, 4)),
        n.lineno, n.col_offset);
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
 * @return {string}
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
            throw syntaxError("invalid string (possibly contains a unicode character)", child.lineno);
        }
    }
    return ret;
}

function parsenumber(c: Compiling, s: string, lineno: number): INumericLiteral {
    const end = s.charAt(s.length - 1);

    if (end === 'j' || end === 'J') {
        throw syntaxError("complex numbers are currently unsupported", lineno);
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
            if (end === 'l' || end === 'L') {
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
        if (end === 'l' || end === 'L') {
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

    if (end === 'l' || end === 'L') {
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

function astForSlice(c: Compiling, n: PyNode): Ellipsis | Index | Name | Slice {
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
    if (ch.type === SYM.IfExpr)
        lower = astForExpr(c, ch);
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
            step = new Name(strobj("None"), Load, ch.lineno, ch.col_offset);
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
    let ch = CHILD(n, 0);
    switch (ch.type) {
        case TOK.T_NAME:
            // All names start in Load context, but may be changed later
            return new Name(strobj(ch.value), Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
            return new Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
        case TOK.T_LPAR: // various uses for parens
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RPAR) {
                return new Tuple([], Load, n.lineno, n.col_offset);
            }
            if (ch.type === SYM.YieldExpr) {
                return astForExpr(c, ch) as Yield;
            }
            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for) {
                return astForGenexp(c, ch);
            }
            return astForTestlistGexp(c, ch);
        case TOK.T_LSQB: // list or listcomp
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RSQB)
                return new List([], Load, n.lineno, n.col_offset);
            REQ(ch, SYM.listmaker);
            if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                return new List(seqForTestlist(c, ch), Load, n.lineno, n.col_offset);
            else
                return astForListcomp(c, ch);
        case TOK.T_LBRACE:
            /* dictmaker: test ':' test (',' test ':' test)* [','] */
            ch = CHILD(n, 1);
            // var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
            const keys: Expression[] = [];
            const values: Expression[] = [];
            for (let i = 0; i < NCH(ch); i += 4) {
                keys[i / 4] = astForExpr(c, CHILD(ch, i));
                values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
            }
            return new Dict(keys, values, n.lineno, n.col_offset);
        case TOK.T_BACKQUOTE:
            throw syntaxError("backquote not supported, use repr()", n.lineno);
        default: {
            throw new Error("unhandled atom"/*, ch.type*/);
        }
    }
}

function astForPowerExpr(c: Compiling, n: PyNode): Name | Expression {
    REQ(n, SYM.PowerExpr);
    let e: Name | Expression = astForAtomExpr(c, CHILD(n, 0));
    if (NCH(n) === 1) return e;
    for (let i = 1; i < NCH(n); ++i) {
        const ch = CHILD(n, i);
        if (ch.type !== SYM.trailer) {
            break;
        }
        const tmp = astForTrailer(c, ch, e as Attribute);
        tmp.lineno = e.lineno;
        tmp.col_offset = e.col_offset;
        e = tmp;
    }
    if (CHILD(n, NCH(n) - 1).type === SYM.UnaryExpr) {
        const f = astForExpr(c, CHILD(n, NCH(n) - 1));
        return new BinOp(e, Pow, f, n.lineno, n.col_offset);
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
                    return new BoolOp(And, seq, n.lineno, n.col_offset);
                }
                assert(CHILD(n, 1).value === "or");
                return new BoolOp(Or, seq, n.lineno, n.col_offset);
            case SYM.NotExpr:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else {
                    return new UnaryOp(Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
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
                    return new Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
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
                return new Yield(exp, n.lineno, n.col_offset);
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
    return new Print(dest, seq, nl, n.lineno, n.col_offset);
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
            case SYM.pass_stmt: return new Pass(n.lineno, n.col_offset);
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

export function astDump(node: {}): string {
    const _format = function (node: any): string {
        if (node === null) {
            return "None";
        }
        else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum) {
            return node.prototype._astname + "()";
        }
        else if (node._astname !== undefined) {
            const fields = [];
            for (let i = 0; i < node._fields.length; i += 2) {
                const a = node._fields[i]; // field name
                const b = node._fields[i + 1](node); // field getter func
                fields.push([a, _format(b)]);
            }
            const attrs: string[] = [];
            for (let i = 0; i < fields.length; ++i) {
                const field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
            }
            const fieldstr = attrs.join(',');
            return node._astname + "(" + fieldstr + ")";
        }
        else if (isArrayLike(node)) {
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
            //          else if (Sk.ffi.isLong(node)) ret = Sk.ffi.remapToJs(node.tp$str());
            //          else if (Sk.builtin.isStringPy(node)) ret = Sk.builtin.stringToJs(node.tp$repr());
            else ret = "" + node;
            return ret;
        }
    };

    return _format(node);
}
