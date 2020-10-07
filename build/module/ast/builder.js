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
var SYM = ParseTables.sym;
/**
 *
 */
var LONG_THRESHOLD = Math.pow(2, 53);
/**
 * FIXME: Consolidate with parseError in parser.
 */
function syntaxError(message, range) {
    assert(isString(message), "message must be a string");
    assert(isNumber(range.begin.line), "lineNumber must be a number");
    var e = new SyntaxError(message /*, fileName*/);
    e['lineNumber'] = range.begin.line;
    return e;
}
var Compiling = /** @class */ (function () {
    function Compiling(encoding) {
        this.c_encoding = encoding;
    }
    return Compiling;
}());
/**
 * Asserts that the type of the node is that specified.
 */
function REQ(n, type) {
    // Avoid the cost of building the message string when there is no issue.
    if (n.type !== type) {
        fail("node must have type " + type + " = " + grammarName(type) + ", but was " + n.type + " = " + grammarName(n.type) + ".");
    }
}
/**
 * Nothing more than assertion that the argument is a string.
 */
function strobj(s) {
    // Avoid the cost of building the message string when there is no issue.
    if (typeof s !== 'string') {
        fail("expecting string, got " + (typeof s));
    }
    // This previously constructed the runtime representation.
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
function forbiddenCheck(c, n, x, range) {
    if (x === "None")
        throw syntaxError("assignment to None", range);
    if (x === "True" || x === "False")
        throw syntaxError("assignment to True or False is forbidden", range);
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
    if (e instanceof Attribute) {
        if (ctx === Store)
            forbiddenCheck(c, n, e.attr.value, n.range);
        e.ctx = ctx;
    }
    else if (e instanceof Name) {
        if (ctx === Store)
            forbiddenCheck(c, n, /*e.attr*/ void 0, n.range);
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
        for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
            var e_1 = s_1[_i];
            setContext(c, e_1, ctx, n);
        }
    }
}
var operatorMap = {};
(function () {
    operatorMap[TOK.T_VBAR] = BitOr;
    assert(operatorMap[TOK.T_VBAR] !== undefined, "" + TOK.T_VBAR);
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
function getOperator(n) {
    assert(operatorMap[n.type] !== undefined, "" + n.type);
    return { op: operatorMap[n.type], range: n.range };
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
    if (NCH(exc) === 1) {
        return new ExceptHandler(null, null, astForSuite(c, body), exc.range);
    }
    else if (NCH(exc) === 2)
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.range);
    else if (NCH(exc) === 4) {
        var e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.range);
    }
    else {
        throw new Error("wrong number of children for except clause");
    }
}
function astForTryStmt(c, n) {
    var nc = NCH(n);
    var nexcept = (nc - 3) / 3;
    var orelse = [];
    var finally_ = null;
    REQ(n, SYM.try_stmt);
    var body = astForSuite(c, CHILD(n, 2));
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
        var handlers = [];
        for (var i = 0; i < nexcept; ++i) {
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        }
        var exceptSt = new TryExcept(body, handlers, orelse, n.range);
        if (!finally_)
            return exceptSt;
        /* if a 'finally' is present too, we nest the TryExcept within a
            TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }
    assert(finally_ !== null);
    return new TryFinally(body, finally_, n.range);
}
function astForDottedName(c, n) {
    REQ(n, SYM.dotted_name);
    var child = CHILD(n, 0);
    var id = new RangeAnnotated(child.value, child.range);
    var e = new Name(id, Load);
    for (var i = 2; i < NCH(n); i += 2) {
        var child_1 = CHILD(n, i);
        id = new RangeAnnotated(child_1.value, child_1.range);
        e = new Attribute(e, id, Load, n.range);
    }
    return e;
}
function astForDecorator(c, n) {
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    var nameExpr = astForDottedName(c, CHILD(n, 1));
    if (NCH(n) === 3) // no args
        return nameExpr;
    else if (NCH(n) === 5) // call with no args
        return new Call(nameExpr, [], [], null, null);
    else
        return astForCall(c, CHILD(n, 3), nameExpr);
}
function astForDecorators(c, n) {
    REQ(n, SYM.decorators);
    var decoratorSeq = [];
    for (var i = 0; i < NCH(n); ++i) {
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    }
    return decoratorSeq;
}
function astForDecorated(c, n) {
    REQ(n, SYM.decorated);
    var decoratorSeq = astForDecorators(c, CHILD(n, 0));
    assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);
    var thing = null;
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
    var optionalVars;
    if (CHILD(n, 2).type === SYM.with_var) {
        optionalVars = astForWithVar(c, CHILD(n, 2));
        setContext(c, optionalVars, Store, n);
        suiteIndex = 4;
    }
    return new WithStatement(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.range);
}
function astForExecStmt(c, n) {
    var globals = null;
    var locals = null;
    var nchildren = NCH(n);
    assert(nchildren === 2 || nchildren === 4 || nchildren === 6);
    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    var expr1 = astForExpr(c, CHILD(n, 1));
    if (nchildren >= 4) {
        globals = astForExpr(c, CHILD(n, 3));
    }
    if (nchildren === 6) {
        locals = astForExpr(c, CHILD(n, 5));
    }
    return new Exec(expr1, globals, locals, n.range);
}
function astForIfStmt(c, n) {
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
        ['else' ':' suite]
    */
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4)
        return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.range);
    var s = CHILD(n, 4).value;
    var decider = s.charAt(2); // elSe or elIf
    if (decider === 's') {
        return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.range);
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
                new IfStatement(astForExpr(c, CHILD(n, NCH(n) - 6)), astForSuite(c, CHILD(n, NCH(n) - 4)), astForSuite(c, CHILD(n, NCH(n) - 1)), CHILD(n, NCH(n) - 6).range)
            ];
            nElif--;
        }
        for (var i = 0; i < nElif; ++i) {
            var off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new IfStatement(astForExpr(c, CHILD(n, off)), astForSuite(c, CHILD(n, off + 2)), orelse, CHILD(n, off).range)
            ];
        }
        return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), orelse, n.range);
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
    return new DeleteStatement(astForExprlist(c, CHILD(n, 1), Del), n.range);
}
function astForGlobalStmt(c, n) {
    REQ(n, SYM.GlobalStmt);
    var s = [];
    for (var i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.range);
}
function astForNonLocalStmt(c, n) {
    REQ(n, SYM.NonLocalStmt);
    var s = [];
    for (var i = 1; i < NCH(n); i += 2) {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new NonLocal(s, n.range);
}
function astForAssertStmt(c, n) {
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
function aliasForImportName(c, n) {
    /*
        ImportSpecifier: NAME ['as' NAME]
        dotted_as_name: dotted_name ['as' NAME]
        dotted_name: NAME ('.' NAME)*
    */
    loop: while (true) {
        switch (n.type) {
            case SYM.ImportSpecifier: {
                var str = null;
                var nameNode = CHILD(n, 0);
                var name_1 = strobj(nameNode.value);
                var nameRange = nameNode.range;
                if (NCH(n) === 3) {
                    str = CHILD(n, 2).value;
                }
                return new Alias(new RangeAnnotated(name_1, nameRange), str == null ? null : strobj(str));
            }
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
                if (NCH(n) === 1) {
                    var nameNode = CHILD(n, 0);
                    var name_2 = strobj(nameNode.value);
                    var nameRange = nameNode.range;
                    return new Alias(new RangeAnnotated(name_2, nameRange), null);
                }
                else {
                    // create a string of the form a.b.c
                    var str = '';
                    for (var i = 0; i < NCH(n); i += 2) {
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
                throw syntaxError("unexpected import name " + grammarName(n.type), n.range);
            }
        }
    }
}
function parseModuleSpecifier(c, moduleSpecifierNode) {
    REQ(moduleSpecifierNode, SYM.ModuleSpecifier);
    var N = NCH(moduleSpecifierNode);
    var ret = "";
    var range;
    for (var i = 0; i < N; ++i) {
        var child = CHILD(moduleSpecifierNode, i);
        ret = ret + parsestr(c, child.value);
        range = child.range;
    }
    return { value: ret, range: range };
}
function astForImportStmt(c, importStatementNode) {
    REQ(importStatementNode, SYM.import_stmt);
    var nameOrFrom = CHILD(importStatementNode, 0);
    if (nameOrFrom.type === SYM.import_name) {
        var n = CHILD(nameOrFrom, 1);
        REQ(n, SYM.dotted_as_names);
        var aliases = [];
        for (var i = 0; i < NCH(n); i += 2) {
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        }
        return new ImportStatement(aliases, importStatementNode.range);
    }
    else if (nameOrFrom.type === SYM.import_from) {
        // let mod: Alias = null;
        var moduleSpec = void 0;
        var ndots = 0;
        var nchildren = void 0;
        var idx = void 0;
        for (idx = 1; idx < NCH(nameOrFrom); ++idx) {
            var child = CHILD(nameOrFrom, idx);
            var childType = child.type;
            if (childType === SYM.dotted_name) {
                // This should be dead code since we support ECMAScript 2015 modules.
                throw syntaxError("unknown import statement " + grammarName(childType) + ".", child.range);
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
                throw syntaxError("unknown import statement " + grammarName(childType) + ".", child.range);
                // break;
            }
            ndots++;
        }
        ++idx; // skip the import keyword
        var n = nameOrFrom;
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
        var aliases = [];
        if (n.type === TOK.T_STAR) {
            aliases[0] = aliasForImportName(c, n);
        }
        else {
            REQ(n, SYM.import_from);
            var importListNode = CHILD(n, FIND(n, SYM.ImportList));
            astForImportList(c, importListNode, aliases);
        }
        // moduleName = mod ? mod.name : moduleName;
        assert(typeof moduleSpec.value === 'string');
        return new ImportFrom(new RangeAnnotated(moduleSpec.value, moduleSpec.range), aliases, ndots, importStatementNode.range);
    }
    else {
        throw syntaxError("unknown import statement " + grammarName(nameOrFrom.type) + ".", nameOrFrom.range);
    }
}
function astForImportList(c, importListNode, aliases) {
    REQ(importListNode, SYM.ImportList);
    var N = NCH(importListNode);
    for (var i = 0; i < N; i++) {
        var child = CHILD(importListNode, i);
        if (child.type === SYM.ImportSpecifier) {
            aliases.push(aliasForImportName(c, child));
        }
    }
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
        var lc = void 0;
        if (NCH(forch) === 1)
            lc = new Comprehension(t[0], expression, []);
        else
            lc = new Comprehension(new Tuple(t, Store, ch.range), expression, []);
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
    return new ListComp(elt, listcomps, n.range);
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
        case TOK.T_PLUS: return new UnaryOp(UAdd, expression, n.range);
        case TOK.T_MINUS: return new UnaryOp(USub, expression, n.range);
        case TOK.T_TILDE: return new UnaryOp(Invert, expression, n.range);
    }
    throw new Error("unhandled UnaryExpr");
}
function astForForStmt(c, n) {
    var seq = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9) {
        seq = astForSuite(c, CHILD(n, 8));
    }
    var nodeTarget = CHILD(n, 1);
    var _target = astForExprlist(c, nodeTarget, Store);
    var target;
    if (NCH(nodeTarget) === 1)
        target = _target[0];
    else
        target = new Tuple(_target, Store, n.range);
    return new ForStatement(target, astForTestlist(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 5)), seq, n.range);
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
        throw syntaxError("Generator expression must be parenthesized if not sole argument", n.range);
    if (nargs + nkeywords + ngens > 255)
        throw syntaxError("more than 255 arguments", n.range);
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
                    throw syntaxError("non-keyword arg after keyword arg", n.range);
                if (vararg)
                    throw syntaxError("only named arguments may follow *expression", n.range);
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else {
                var e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) {
                    throw syntaxError("lambda cannot contain assignment", n.range);
                }
                else if (e.constructor !== Name) {
                    throw syntaxError("keyword can't be an expression", n.range);
                }
                // TODO: Why does TypeScript think that the type is never?
                var key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key.value, n.range);
                for (var k = 0; k < nkeywords; ++k) {
                    var tmp = keywords[k].arg.value;
                    if (tmp === key.value)
                        throw syntaxError("keyword argument repeated", n.range);
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
    var keywordDict = keywordsToDict(keywords);
    if (keywordDict.keys.length !== 0) {
        args.push(keywordDict);
    }
    return new Call(func, args, [], vararg, kwarg);
}
function keywordsToDict(keywords) {
    var keys = [];
    var values = [];
    for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
        var keyword = keywords_1[_i];
        values.push(keyword.value);
        keys.push(new Name(new RangeAnnotated(keyword.arg.value, keyword.arg.range), Load));
    }
    return new Dict(keys, values);
}
function astForTrailer(c, node, leftExpr) {
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
        subscriptlist: subscript (',' subscript)* [',']
        subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
        */
    var n = node;
    var childZero = CHILD(n, 0);
    var childOne = CHILD(n, 1);
    var childTwo = CHILD(n, 2);
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
        var n_1 = childOne;
        if (NCH(n_1) === 1)
            return new Subscript(leftExpr, astForSlice(c, CHILD(n_1, 0)), Load, n_1.range);
        else {
            /* The grammar is ambiguous here. The ambiguity is resolved
                by treating the sequence as a tuple literal if there are
                no slice features.
            */
            var simple = true;
            var slices = [];
            for (var j = 0; j < NCH(n_1); j += 2) {
                var slc = astForSlice(c, CHILD(n_1, j));
                if (slc.constructor !== Index) {
                    simple = false;
                }
                slices[j / 2] = slc;
            }
            if (!simple) {
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n_1.range);
            }
            var elts = [];
            for (var j = 0; j < slices.length; ++j) {
                var slc = slices[j];
                if (slc instanceof Index) {
                    assert(slc.value !== null && slc.value !== undefined);
                    elts[j] = slc.value;
                }
                else {
                    assert(slc instanceof Index);
                }
            }
            var e = new Tuple(elts, Load, n_1.range);
            return new Subscript(leftExpr, new Index(e), Load, n_1.range);
        }
    }
}
function astForFlowStmt(c, n) {
    REQ(n, SYM.flow_stmt);
    var ch = CHILD(n, 0);
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
                return new Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), null, n.range);
            else if (NCH(ch) === 6)
                return new Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), astForExpr(c, CHILD(ch, 5)), n.range);
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
        if (NCH(n) === 2) // () as arglist
            return new Arguments([], null, null, []);
        n = CHILD(n, 1); // n is a varargslist here on out
    }
    REQ(n, SYM.varargslist);
    var args = [];
    var defaults = [];
    /* fpdef: NAME [':' IfExpr] | '(' fplist ')'
        fplist: fpdef (',' fpdef)* [',']
    */
    var foundDefault = false;
    var i = 0;
    var j = 0; // index for defaults
    var k = 0; // index for args
    // loop through the children of the varargslist
    while (i < NCH(n)) {
        ch = CHILD(n, i);
        switch (ch.type) {
            // If it is a fpdef - act here
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
                    var childZero = CHILD(ch, 0);
                    if (childZero.type === TOK.T_NAME) {
                        forbiddenCheck(c, n, childZero.value, n.range);
                        var id = new RangeAnnotated(childZero.value, childZero.range);
                        /**
                         * Setting the type of the param here, will be third child of fpdef if it exists
                         * If it doesn't exist then set the type as null and have typescript attempt to infer it later
                         */
                        var paramTypeNode = CHILD(ch, 2);
                        if (paramTypeNode) {
                            var paramTypeExpr = astForExpr(c, paramTypeNode);
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
function astForFuncdef(c, n, decoratorSeq) {
    /**
     * funcdef: ['export'] def' NAME parameters ['->' IfExpr] ':' suite
     */
    REQ(n, SYM.funcdef);
    var numberOfChildren = NCH(n);
    var ch1;
    var name;
    var args;
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
    var body;
    var returnType;
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
        fail("Was expecting 5, 7 or 8 children, received " + numberOfChildren + " children");
    }
    return new FunctionDef(new RangeAnnotated(name, ch1.range), args, body, returnType, decoratorSeq, n.range);
}
function astForClassBases(c, n) {
    var numberOfChildren = NCH(n);
    assert(numberOfChildren > 0);
    REQ(n, SYM.testlist);
    if (numberOfChildren === 1) {
        return [astForExpr(c, CHILD(n, 0))];
    }
    return seqForTestlist(c, n);
}
function astForClassdef(c, node, decoratorSeq) {
    /**
     * ['export'] 'class' NAME ['(' [testlist] ')'] ':' suite
     */
    var n = node;
    var numberOfChildren = NCH(n);
    REQ(n, SYM.classdef);
    var nameNode;
    var className;
    var nameRange;
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
    var c3 = CHILD(n, 3);
    // If grammar looks like 'class NAME '(' ')' : suite'
    if (c3.type === TOK.T_RPAR) {
        return new ClassDef(new RangeAnnotated(className, nameRange), [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.range);
    }
    // Otherwise grammar looks like 'class NAME '(' testlist ')' : suite'
    // ClassBases are 'testlist'
    var bases = astForClassBases(c, c3);
    var s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(new RangeAnnotated(className, nameRange), bases, s, decoratorSeq, n.range);
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
    return new Lambda(args, expression, n.range);
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
        var ge = void 0;
        if (NCH(forch) === 1)
            ge = new Comprehension(t[0], expression, []);
        else
            ge = new Comprehension(new Tuple(t, Store, ch.range), expression, []);
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
    return new GeneratorExp(elt, genexps, n.range);
}
function astForWhileStmt(c, n) {
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.range);
    else if (NCH(n) === 7)
        return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.range);
    throw new Error("wrong number of tokens for 'while' stmt");
}
function astForAugassign(c, n) {
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0)) {
        case '+': return Add;
        case '-': return Sub;
        case '/': {
            if (n.value.charAt(1) === '/') {
                return FloorDiv;
            }
            else {
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
function astForBinop(c, n) {
    /* Must account for a sequence of expressions.
        How should A op B op C by represented?
        BinOp(BinOp(A, op, B), op, C).
    */
    var result = new BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.range);
    var nops = (NCH(n) - 1) / 2;
    for (var i = 1; i < nops; ++i) {
        var nextOper = CHILD(n, i * 2 + 1);
        var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, getOperator(nextOper), tmp, nextOper.range);
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
        return new Tuple(seqForTestlist(c, n), Load, n.range);
    }
}
function astForExprStmt(c, node) {
    // Prevent assignment.
    var n = node;
    REQ(n, SYM.ExprStmt);
    if (NCH(n) === 1) {
        return new ExpressionStatement(astForTestlist(c, CHILD(n, 0)), n.range);
    }
    else if (CHILD(n, 1).type === SYM.augassign) {
        var ch = CHILD(n, 0);
        var expr1 = astForTestlist(c, ch);
        switch (expr1.constructor) {
            case GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", n.range);
            case Yield: throw syntaxError("augmented assignment to yield expression not possible", n.range);
            case Name: {
                var varName = expr1.id;
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
        var expr2 = void 0;
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
        var ch = CHILD(n, 0);
        var annasignChild = CHILD(n, 1);
        var type = astForExpr(c, CHILD(annasignChild, 1));
        var eq = CHILD(annasignChild, 2); // Equals sign
        if (eq) {
            REQ(eq, TOK.T_EQUAL);
            var variable = [astForTestlist(c, ch)]; // variable is the first node (before the annasign)
            var valueNode = CHILD(annasignChild, 3);
            var value = void 0;
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
        var eq = CHILD(n, 1);
        REQ(eq, TOK.T_EQUAL);
        var targets = [];
        var N = NCH(n);
        for (var i = 0; i < N - 2; i += 2) {
            var ch = CHILD(n, i);
            if (ch.type === SYM.YieldExpr)
                throw syntaxError("assignment to yield expression not possible", n.range);
            var e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        var value = CHILD(n, N - 1);
        var expression = void 0;
        if (value.type === SYM.testlist)
            expression = astForTestlist(c, value);
        else
            expression = astForExpr(c, value);
        return new Assign(targets, expression, n.range, eq.range);
    }
}
function astForIfexpr(c, n) {
    assert(NCH(n) === 5);
    return new IfExp(astForExpr(c, CHILD(n, 2)), astForExpr(c, CHILD(n, 0)), astForExpr(c, CHILD(n, 4)), n.range);
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
            var c_1 = s.charAt(i);
            if (c_1 === '\\') {
                ++i;
                c_1 = s.charAt(i);
                if (c_1 === 'n')
                    ret += "\n";
                else if (c_1 === '\\')
                    ret += "\\";
                else if (c_1 === 't')
                    ret += "\t";
                else if (c_1 === 'r')
                    ret += "\r";
                else if (c_1 === 'b')
                    ret += "\b";
                else if (c_1 === 'f')
                    ret += "\f";
                else if (c_1 === 'v')
                    ret += "\v";
                else if (c_1 === '0')
                    ret += "\0";
                else if (c_1 === '"')
                    ret += '"';
                else if (c_1 === '\'')
                    ret += '\'';
                else if (c_1 === '\n') /* escaped newline, join lines */ { /* Do nothing */ }
                else if (c_1 === 'x') {
                    var d0 = s.charAt(++i);
                    var d1 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16));
                }
                else if (c_1 === 'u' || c_1 === 'U') {
                    var d0 = s.charAt(++i);
                    var d1 = s.charAt(++i);
                    var d2 = s.charAt(++i);
                    var d3 = s.charAt(++i);
                    ret += String.fromCharCode(parseInt(d0 + d1, 16), parseInt(d2 + d3, 16));
                }
                else {
                    // Leave it alone
                    ret += "\\" + c_1;
                }
            }
            else {
                ret += c_1;
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
 *
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
            throw syntaxError("invalid string (possibly contains a unicode character)", child.range);
        }
    }
    return ret;
}
function parsenumber(c, s, range) {
    var endChar = s.charAt(s.length - 1);
    if (endChar === 'j' || endChar === 'J') {
        throw syntaxError("complex numbers are currently unsupported", range);
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
function astForSlice(c, node) {
    var n = node;
    REQ(n, SYM.subscript);
    var ch = CHILD(n, 0);
    var lower = null;
    var upper = null;
    var step = null;
    if (ch.type === TOK.T_DOT) {
        return new Ellipsis();
    }
    if (NCH(n) === 1 && ch.type === SYM.IfExpr) {
        return new Index(astForExpr(c, ch));
    }
    if (ch.type === SYM.IfExpr) {
        lower = astForExpr(c, ch);
    }
    if (ch.type === TOK.T_COLON) {
        if (NCH(n) > 1) {
            var n2 = CHILD(n, 1);
            if (n2.type === SYM.IfExpr)
                upper = astForExpr(c, n2);
        }
    }
    else if (NCH(n) > 2) {
        var n2 = CHILD(n, 2);
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
function astForAtomExpr(c, n) {
    var c0 = CHILD(n, 0);
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
            var c1 = CHILD(n, 1);
            if (c1.type === TOK.T_RPAR) {
                return new Tuple([], Load, n.range);
            }
            if (c1.type === SYM.YieldExpr) {
                return astForExpr(c, c1);
            }
            if (NCH(c1) > 1 && CHILD(c1, 1).type === SYM.gen_for) {
                return astForGenexp(c, c1);
            }
            return astForTestlistGexp(c, c1);
        }
        case TOK.T_LSQB: { // list or listcomp
            var c1 = CHILD(n, 1);
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
            var c1 = CHILD(n, 1);
            var N = NCH(c1);
            // var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
            var keys = [];
            var values = [];
            for (var i = 0; i < N; i += 4) {
                keys[i / 4] = astForExpr(c, CHILD(c1, i));
                values[i / 4] = astForExpr(c, CHILD(c1, i + 2));
            }
            return new Dict(keys, values, n.range);
        }
        case TOK.T_BACKQUOTE: {
            throw syntaxError("backquote not supported, use repr()", n.range);
        }
        default: {
            throw new Error("unhandled atom '" + grammarName(c0.type) + "'");
        }
    }
}
function astForPowerExpr(c, node) {
    var n = node;
    REQ(n, SYM.PowerExpr);
    var N = NCH(n);
    var NminusOne = N - 1;
    var e = astForAtomExpr(c, CHILD(n, 0));
    if (N === 1)
        return e;
    for (var i = 1; i < N; ++i) {
        var ch = CHILD(n, i);
        if (ch.type !== SYM.trailer) {
            break;
        }
        e = astForTrailer(c, ch, e);
    }
    if (CHILD(n, NminusOne).type === SYM.UnaryExpr) {
        var f = astForExpr(c, CHILD(n, NminusOne));
        return new BinOp(e, { op: Pow, range: null }, f, n.range);
    }
    else {
        return e;
    }
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
                for (var i = 0; i < NCH(n); i += 2) {
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
                    var ops = [];
                    var cmps = [];
                    for (var i = 1; i < NCH(n); i += 2) {
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
                var exp = null;
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
    return new Print(dest, seq, nl, n.range);
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
export function astFromExpression(n) {
    var c = new Compiling("utf-8");
    return astForExpr(c, n);
}
export function astFromParse(n) {
    var c = new Compiling("utf-8");
    var stmts = [];
    var k = 0;
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
export function astDump(node) {
    var _format = function (node) {
        if (node === null) {
            return "None";
        }
        else if (node['prototype'] && node['prototype']._astname !== undefined && node['prototype']._isenum) {
            // TODO: Replace the _isenum classes with real TypeScript enum.
            // TODO: Why do we have the parens?
            return node['prototype']._astname + "()";
        }
        else if (node['_astname'] !== undefined) {
            var fields = [];
            for (var i = 0; i < node['_fields'].length; i += 2) {
                var a = node['_fields'][i]; // field name
                var b = node['_fields'][i + 1](node); // field getter func
                fields.push([a, _format(b)]);
            }
            var attrs = [];
            for (var i = 0; i < fields.length; ++i) {
                var field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
            }
            var fieldstr = attrs.join(',');
            return node['_astname'] + "(" + fieldstr + ")";
        }
        else if (Array.isArray(node)) {
            var elems = [];
            for (var i = 0; i < node.length; ++i) {
                var x = node[i];
                elems.push(_format(x));
            }
            var elemsstr = elems.join(',');
            return "[" + elemsstr.replace(/^\s+/, '') + "]";
        }
        else {
            var ret = void 0;
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
