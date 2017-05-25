import { assert } from './asserts';
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
import { DeleteExpression } from './types';
import { Dict } from './types';
import { Div } from './types';
import { Ellipsis } from './types';
import { Eq } from './types';
import { ExceptHandler } from './types';
import { Exec } from './types';
import { Expr } from './types';
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
import { Module } from './types';
import { Mult } from './types';
import { Name } from './types';
import { NonLocal } from './types';
import { Not } from './types';
import { NotEq } from './types';
import { NotIn } from './types';
import { Num } from './types';
import { Or } from './types';
import { Param } from './types';
import { Pass } from './types';
import { Pow } from './types';
import { Print } from './types';
import { Raise } from './types';
import { ReturnStatement } from './types';
import { RShift } from './types';
import { Slice } from './types';
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
import { Tokens } from './Tokens';
import { floatAST, intAST, longAST } from './numericLiteral';
//
// This is pretty much a straight port of ast.c from CPython 2.6.5.
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//
var SYM = ParseTables.sym;
var TOK = Tokens;
/**
 * @const
 * @type {number}
 */
var LONG_THRESHOLD = Math.pow(2, 53);
/**
 * @param {string} message
 * @param {string} fileName
 * @param {number} lineNumber
 */
function syntaxError(message, fileName, lineNumber) {
    assert(isString(message), "message must be a string");
    assert(isString(fileName), "fileName must be a string");
    assert(isNumber(lineNumber), "lineNumber must be a number");
    var e = new SyntaxError(message /*, fileName*/);
    e['fileName'] = fileName;
    e['lineNumber'] = lineNumber;
    return e;
}
var Compiling = (function () {
    function Compiling(encoding, filename) {
        this.c_encoding = encoding;
        this.c_filename = filename;
    }
    return Compiling;
}());
function NCH(n) {
    assert(n !== undefined);
    if (n.children === null)
        return 0;
    return n.children.length;
}
function CHILD(n, i) {
    assert(n !== undefined);
    assert(i !== undefined);
    return n.children[i];
}
function REQ(n, type) {
    assert(n.type === type, "node wasn't expected type");
}
function strobj(s) {
    assert(typeof s === "string", "expecting string, got " + (typeof s));
    // This previuosly constructed the runtime representation.
    // That may have had an string intern side effect?
    return s;
}
function numStmts(n) {
    switch (n.type) {
        case SYM.single_input:
            if (CHILD(n, 0).type === TOK.T_NEWLINE)
                return 0;
            else
                return numStmts(CHILD(n, 0));
        case SYM.file_input:
            var cnt = 0;
            for (var i = 0; i < NCH(n); ++i) {
                var ch = CHILD(n, i);
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
                var cnt_1 = 0;
                for (var i = 2; i < NCH(n) - 1; ++i) {
                    cnt_1 += numStmts(CHILD(n, i));
                }
                return cnt_1;
            }
        default: {
            throw new Error("Non-statement found");
        }
    }
}
function forbiddenCheck(c, n, x, lineno) {
    if (x === "None")
        throw syntaxError("assignment to None", c.c_filename, lineno);
    if (x === "True" || x === "False")
        throw syntaxError("assignment to True or False is forbidden", c.c_filename, lineno);
}
/**
 * Set the context ctx for e, recursively traversing e.
 *
 * Only sets context for expr kinds that can appear in assignment context as
 * per the asdl file.
 */
function setContext(c, e, ctx, n) {
    assert(ctx !== AugStore && ctx !== AugLoad);
    var s = null;
    var exprName = null;
    switch (e.constructor) {
        case Attribute:
        case Name:
            if (ctx === Store)
                forbiddenCheck(c, n, e.attr, n.lineno);
            e.ctx = ctx;
            break;
        case Subscript:
            e.ctx = ctx;
            break;
        case List:
            e.ctx = ctx;
            s = e.elts;
            break;
        case Tuple:
            if (e.elts.length === 0)
                throw syntaxError("can't assign to ()", c.c_filename, n.lineno);
            e.ctx = ctx;
            s = e.elts;
            break;
        case Lambda:
            exprName = "lambda";
            break;
        case Call:
            exprName = "function call";
            break;
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
    if (exprName) {
        throw syntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName, c.c_filename, n.lineno);
    }
    if (s) {
        for (var i = 0; i < s.length; ++i) {
            setContext(c, s[i], ctx, n);
        }
    }
}
var operatorMap = {};
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
function getOperator(n) {
    assert(operatorMap[n.type] !== undefined);
    return operatorMap[n.type];
}
function astForCompOp(c, n) {
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
                if (n.value === "in")
                    return In;
                if (n.value === "is")
                    return Is;
        }
    }
    else if (NCH(n) === 2) {
        if (CHILD(n, 0).type === TOK.T_NAME) {
            if (CHILD(n, 1).value === "in")
                return NotIn;
            if (CHILD(n, 0).value === "is")
                return IsNot;
        }
    }
    throw new Error("invalid comp_op");
}
function seqForTestlist(c, n) {
    /* testlist: test (',' test)* [','] */
    assert(n.type === SYM.testlist ||
        n.type === SYM.listmaker ||
        n.type === SYM.testlist_gexp ||
        n.type === SYM.testlist_safe ||
        n.type === SYM.testlist1);
    var seq = [];
    for (var i = 0; i < NCH(n); i += 2) {
        assert(CHILD(n, i).type === SYM.IfExpr || CHILD(n, i).type === SYM.old_test);
        seq[i / 2] = astForExpr(c, CHILD(n, i));
    }
    return seq;
}
function astForSuite(c, n) {
    /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
    REQ(n, SYM.suite);
    var seq = [];
    var pos = 0;
    var ch;
    if (CHILD(n, 0).type === SYM.simple_stmt) {
        n = CHILD(n, 0);
        /* simple_stmt always ends with an NEWLINE and may have a trailing
            * SEMI. */
        var end = NCH(n) - 1;
        if (CHILD(n, end - 1).type === TOK.T_SEMI) {
            end -= 1;
        }
        // by 2 to skip
        for (var i = 0; i < end; i += 2) {
            seq[pos++] = astForStmt(c, CHILD(n, i));
        }
    }
    else {
        for (var i = 2; i < NCH(n) - 1; ++i) {
            ch = CHILD(n, i);
            REQ(ch, SYM.stmt);
            var num = numStmts(ch);
            if (num === 1) {
                // small_stmt or compound_stmt w/ only 1 child
                seq[pos++] = astForStmt(c, ch);
            }
            else {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (var j = 0; j < NCH(ch); j += 2) {
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
function astForExceptClause(c, exc, body) {
    /* except_clause: 'except' [test [(',' | 'as') test]] */
    REQ(exc, SYM.except_clause);
    REQ(body, SYM.suite);
    if (NCH(exc) === 1)
        return new ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 2)
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 4) {
        var e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    else {
        throw new Error("wrong number of children for except clause");
    }
}
function astForTryStmt(c, n) {
    var nc = NCH(n);
    var nexcept = (nc - 3) / 3;
    var body, orelse = [], finally_ = null;
    REQ(n, SYM.try_stmt);
    body = astForSuite(c, CHILD(n, 2));
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
        throw syntaxError("malformed 'try' statement", c.c_filename, n.lineno);
    }
    if (nexcept > 0) {
        var handlers = [];
        for (var i = 0; i < nexcept; ++i)
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        var exceptSt = new TryExcept(body, handlers, orelse, n.lineno, n.col_offset);
        if (!finally_)
            return exceptSt;
        /* if a 'finally' is present too, we nest the TryExcept within a
            TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }
    assert(finally_ !== null);
    return new TryFinally(body, finally_, n.lineno, n.col_offset);
}
function astForDottedName(c, n) {
    REQ(n, SYM.dotted_name);
    var lineno = n.lineno;
    var col_offset = n.col_offset;
    var id = strobj(CHILD(n, 0).value);
    var e = new Name(id, Load, lineno, col_offset);
    for (var i = 2; i < NCH(n); i += 2) {
        id = strobj(CHILD(n, i).value);
        e = new Attribute(e, id, Load, lineno, col_offset);
    }
    return e;
}
function astForDecorator(c, n) {
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    var nameExpr = astForDottedName(c, CHILD(n, 1));
    if (NCH(n) === 3)
        return nameExpr;
    else if (NCH(n) === 5)
        return new Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
    else
        return astForCall(c, CHILD(n, 3), nameExpr);
}
function astForDecorators(c, n) {
    REQ(n, SYM.decorators);
    var decoratorSeq = [];
    for (var i = 0; i < NCH(n); ++i)
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    return decoratorSeq;
}
function astForDecorated(c, n) {
    REQ(n, SYM.decorated);
    var decoratorSeq = astForDecorators(c, CHILD(n, 0));
    assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);
    var thing = null;
    if (CHILD(n, 1).type === SYM.funcdef)
        thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
    else if (CHILD(n, 1) === SYM.classdef)
        thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
    if (thing) {
        thing.lineno = n.lineno;
        thing.col_offset = n.col_offset;
    }
    return thing;
}
function astForWithVar(c, n) {
    REQ(n, SYM.with_var);
    return astForExpr(c, CHILD(n, 1));
}
function astForWithStmt(c, n) {
    /* with_stmt: 'with' test [ with_var ] ':' suite */
    var suiteIndex = 3; // skip with, test, :
    assert(n.type === SYM.with_stmt);
    var contextExpr = astForExpr(c, CHILD(n, 1));
    if (CHILD(n, 2).type === SYM.with_var) {
        var optionalVars = astForWithVar(c, CHILD(n, 2));
        setContext(c, optionalVars, Store, n);
        suiteIndex = 4;
    }
    return new WithStatement(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
}
function astForExecStmt(c, n) {
    var globals = null, locals = null;
    var nchildren = NCH(n);
    assert(nchildren === 2 || nchildren === 4 || nchildren === 6);
    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    var expr1 = astForExpr(c, CHILD(n, 1));
    if (nchildren >= 4)
        globals = astForExpr(c, CHILD(n, 3));
    if (nchildren === 6)
        locals = astForExpr(c, CHILD(n, 5));
    return new Exec(expr1, globals, locals, n.lineno, n.col_offset);
}
function astForIfStmt(c, n) {
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
        ['else' ':' suite]
    */
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4)
        return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    var s = CHILD(n, 4).value;
    var decider = s.charAt(2); // elSe or elIf
    if (decider === 's') {
        return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
    }
    else if (decider === 'i') {
        var nElif = NCH(n) - 4;
        var hasElse = false;
        var orelse = [];
        /* must reference the child nElif+1 since 'else' token is third, not
            * fourth child from the end. */
        if (CHILD(n, nElif + 1).type === TOK.T_NAME && CHILD(n, nElif + 1).value.charAt(2) === 's') {
            hasElse = true;
            nElif -= 3;
        }
        nElif /= 4;
        if (hasElse) {
            orelse = [
                new IfStatement(astForExpr(c, CHILD(n, NCH(n) - 6)), astForSuite(c, CHILD(n, NCH(n) - 4)), astForSuite(c, CHILD(n, NCH(n) - 1)), CHILD(n, NCH(n) - 6).lineno, CHILD(n, NCH(n) - 6).col_offset)
            ];
            nElif--;
        }
        for (var i = 0; i < nElif; ++i) {
            var off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new IfStatement(astForExpr(c, CHILD(n, off)), astForSuite(c, CHILD(n, off + 2)), orelse, CHILD(n, off).lineno, CHILD(n, off).col_offset)
            ];
        }
        return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), orelse, n.lineno, n.col_offset);
    }
    throw new Error("unexpected token in 'if' statement");
}
function astForExprlist(c, n, context) {
    REQ(n, SYM.ExprList);
    var seq = [];
    for (var i = 0; i < NCH(n); i += 2) {
        var e = astForExpr(c, CHILD(n, i));
        seq[i / 2] = e;
        if (context)
            setContext(c, e, context, CHILD(n, i));
    }
    return seq;
}
function astForDelStmt(c, n) {
    REQ(n, SYM.del_stmt);
    return new DeleteExpression(astForExprlist(c, CHILD(n, 1), Del), n.lineno, n.col_offset);
}
function astForGlobalStmt(c, n) {
    REQ(n, SYM.GlobalStmt);
    var s = [];
    for (var i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.lineno, n.col_offset);
}
function astForNonLocalStmt(c, n) {
    REQ(n, SYM.NonLocalStmt);
    var s = [];
    for (var i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new NonLocal(s, n.lineno, n.col_offset);
}
function astForAssertStmt(c, n) {
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
function aliasForImportName(c, n) {
    /*
        import_as_name: NAME ['as' NAME]
        dotted_as_name: dotted_name ['as' NAME]
        dotted_name: NAME ('.' NAME)*
    */
    loop: while (true) {
        switch (n.type) {
            case SYM.import_as_name:
                var str = null;
                var name_1 = strobj(CHILD(n, 0).value);
                if (NCH(n) === 3)
                    str = CHILD(n, 2).value;
                return new Alias(name_1, str == null ? null : strobj(str));
            case SYM.dotted_as_name:
                if (NCH(n) === 1) {
                    n = CHILD(n, 0);
                    continue loop;
                }
                else {
                    var a = aliasForImportName(c, CHILD(n, 0));
                    assert(!a.asname);
                    a.asname = strobj(CHILD(n, 2).value);
                    return a;
                }
            case SYM.dotted_name:
                if (NCH(n) === 1)
                    return new Alias(strobj(CHILD(n, 0).value), null);
                else {
                    // create a string of the form a.b.c
                    var str_1 = '';
                    for (var i = 0; i < NCH(n); i += 2)
                        str_1 += CHILD(n, i).value + ".";
                    return new Alias(strobj(str_1.substr(0, str_1.length - 1)), null);
                }
            case TOK.T_STAR:
                return new Alias(strobj("*"), null);
            default:
                throw syntaxError("unexpected import name", c.c_filename, n.lineno);
        }
    }
}
function astForImportStmt(c, n) {
    REQ(n, SYM.import_stmt);
    var lineno = n.lineno;
    var col_offset = n.col_offset;
    n = CHILD(n, 0);
    if (n.type === SYM.import_name) {
        n = CHILD(n, 1);
        REQ(n, SYM.dotted_as_names);
        var aliases = [];
        for (var i = 0; i < NCH(n); i += 2)
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        return new ImportStatement(aliases, lineno, col_offset);
    }
    else if (n.type === SYM.import_from) {
        var mod = null;
        var ndots = 0;
        var nchildren;
        for (var idx = 1; idx < NCH(n); ++idx) {
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
                    throw syntaxError("trailing comma not allowed without surrounding parentheses", c.c_filename, n.lineno);
                break;
            default:
                throw syntaxError("Unexpected node-type in from-import", c.c_filename, n.lineno);
        }
        var aliases = [];
        if (n.type === TOK.T_STAR)
            aliases[0] = aliasForImportName(c, n);
        else
            for (var i = 0; i < NCH(n); i += 2) {
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            }
        var modname = mod ? mod.name : "";
        return new ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
    }
    throw syntaxError("unknown import statement", c.c_filename, n.lineno);
}
function astForTestlistGexp(c, n) {
    assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    if (NCH(n) > 1 && CHILD(n, 1).type === SYM.gen_for)
        return astForGenexp(c, n);
    return astForTestlist(c, n);
}
function astForListcomp(c, n) {
    function countListFors(c, n) {
        var nfors = 0;
        var ch = CHILD(n, 1);
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
    function countListIfs(c, n) {
        var nifs = 0;
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
    var elt = astForExpr(c, CHILD(n, 0));
    var nfors = countListFors(c, n);
    var listcomps = [];
    var ch = CHILD(n, 1);
    for (var i = 0; i < nfors; ++i) {
        REQ(ch, SYM.list_for);
        var forch = CHILD(ch, 1);
        var t = astForExprlist(c, forch, Store);
        var expression = astForTestlist(c, CHILD(ch, 3));
        var lc;
        if (NCH(forch) === 1)
            lc = new Comprehension(t[0], expression, []);
        else
            lc = new Comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);
        if (NCH(ch) === 5) {
            ch = CHILD(ch, 4);
            var nifs = countListIfs(c, ch);
            var ifs = [];
            for (var j = 0; j < nifs; ++j) {
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
function astForUnaryExpr(c, n) {
    if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2) {
        var pfactor = CHILD(n, 1);
        if (pfactor.type === SYM.UnaryExpr && NCH(pfactor) === 1) {
            var ppower = CHILD(pfactor, 0);
            if (ppower.type === SYM.PowerExpr && NCH(ppower) === 1) {
                var patom = CHILD(ppower, 0);
                if (patom.type === SYM.AtomExpr) {
                    var pnum = CHILD(patom, 0);
                    if (pnum.type === TOK.T_NUMBER) {
                        pnum.value = "-" + pnum.value;
                        return astForAtomExpr(c, patom);
                    }
                }
            }
        }
    }
    var expression = astForExpr(c, CHILD(n, 1));
    switch (CHILD(n, 0).type) {
        case TOK.T_PLUS: return new UnaryOp(UAdd, expression, n.lineno, n.col_offset);
        case TOK.T_MINUS: return new UnaryOp(USub, expression, n.lineno, n.col_offset);
        case TOK.T_TILDE: return new UnaryOp(Invert, expression, n.lineno, n.col_offset);
    }
    throw new Error("unhandled UnaryExpr");
}
function astForForStmt(c, n) {
    var seq = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9)
        seq = astForSuite(c, CHILD(n, 8));
    var nodeTarget = CHILD(n, 1);
    var _target = astForExprlist(c, nodeTarget, Store);
    var target;
    if (NCH(nodeTarget) === 1)
        target = _target[0];
    else
        target = new Tuple(_target, Store, n.lineno, n.col_offset);
    return new ForStatement(target, astForTestlist(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 5)), seq, n.lineno, n.col_offset);
}
function astForCall(c, n, func) {
    /*
        arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
                | '**' test)
        argument: [test '='] test [gen_for]        # Really [keyword '='] test
    */
    REQ(n, SYM.arglist);
    var nargs = 0;
    var nkeywords = 0;
    var ngens = 0;
    for (var i = 0; i < NCH(n); ++i) {
        var ch = CHILD(n, i);
        if (ch.type === SYM.argument) {
            if (NCH(ch) === 1)
                nargs++;
            else if (CHILD(ch, 1).type === SYM.gen_for)
                ngens++;
            else
                nkeywords++;
        }
    }
    if (ngens > 1 || (ngens && (nargs || nkeywords)))
        throw syntaxError("Generator expression must be parenthesized if not sole argument", c.c_filename, n.lineno);
    if (nargs + nkeywords + ngens > 255)
        throw syntaxError("more than 255 arguments", c.c_filename, n.lineno);
    var args = [];
    var keywords = [];
    nargs = 0;
    nkeywords = 0;
    var vararg = null;
    var kwarg = null;
    for (var i = 0; i < NCH(n); ++i) {
        var ch = CHILD(n, i);
        if (ch.type === SYM.argument) {
            if (NCH(ch) === 1) {
                if (nkeywords)
                    throw syntaxError("non-keyword arg after keyword arg", c.c_filename, n.lineno);
                if (vararg)
                    throw syntaxError("only named arguments may follow *expression", c.c_filename, n.lineno);
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else {
                var e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda)
                    throw syntaxError("lambda cannot contain assignment", c.c_filename, n.lineno);
                else if (e.constructor !== Name)
                    throw syntaxError("keyword can't be an expression", c.c_filename, n.lineno);
                var key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key, n.lineno);
                for (var k = 0; k < nkeywords; ++k) {
                    var tmp = keywords[k].arg;
                    if (tmp === key)
                        throw syntaxError("keyword argument repeated", c.c_filename, n.lineno);
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
function astForTrailer(c, n, leftExpr) {
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
            var simple = true;
            var slices = [];
            for (var j = 0; j < NCH(n); j += 2) {
                var slc = astForSlice(c, CHILD(n, j));
                if (slc.constructor !== Index)
                    simple = false;
                slices[j / 2] = slc;
            }
            if (!simple) {
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n.lineno, n.col_offset);
            }
            var elts = [];
            for (var j = 0; j < slices.length; ++j) {
                var slc_1 = slices[j];
                assert(slc_1.constructor === Index && slc_1.value !== null && slc_1.value !== undefined);
                elts[j] = slc_1.value;
            }
            var e = new Tuple(elts, Load, n.lineno, n.col_offset);
            return new Subscript(leftExpr, new Index(e), Load, n.lineno, n.col_offset);
        }
    }
}
function astForFlowStmt(c, n) {
    var ch;
    REQ(n, SYM.flow_stmt);
    ch = CHILD(n, 0);
    switch (ch.type) {
        case SYM.break_stmt: return new BreakStatement(n.lineno, n.col_offset);
        case SYM.continue_stmt: return new ContinueStatement(n.lineno, n.col_offset);
        case SYM.yield_stmt:
            return new Expr(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
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
                return new Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), null, n.lineno, n.col_offset);
            else if (NCH(ch) === 6)
                return new Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), astForExpr(c, CHILD(ch, 5)), n.lineno, n.col_offset);
            else {
                throw new Error("unhandled flow statement");
            }
        }
        default: {
            throw new Error("unexpected flow_stmt");
        }
    }
}
function astForArguments(c, n) {
    /* parameters: '(' [varargslist] ')'
        varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
            | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
    */
    var ch;
    var vararg = null;
    var kwarg = null;
    if (n.type === SYM.parameters) {
        if (NCH(n) === 2)
            return new Arguments([], null, null, []);
        n = CHILD(n, 1);
    }
    REQ(n, SYM.varargslist);
    var args = [];
    var defaults = [];
    /* fpdef: NAME | '(' fplist ')'
        fplist: fpdef (',' fpdef)* [',']
    */
    var foundDefault = false;
    var i = 0;
    var j = 0; // index for defaults
    var k = 0; // index for args
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
            case SYM.fpdef:
                var complexArgs = 0;
                var parenthesized = false;
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
                            throw syntaxError("parenthesized arg with default", c.c_filename, n.lineno);
                        throw syntaxError("non-default argument follows default argument", c.c_filename, n.lineno);
                    }
                    if (NCH(ch) === 3) {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1) {
                            throw syntaxError("tuple parameter unpacking has been removed", c.c_filename, n.lineno);
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
                        var id = strobj(CHILD(ch, 0).value);
                        args[k++] = new Name(id, Param, ch.lineno, ch.col_offset);
                    }
                    i += 2;
                    if (parenthesized)
                        throw syntaxError("parenthesized argument names are invalid", c.c_filename, n.lineno);
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
function astForFuncdef(c, n, decoratorSeq) {
    /* funcdef: 'def' NAME parameters ':' suite */
    REQ(n, SYM.funcdef);
    var name = strobj(CHILD(n, 1).value);
    forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value, n.lineno);
    var args = astForArguments(c, CHILD(n, 2));
    var body = astForSuite(c, CHILD(n, 4));
    return new FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
}
function astForClassBases(c, n) {
    assert(NCH(n) > 0);
    REQ(n, SYM.testlist);
    if (NCH(n) === 1)
        return [astForExpr(c, CHILD(n, 0))];
    return seqForTestlist(c, n);
}
function astForClassdef(c, n, decoratorSeq) {
    REQ(n, SYM.classdef);
    forbiddenCheck(c, n, CHILD(n, 1).value, n.lineno);
    var classname = strobj(CHILD(n, 1).value);
    if (NCH(n) === 4)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
    if (CHILD(n, 3).type === TOK.T_RPAR)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);
    var bases = astForClassBases(c, CHILD(n, 3));
    var s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
}
function astForLambdef(c, n) {
    var args;
    var expression;
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
function astForGenexp(c, n) {
    /* testlist_gexp: test ( gen_for | (',' test)* [','] )
        argument: [test '='] test [gen_for]       # Really [keyword '='] test */
    assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    assert(NCH(n) > 1);
    function countGenFors(c, n) {
        var nfors = 0;
        var ch = CHILD(n, 1);
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
    function countGenIfs(c, n) {
        var nifs = 0;
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
    var elt = astForExpr(c, CHILD(n, 0));
    var nfors = countGenFors(c, n);
    var genexps = [];
    var ch = CHILD(n, 1);
    for (var i = 0; i < nfors; ++i) {
        REQ(ch, SYM.gen_for);
        var forch = CHILD(ch, 1);
        var t = astForExprlist(c, forch, Store);
        var expression = astForExpr(c, CHILD(ch, 3));
        var ge;
        if (NCH(forch) === 1)
            ge = new Comprehension(t[0], expression, []);
        else
            ge = new Comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);
        if (NCH(ch) === 5) {
            ch = CHILD(ch, 4);
            var nifs = countGenIfs(c, ch);
            var ifs = [];
            for (var j = 0; j < nifs; ++j) {
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
function astForWhileStmt(c, n) {
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    else if (NCH(n) === 7)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
    throw new Error("wrong number of tokens for 'while' stmt");
}
function astForAugassign(c, n) {
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0)) {
        case '+': return Add;
        case '-': return Sub;
        case '/':
            if (n.value.charAt(1) === '/')
                return FloorDiv;
            return Div;
        case '%': return Mod;
        case '<': return LShift;
        case '>': return RShift;
        case '&': return BitAnd;
        case '^': return BitXor;
        case '|': return BitOr;
        case '*':
            if (n.value.charAt(1) === '*')
                return Pow;
            return Mult;
        default: {
            throw new Error("invalid augassign");
        }
    }
}
function astForBinop(c, n) {
    /* Must account for a sequence of expressions.
        How should A op B op C by represented?
        BinOp(BinOp(A, op, B), op, C).
    */
    var result = new BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.lineno, n.col_offset);
    var nops = (NCH(n) - 1) / 2;
    for (var i = 1; i < nops; ++i) {
        var nextOper = CHILD(n, i * 2 + 1);
        var newoperator = getOperator(nextOper);
        var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
    }
    return result;
}
function astForTestlist(c, n) {
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
function astForExprStmt(c, n) {
    REQ(n, SYM.ExprStmt);
    if (NCH(n) === 1)
        return new Expr(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
    else if (CHILD(n, 1).type === SYM.augassign) {
        var ch = CHILD(n, 0);
        var expr1 = astForTestlist(c, ch);
        switch (expr1.constructor) {
            case GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", c.c_filename, n.lineno);
            case Yield: throw syntaxError("augmented assignment to yield expression not possible", c.c_filename, n.lineno);
            case Name:
                var varName = expr1.id;
                forbiddenCheck(c, ch, varName, n.lineno);
                break;
            case Attribute:
            case Subscript:
                break;
            default:
                throw syntaxError("illegal expression for augmented assignment", c.c_filename, n.lineno);
        }
        setContext(c, expr1, Store, ch);
        ch = CHILD(n, 2);
        var expr2;
        if (ch.type === SYM.testlist)
            expr2 = astForTestlist(c, ch);
        else
            expr2 = astForExpr(c, ch);
        return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
    }
    else {
        // normal assignment
        REQ(CHILD(n, 1), TOK.T_EQUAL);
        var targets = [];
        for (var i = 0; i < NCH(n) - 2; i += 2) {
            var ch = CHILD(n, i);
            if (ch.type === SYM.YieldExpr)
                throw syntaxError("assignment to yield expression not possible", c.c_filename, n.lineno);
            var e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        var value = CHILD(n, NCH(n) - 1);
        var expression;
        if (value.type === SYM.testlist)
            expression = astForTestlist(c, value);
        else
            expression = astForExpr(c, value);
        return new Assign(targets, expression, n.lineno, n.col_offset);
    }
}
function astForIfexpr(c, n) {
    assert(NCH(n) === 5);
    return new IfExp(astForExpr(c, CHILD(n, 2)), astForExpr(c, CHILD(n, 0)), astForExpr(c, CHILD(n, 4)), n.lineno, n.col_offset);
}
// escape() was deprecated in JavaScript 1.5. Use encodeURI or encodeURIComponent instead.
function escape(s) {
    return encodeURIComponent(s);
}
/**
 * s is a python-style string literal, including quote characters and u/r/b
 * prefixes. Returns decoded string object.
 */
function parsestr(c, s) {
    // const encodeUtf8 = function(s) { return unescape(encodeURIComponent(s)); };
    var decodeUtf8 = function (s) { return decodeURIComponent(escape(s)); };
    var decodeEscape = function (s, quote) {
        var len = s.length;
        var ret = '';
        for (var i = 0; i < len; ++i) {
            var c = s.charAt(i);
            if (c === '\\') {
                ++i;
                c = s.charAt(i);
                if (c === 'n')
                    ret += "\n";
                else if (c === '\\')
                    ret += "\\";
                else if (c === 't')
                    ret += "\t";
                else if (c === 'r')
                    ret += "\r";
                else if (c === 'b')
                    ret += "\b";
                else if (c === 'f')
                    ret += "\f";
                else if (c === 'v')
                    ret += "\v";
                else if (c === '0')
                    ret += "\0";
                else if (c === '"')
                    ret += '"';
                else if (c === '\'')
                    ret += '\'';
                else if (c === '\n') { }
                else if (c === 'x') {
                    var d0 = s.charAt(++i);
                    var d1 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16));
                }
                else if (c === 'u' || c === 'U') {
                    var d0 = s.charAt(++i);
                    var d1 = s.charAt(++i);
                    var d2 = s.charAt(++i);
                    var d3 = s.charAt(++i);
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
    var quote = s.charAt(0);
    var rawmode = false;
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
function parsestrplus(c, n) {
    REQ(CHILD(n, 0), TOK.T_STRING);
    var ret = "";
    for (var i = 0; i < NCH(n); ++i) {
        var child = CHILD(n, i);
        try {
            ret = ret + parsestr(c, child.value);
        }
        catch (x) {
            throw syntaxError("invalid string (possibly contains a unicode character)", c.c_filename, child.lineno);
        }
    }
    return ret;
}
function parsenumber(c, s, lineno) {
    var end = s.charAt(s.length - 1);
    if (end === 'j' || end === 'J') {
        throw syntaxError("complex numbers are currently unsupported", c.c_filename, lineno);
    }
    if (s.indexOf('.') !== -1) {
        return floatAST(s);
    }
    // Handle integers of various bases
    var tmp = s;
    var value;
    var radix = 10;
    var neg = false;
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
function astForSlice(c, n) {
    REQ(n, SYM.subscript);
    var ch = CHILD(n, 0);
    var lower = null;
    var upper = null;
    var step = null;
    if (ch.type === TOK.T_DOT)
        return new Ellipsis();
    if (NCH(n) === 1 && ch.type === SYM.IfExpr)
        return new Index(astForExpr(c, ch));
    if (ch.type === SYM.IfExpr)
        lower = astForExpr(c, ch);
    if (ch.type === TOK.T_COLON) {
        if (NCH(n) > 1) {
            var n2 = CHILD(n, 1);
            if (n2.type === SYM.IfExpr)
                upper = astForExpr(c, n2);
        }
    }
    else if (NCH(n) > 2) {
        var n2_1 = CHILD(n, 2);
        if (n2_1.type === SYM.IfExpr) {
            upper = astForExpr(c, n2_1);
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
function astForAtomExpr(c, n) {
    var ch = CHILD(n, 0);
    switch (ch.type) {
        case TOK.T_NAME:
            // All names start in Load context, but may be changed later
            return new Name(strobj(ch.value), Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
            return new Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
        case TOK.T_LPAR:
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RPAR)
                return new Tuple([], Load, n.lineno, n.col_offset);
            if (ch.type === SYM.YieldExpr)
                return astForExpr(c, ch);
            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                return astForGenexp(c, ch);
            return astForTestlistGexp(c, ch);
        case TOK.T_LSQB:
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
            var keys = [];
            var values = [];
            for (var i = 0; i < NCH(ch); i += 4) {
                keys[i / 4] = astForExpr(c, CHILD(ch, i));
                values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
            }
            return new Dict(keys, values, n.lineno, n.col_offset);
        case TOK.T_BACKQUOTE:
            throw syntaxError("backquote not supported, use repr()", c.c_filename, n.lineno);
        default: {
            throw new Error("unhandled atom" /*, ch.type*/);
        }
    }
}
function astForPowerExpr(c, n) {
    REQ(n, SYM.PowerExpr);
    var e = astForAtomExpr(c, CHILD(n, 0));
    if (NCH(n) === 1)
        return e;
    for (var i = 1; i < NCH(n); ++i) {
        var ch = CHILD(n, i);
        if (ch.type !== SYM.trailer)
            break;
        var tmp = astForTrailer(c, ch, e);
        tmp.lineno = e.lineno;
        tmp.col_offset = e.col_offset;
        e = tmp;
    }
    if (CHILD(n, NCH(n) - 1).type === SYM.UnaryExpr) {
        var f = astForExpr(c, CHILD(n, NCH(n) - 1));
        e = new BinOp(e, Pow, f, n.lineno, n.col_offset);
    }
    return e;
}
function astForExpr(c, n) {
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
                var seq = [];
                for (var i = 0; i < NCH(n); i += 2)
                    seq[i / 2] = astForExpr(c, CHILD(n, i));
                if (CHILD(n, 1).value === "and")
                    return new BoolOp(And, seq, n.lineno, n.col_offset);
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
                    var ops = [];
                    var cmps = [];
                    for (var i_1 = 1; i_1 < NCH(n); i_1 += 2) {
                        ops[(i_1 - 1) / 2] = astForCompOp(c, CHILD(n, i_1));
                        cmps[(i_1 - 1) / 2] = astForExpr(c, CHILD(n, i_1 + 1));
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
                var exp = null;
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
                throw new Error("unhandled expr" /*, "n.type: %d", n.type*/);
            }
        }
    }
}
function astForPrintStmt(c, n) {
    var start = 1;
    var dest = null;
    REQ(n, SYM.print_stmt);
    if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT) {
        dest = astForExpr(c, CHILD(n, 2));
        start = 4;
    }
    var seq = [];
    for (var i = start, j = 0; i < NCH(n); i += 2, ++j) {
        seq[j] = astForExpr(c, CHILD(n, i));
    }
    var nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
    return new Print(dest, seq, nl, n.lineno, n.col_offset);
}
function astForStmt(c, n) {
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
        var ch = CHILD(n, 0);
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
export function astFromParse(n, filename) {
    var c = new Compiling("utf-8", filename);
    var stmts = [];
    var k = 0;
    switch (n.type) {
        case SYM.file_input:
            for (var i = 0; i < NCH(n) - 1; ++i) {
                var ch = CHILD(n, i);
                if (n.type === TOK.T_NEWLINE)
                    continue;
                REQ(ch, SYM.stmt);
                var num = numStmts(ch);
                if (num === 1) {
                    stmts[k++] = astForStmt(c, ch);
                }
                else {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (var j = 0; j < num; ++j) {
                        stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                    }
                }
            }
            return new Module(stmts);
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
}
export function astDump(node) {
    var _format = function (node) {
        if (node === null) {
            return "None";
        }
        else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum) {
            return node.prototype._astname + "()";
        }
        else if (node._astname !== undefined) {
            var fields = [];
            for (var i = 0; i < node._fields.length; i += 2) {
                var a = node._fields[i]; // field name
                var b = node._fields[i + 1](node); // field getter func
                fields.push([a, _format(b)]);
            }
            var attrs = [];
            for (var i = 0; i < fields.length; ++i) {
                var field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
            }
            var fieldstr = attrs.join(',');
            return node._astname + "(" + fieldstr + ")";
        }
        else if (isArrayLike(node)) {
            var elems = [];
            for (var i = 0; i < node.length; ++i) {
                var x = node[i];
                elems.push(_format(x));
            }
            var elemsstr = elems.join(',');
            return "[" + elemsstr.replace(/^\s+/, '') + "]";
        }
        else {
            var ret;
            if (node === true)
                ret = "True";
            else if (node === false)
                ret = "False";
            else
                ret = "" + node;
            return ret;
        }
    };
    return _format(node);
}