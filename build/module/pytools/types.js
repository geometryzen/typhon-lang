import * as tslib_1 from "tslib";
var Load = (function () {
    function Load() {
    }
    return Load;
}());
export { Load };
var Store = (function () {
    function Store() {
    }
    return Store;
}());
export { Store };
var Del = (function () {
    function Del() {
    }
    return Del;
}());
export { Del };
var AugLoad = (function () {
    function AugLoad() {
    }
    return AugLoad;
}());
export { AugLoad };
var AugStore = (function () {
    function AugStore() {
    }
    return AugStore;
}());
export { AugStore };
var Param = (function () {
    function Param() {
    }
    return Param;
}());
export { Param };
var And = (function () {
    function And() {
    }
    return And;
}());
export { And };
var Or = (function () {
    function Or() {
    }
    return Or;
}());
export { Or };
var Add = (function () {
    function Add() {
    }
    return Add;
}());
export { Add };
var Sub = (function () {
    function Sub() {
    }
    return Sub;
}());
export { Sub };
var Mult = (function () {
    function Mult() {
    }
    return Mult;
}());
export { Mult };
var Div = (function () {
    function Div() {
    }
    return Div;
}());
export { Div };
var Mod = (function () {
    function Mod() {
    }
    return Mod;
}());
export { Mod };
var Pow = (function () {
    function Pow() {
    }
    return Pow;
}());
export { Pow };
var LShift = (function () {
    function LShift() {
    }
    return LShift;
}());
export { LShift };
var RShift = (function () {
    function RShift() {
    }
    return RShift;
}());
export { RShift };
var BitOr = (function () {
    function BitOr() {
    }
    return BitOr;
}());
export { BitOr };
var BitXor = (function () {
    function BitXor() {
    }
    return BitXor;
}());
export { BitXor };
var BitAnd = (function () {
    function BitAnd() {
    }
    return BitAnd;
}());
export { BitAnd };
var FloorDiv = (function () {
    function FloorDiv() {
    }
    return FloorDiv;
}());
export { FloorDiv };
var Invert = (function () {
    function Invert() {
    }
    return Invert;
}());
export { Invert };
var Not = (function () {
    function Not() {
    }
    return Not;
}());
export { Not };
var UAdd = (function () {
    function UAdd() {
    }
    return UAdd;
}());
export { UAdd };
var USub = (function () {
    function USub() {
    }
    return USub;
}());
export { USub };
var Eq = (function () {
    function Eq() {
    }
    return Eq;
}());
export { Eq };
var NotEq = (function () {
    function NotEq() {
    }
    return NotEq;
}());
export { NotEq };
var Lt = (function () {
    function Lt() {
    }
    return Lt;
}());
export { Lt };
var LtE = (function () {
    function LtE() {
    }
    return LtE;
}());
export { LtE };
var Gt = (function () {
    function Gt() {
    }
    return Gt;
}());
export { Gt };
var GtE = (function () {
    function GtE() {
    }
    return GtE;
}());
export { GtE };
var Is = (function () {
    function Is() {
    }
    return Is;
}());
export { Is };
var IsNot = (function () {
    function IsNot() {
    }
    return IsNot;
}());
export { IsNot };
var In = (function () {
    function In() {
    }
    return In;
}());
export { In };
var NotIn = (function () {
    function NotIn() {
    }
    return NotIn;
}());
export { NotIn };
var ASTSpan = (function () {
    function ASTSpan() {
        this.minChar = -1; // -1 = "undefined" or "compiler generated"
        this.limChar = -1; // -1 = "undefined" or "compiler generated"
    }
    return ASTSpan;
}());
export { ASTSpan };
var AST = (function (_super) {
    tslib_1.__extends(AST, _super);
    function AST() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AST;
}(ASTSpan));
export { AST };
var ModuleElement = (function (_super) {
    tslib_1.__extends(ModuleElement, _super);
    function ModuleElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ModuleElement;
}(AST));
export { ModuleElement };
var Statement = (function (_super) {
    tslib_1.__extends(Statement, _super);
    function Statement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Statement;
}(ModuleElement));
export { Statement };
var IterationStatement = (function (_super) {
    tslib_1.__extends(IterationStatement, _super);
    function IterationStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IterationStatement;
}(Statement));
export { IterationStatement };
var Module = (function () {
    function Module(body) {
        this.body = body;
    }
    return Module;
}());
export { Module };
var Interactive = (function () {
    function Interactive(body) {
        this.body = body;
    }
    return Interactive;
}());
export { Interactive };
var Expression = (function (_super) {
    tslib_1.__extends(Expression, _super);
    function Expression(body) {
        var _this = _super.call(this) || this;
        _this.body = body;
        return _this;
    }
    return Expression;
}(Statement));
export { Expression };
var UnaryExpression = (function (_super) {
    tslib_1.__extends(UnaryExpression, _super);
    function UnaryExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnaryExpression;
}(Expression));
export { UnaryExpression };
var Suite = (function () {
    function Suite(body) {
        this.body = body;
    }
    return Suite;
}());
export { Suite };
var FunctionDef = (function (_super) {
    tslib_1.__extends(FunctionDef, _super);
    function FunctionDef(name, args, body, decorator_list, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.args = args;
        _this.body = body;
        _this.decorator_list = decorator_list;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return FunctionDef;
}(Statement));
export { FunctionDef };
var ClassDef = (function (_super) {
    tslib_1.__extends(ClassDef, _super);
    function ClassDef(name, bases, body, decorator_list, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.bases = bases;
        _this.body = body;
        _this.decorator_list = decorator_list;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return ClassDef;
}(Statement));
export { ClassDef };
var ReturnStatement = (function (_super) {
    tslib_1.__extends(ReturnStatement, _super);
    function ReturnStatement(value, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.value = value;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return ReturnStatement;
}(Statement));
export { ReturnStatement };
var DeleteExpression = (function (_super) {
    tslib_1.__extends(DeleteExpression, _super);
    function DeleteExpression(targets, lineno, col_offset) {
        var _this = _super.call(this, targets) || this;
        _this.targets = targets;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return DeleteExpression;
}(UnaryExpression));
export { DeleteExpression };
var Assign = (function (_super) {
    tslib_1.__extends(Assign, _super);
    function Assign(targets, value, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.targets = targets;
        _this.value = value;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return Assign;
}(Statement));
export { Assign };
var AugAssign = (function (_super) {
    tslib_1.__extends(AugAssign, _super);
    function AugAssign(target, op, value, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.op = op;
        _this.value = value;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return AugAssign;
}(Statement));
export { AugAssign };
var Print = (function (_super) {
    tslib_1.__extends(Print, _super);
    function Print(dest, values, nl, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.dest = dest;
        _this.values = values;
        _this.nl = nl;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return Print;
}(Statement));
export { Print };
var ForStatement = (function (_super) {
    tslib_1.__extends(ForStatement, _super);
    function ForStatement(target, iter, body, orelse, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.iter = iter;
        _this.body = body;
        _this.orelse = orelse;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return ForStatement;
}(IterationStatement));
export { ForStatement };
var WhileStatement = (function (_super) {
    tslib_1.__extends(WhileStatement, _super);
    function WhileStatement(test, body, orelse, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.test = test;
        _this.body = body;
        _this.orelse = orelse;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return WhileStatement;
}(IterationStatement));
export { WhileStatement };
var IfStatement = (function (_super) {
    tslib_1.__extends(IfStatement, _super);
    function IfStatement(test, consequent, alternate, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.test = test;
        _this.consequent = consequent;
        _this.alternate = alternate;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return IfStatement;
}(Statement));
export { IfStatement };
var WithStatement = (function (_super) {
    tslib_1.__extends(WithStatement, _super);
    function WithStatement(context_expr, optional_vars, body, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.context_expr = context_expr;
        _this.optional_vars = optional_vars;
        _this.body = body;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return WithStatement;
}(Statement));
export { WithStatement };
var Raise = (function (_super) {
    tslib_1.__extends(Raise, _super);
    function Raise(type, inst, tback, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.inst = inst;
        _this.tback = tback;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return Raise;
}(Statement));
export { Raise };
var TryExcept = (function (_super) {
    tslib_1.__extends(TryExcept, _super);
    function TryExcept(body, handlers, orelse, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.body = body;
        _this.handlers = handlers;
        _this.orelse = orelse;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return TryExcept;
}(Statement));
export { TryExcept };
var TryFinally = (function (_super) {
    tslib_1.__extends(TryFinally, _super);
    function TryFinally(body, finalbody, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.body = body;
        _this.finalbody = finalbody;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return TryFinally;
}(Statement));
export { TryFinally };
var Assert = (function (_super) {
    tslib_1.__extends(Assert, _super);
    function Assert(test, msg, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.test = test;
        _this.msg = msg;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return Assert;
}(Statement));
export { Assert };
var ImportStatement = (function (_super) {
    tslib_1.__extends(ImportStatement, _super);
    function ImportStatement(names, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.names = names;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return ImportStatement;
}(Statement));
export { ImportStatement };
var ImportFrom = (function (_super) {
    tslib_1.__extends(ImportFrom, _super);
    function ImportFrom(module, names, level, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.module = module;
        _this.names = names;
        _this.level = level;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return ImportFrom;
}(Statement));
export { ImportFrom };
var Exec = (function () {
    function Exec(body, globals, locals, lineno, col_offset) {
        this.body = body;
        this.globals = globals;
        this.locals = locals;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Exec;
}());
export { Exec };
var Global = (function () {
    function Global(names, lineno, col_offset) {
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Global;
}());
export { Global };
var NonLocal = (function () {
    function NonLocal(names, lineno, col_offset) {
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return NonLocal;
}());
export { NonLocal };
var Expr = (function (_super) {
    tslib_1.__extends(Expr, _super);
    function Expr(value, lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.value = value;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return Expr;
}(Statement));
export { Expr };
var Pass = (function () {
    function Pass(lineno, col_offset) {
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Pass;
}());
export { Pass };
var BreakStatement = (function (_super) {
    tslib_1.__extends(BreakStatement, _super);
    function BreakStatement(lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return BreakStatement;
}(Statement));
export { BreakStatement };
var ContinueStatement = (function (_super) {
    tslib_1.__extends(ContinueStatement, _super);
    function ContinueStatement(lineno, col_offset) {
        var _this = _super.call(this) || this;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return ContinueStatement;
}(Statement));
export { ContinueStatement };
var BoolOp = (function () {
    function BoolOp(op, values, lineno, col_offset) {
        this.op = op;
        this.values = values;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return BoolOp;
}());
export { BoolOp };
var BinOp = (function () {
    function BinOp(left, op, right, lineno, col_offset) {
        this.left = left;
        this.op = op;
        this.right = right;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return BinOp;
}());
export { BinOp };
var UnaryOp = (function () {
    function UnaryOp(op, operand, lineno, col_offset) {
        this.op = op;
        this.operand = operand;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return UnaryOp;
}());
export { UnaryOp };
var Lambda = (function () {
    function Lambda(args, body, lineno, col_offset) {
        this.args = args;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Lambda;
}());
export { Lambda };
var IfExp = (function () {
    function IfExp(test, body, orelse, lineno, col_offset) {
        this.test = test;
        this.body = body;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return IfExp;
}());
export { IfExp };
var Dict = (function () {
    function Dict(keys, values, lineno, col_offset) {
        this.keys = keys;
        this.values = values;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Dict;
}());
export { Dict };
var ListComp = (function () {
    function ListComp(elt, generators, lineno, col_offset) {
        this.elt = elt;
        this.generators = generators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return ListComp;
}());
export { ListComp };
var GeneratorExp = (function () {
    function GeneratorExp(elt, generators, lineno, col_offset) {
        this.elt = elt;
        this.generators = generators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return GeneratorExp;
}());
export { GeneratorExp };
var Yield = (function () {
    function Yield(value, lineno, col_offset) {
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Yield;
}());
export { Yield };
var Compare = (function () {
    function Compare(left, ops, comparators, lineno, col_offset) {
        this.left = left;
        this.ops = ops;
        this.comparators = comparators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Compare;
}());
export { Compare };
var Call = (function () {
    function Call(func, args, keywords, starargs, kwargs, lineno, col_offset) {
        this.func = func;
        this.args = args;
        this.keywords = keywords;
        this.starargs = starargs;
        this.kwargs = kwargs;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Call;
}());
export { Call };
var Num = (function () {
    function Num(n, lineno, col_offset) {
        this.n = n;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Num;
}());
export { Num };
var Str = (function () {
    function Str(s, lineno, col_offset) {
        this.s = s;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Str;
}());
export { Str };
var Attribute = (function () {
    function Attribute(value, attr, ctx, lineno, col_offset) {
        this.value = value;
        this.attr = attr;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Attribute;
}());
export { Attribute };
var Subscript = (function () {
    function Subscript(value, slice, ctx, lineno, col_offset) {
        this.value = value;
        this.slice = slice;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Subscript;
}());
export { Subscript };
var Name = (function (_super) {
    tslib_1.__extends(Name, _super);
    function Name(id, ctx, lineno, col_offset) {
        var _this = _super.call(this, void 0) || this;
        _this.id = id;
        _this.ctx = ctx;
        _this.lineno = lineno;
        _this.col_offset = col_offset;
        return _this;
    }
    return Name;
}(Expression));
export { Name };
var List = (function () {
    function List(elts, ctx, lineno, col_offset) {
        this.elts = elts;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return List;
}());
export { List };
var Tuple = (function () {
    function Tuple(elts, ctx, lineno, col_offset) {
        this.elts = elts;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return Tuple;
}());
export { Tuple };
var Ellipsis = (function () {
    function Ellipsis() {
        // Do nothing yet.
    }
    return Ellipsis;
}());
export { Ellipsis };
var Slice = (function () {
    function Slice(lower, upper, step) {
        this.lower = lower;
        this.upper = upper;
        this.step = step;
    }
    return Slice;
}());
export { Slice };
var ExtSlice = (function () {
    function ExtSlice(dims) {
        this.dims = dims;
    }
    return ExtSlice;
}());
export { ExtSlice };
var Index = (function () {
    function Index(value) {
        this.value = value;
    }
    return Index;
}());
export { Index };
var Comprehension = (function () {
    function Comprehension(target, iter, ifs) {
        this.target = target;
        this.iter = iter;
        this.ifs = ifs;
    }
    return Comprehension;
}());
export { Comprehension };
var ExceptHandler = (function () {
    function ExceptHandler(type, name, body, lineno, col_offset) {
        this.type = type;
        this.name = name;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
    return ExceptHandler;
}());
export { ExceptHandler };
var Arguments = (function () {
    function Arguments(args, vararg, kwarg, defaults) {
        this.args = args;
        this.vararg = vararg;
        this.kwarg = kwarg;
        this.defaults = defaults;
    }
    return Arguments;
}());
export { Arguments };
var Keyword = (function () {
    function Keyword(arg, value) {
        this.arg = arg;
        this.value = value;
    }
    return Keyword;
}());
export { Keyword };
var Alias = (function () {
    function Alias(name, asname) {
        this.name = name;
        this.asname = asname;
    }
    return Alias;
}());
export { Alias };
Module.prototype['_astname'] = 'Module';
Module.prototype['_fields'] = [
    'body', function (n) { return n.body; }
];
Interactive.prototype['_astname'] = 'Interactive';
Interactive.prototype['_fields'] = [
    'body', function (n) { return n.body; }
];
Expression.prototype['_astname'] = 'Expression';
Expression.prototype['_fields'] = [
    'body', function (n) { return n.body; }
];
Suite.prototype['_astname'] = 'Suite';
Suite.prototype['_fields'] = [
    'body', function (n) { return n.body; }
];
FunctionDef.prototype['_astname'] = 'FunctionDef';
FunctionDef.prototype['_fields'] = [
    'name', function (n) { return n.name; },
    'args', function (n) { return n.args; },
    'body', function (n) { return n.body; },
    'decorator_list', function (n) { return n.decorator_list; }
];
ClassDef.prototype['_astname'] = 'ClassDef';
ClassDef.prototype['_fields'] = [
    'name', function (n) { return n.name; },
    'bases', function (n) { return n.bases; },
    'body', function (n) { return n.body; },
    'decorator_list', function (n) { return n.decorator_list; }
];
ReturnStatement.prototype['_astname'] = 'ReturnStatement';
ReturnStatement.prototype['_fields'] = [
    'value', function (n) { return n.value; }
];
DeleteExpression.prototype['_astname'] = 'Delete';
DeleteExpression.prototype['_fields'] = [
    'targets', function (n) { return n.targets; }
];
Assign.prototype['_astname'] = 'Assign';
Assign.prototype['_fields'] = [
    'targets', function (n) { return n.targets; },
    'value', function (n) { return n.value; }
];
AugAssign.prototype['_astname'] = 'AugAssign';
AugAssign.prototype['_fields'] = [
    'target', function (n) { return n.target; },
    'op', function (n) { return n.op; },
    'value', function (n) { return n.value; }
];
Print.prototype['_astname'] = 'Print';
Print.prototype['_fields'] = [
    'dest', function (n) { return n.dest; },
    'values', function (n) { return n.values; },
    'nl', function (n) { return n.nl; }
];
ForStatement.prototype['_astname'] = 'ForStatement';
ForStatement.prototype['_fields'] = [
    'target', function (n) { return n.target; },
    'iter', function (n) { return n.iter; },
    'body', function (n) { return n.body; },
    'orelse', function (n) { return n.orelse; }
];
WhileStatement.prototype['_astname'] = 'WhileStatement';
WhileStatement.prototype['_fields'] = [
    'test', function (n) { return n.test; },
    'body', function (n) { return n.body; },
    'orelse', function (n) { return n.orelse; }
];
IfStatement.prototype['_astname'] = 'IfStatement';
IfStatement.prototype['_fields'] = [
    'test', function (n) { return n.test; },
    'consequent', function (n) { return n.consequent; },
    'alternate', function (n) { return n.alternate; }
];
WithStatement.prototype['_astname'] = 'WithStatement';
WithStatement.prototype['_fields'] = [
    'context_expr', function (n) { return n.context_expr; },
    'optional_vars', function (n) { return n.optional_vars; },
    'body', function (n) { return n.body; }
];
Raise.prototype['_astname'] = 'Raise';
Raise.prototype['_fields'] = [
    'type', function (n) { return n.type; },
    'inst', function (n) { return n.inst; },
    'tback', function (n) { return n.tback; }
];
TryExcept.prototype['_astname'] = 'TryExcept';
TryExcept.prototype['_fields'] = [
    'body', function (n) { return n.body; },
    'handlers', function (n) { return n.handlers; },
    'orelse', function (n) { return n.orelse; }
];
TryFinally.prototype['_astname'] = 'TryFinally';
TryFinally.prototype['_fields'] = [
    'body', function (n) { return n.body; },
    'finalbody', function (n) { return n.finalbody; }
];
Assert.prototype['_astname'] = 'Assert';
Assert.prototype['_fields'] = [
    'test', function (n) { return n.test; },
    'msg', function (n) { return n.msg; }
];
ImportStatement.prototype['_astname'] = 'Import';
ImportStatement.prototype['_fields'] = [
    'names', function (n) { return n.names; }
];
ImportFrom.prototype['_astname'] = 'ImportFrom';
ImportFrom.prototype['_fields'] = [
    'module', function (n) { return n.module; },
    'names', function (n) { return n.names; },
    'level', function (n) { return n.level; }
];
Exec.prototype['_astname'] = 'Exec';
Exec.prototype['_fields'] = [
    'body', function (n) { return n.body; },
    'globals', function (n) { return n.globals; },
    'locals', function (n) { return n.locals; }
];
Global.prototype['_astname'] = 'Global';
Global.prototype['_fields'] = [
    'names', function (n) { return n.names; }
];
NonLocal.prototype['_astname'] = 'NonLocal';
NonLocal.prototype['_fields'] = [
    'names', function (n) { return n.names; }
];
Expr.prototype['_astname'] = 'Expr';
Expr.prototype['_fields'] = [
    'value', function (n) { return n.value; }
];
Pass.prototype['_astname'] = 'Pass';
Pass.prototype['_fields'] = [];
BreakStatement.prototype['_astname'] = 'BreakStatement';
BreakStatement.prototype['_fields'] = [];
ContinueStatement.prototype['_astname'] = 'ContinueStatement';
ContinueStatement.prototype['_fields'] = [];
BoolOp.prototype['_astname'] = 'BoolOp';
BoolOp.prototype['_fields'] = [
    'op', function (n) { return n.op; },
    'values', function (n) { return n.values; }
];
BinOp.prototype['_astname'] = 'BinOp';
BinOp.prototype['_fields'] = [
    'left', function (n) { return n.left; },
    'op', function (n) { return n.op; },
    'right', function (n) { return n.right; }
];
UnaryOp.prototype['_astname'] = 'UnaryOp';
UnaryOp.prototype['_fields'] = [
    'op', function (n) { return n.op; },
    'operand', function (n) { return n.operand; }
];
Lambda.prototype['_astname'] = 'Lambda';
Lambda.prototype['_fields'] = [
    'args', function (n) { return n.args; },
    'body', function (n) { return n.body; }
];
IfExp.prototype['_astname'] = 'IfExp';
IfExp.prototype['_fields'] = [
    'test', function (n) { return n.test; },
    'body', function (n) { return n.body; },
    'orelse', function (n) { return n.orelse; }
];
Dict.prototype['_astname'] = 'Dict';
Dict.prototype['_fields'] = [
    'keys', function (n) { return n.keys; },
    'values', function (n) { return n.values; }
];
ListComp.prototype['_astname'] = 'ListComp';
ListComp.prototype['_fields'] = [
    'elt', function (n) { return n.elt; },
    'generators', function (n) { return n.generators; }
];
GeneratorExp.prototype['_astname'] = 'GeneratorExp';
GeneratorExp.prototype['_fields'] = [
    'elt', function (n) { return n.elt; },
    'generators', function (n) { return n.generators; }
];
Yield.prototype['_astname'] = 'Yield';
Yield.prototype['_fields'] = [
    'value', function (n) { return n.value; }
];
Compare.prototype['_astname'] = 'Compare';
Compare.prototype['_fields'] = [
    'left', function (n) { return n.left; },
    'ops', function (n) { return n.ops; },
    'comparators', function (n) { return n.comparators; }
];
Call.prototype['_astname'] = 'Call';
Call.prototype['_fields'] = [
    'func', function (n) { return n.func; },
    'args', function (n) { return n.args; },
    'keywords', function (n) { return n.keywords; },
    'starargs', function (n) { return n.starargs; },
    'kwargs', function (n) { return n.kwargs; }
];
Num.prototype['_astname'] = 'Num';
Num.prototype['_fields'] = [
    'n', function (n) { return n.n; }
];
Str.prototype['_astname'] = 'Str';
Str.prototype['_fields'] = [
    's', function (n) { return n.s; }
];
Attribute.prototype['_astname'] = 'Attribute';
Attribute.prototype['_fields'] = [
    'value', function (n) { return n.value; },
    'attr', function (n) { return n.attr; },
    'ctx', function (n) { return n.ctx; }
];
Subscript.prototype['_astname'] = 'Subscript';
Subscript.prototype['_fields'] = [
    'value', function (n) { return n.value; },
    'slice', function (n) { return n.slice; },
    'ctx', function (n) { return n.ctx; }
];
Name.prototype['_astname'] = 'Name';
Name.prototype['_fields'] = [
    'id', function (n) { return n.id; },
    'ctx', function (n) { return n.ctx; }
];
List.prototype['_astname'] = 'List';
List.prototype['_fields'] = [
    'elts', function (n) { return n.elts; },
    'ctx', function (n) { return n.ctx; }
];
Tuple.prototype['_astname'] = 'Tuple';
Tuple.prototype['_fields'] = [
    'elts', function (n) { return n.elts; },
    'ctx', function (n) { return n.ctx; }
];
Load.prototype['_astname'] = 'Load';
Load.prototype['_isenum'] = true;
Store.prototype['_astname'] = 'Store';
Store.prototype['_isenum'] = true;
Del.prototype['_astname'] = 'Del';
Del.prototype['_isenum'] = true;
AugLoad.prototype['_astname'] = 'AugLoad';
AugLoad.prototype['_isenum'] = true;
AugStore.prototype['_astname'] = 'AugStore';
AugStore.prototype['_isenum'] = true;
Param.prototype['_astname'] = 'Param';
Param.prototype['_isenum'] = true;
Ellipsis.prototype['_astname'] = 'Ellipsis';
Ellipsis.prototype['_fields'] = [];
Slice.prototype['_astname'] = 'Slice';
Slice.prototype['_fields'] = [
    'lower', function (n) { return n.lower; },
    'upper', function (n) { return n.upper; },
    'step', function (n) { return n.step; }
];
ExtSlice.prototype['_astname'] = 'ExtSlice';
ExtSlice.prototype['_fields'] = [
    'dims', function (n) { return n.dims; }
];
Index.prototype['_astname'] = 'Index';
Index.prototype['_fields'] = [
    'value', function (n) { return n.value; }
];
And.prototype['_astname'] = 'And';
And.prototype['_isenum'] = true;
Or.prototype['_astname'] = 'Or';
Or.prototype['_isenum'] = true;
Add.prototype['_astname'] = 'Add';
Add.prototype['_isenum'] = true;
Sub.prototype['_astname'] = 'Sub';
Sub.prototype['_isenum'] = true;
Mult.prototype['_astname'] = 'Mult';
Mult.prototype['_isenum'] = true;
Div.prototype['_astname'] = 'Div';
Div.prototype['_isenum'] = true;
Mod.prototype['_astname'] = 'Mod';
Mod.prototype['_isenum'] = true;
Pow.prototype['_astname'] = 'Pow';
Pow.prototype['_isenum'] = true;
LShift.prototype['_astname'] = 'LShift';
LShift.prototype['_isenum'] = true;
RShift.prototype['_astname'] = 'RShift';
RShift.prototype['_isenum'] = true;
BitOr.prototype['_astname'] = 'BitOr';
BitOr.prototype['_isenum'] = true;
BitXor.prototype['_astname'] = 'BitXor';
BitXor.prototype['_isenum'] = true;
BitAnd.prototype['_astname'] = 'BitAnd';
BitAnd.prototype['_isenum'] = true;
FloorDiv.prototype['_astname'] = 'FloorDiv';
FloorDiv.prototype['_isenum'] = true;
Invert.prototype['_astname'] = 'Invert';
Invert.prototype['_isenum'] = true;
Not.prototype['_astname'] = 'Not';
Not.prototype['_isenum'] = true;
UAdd.prototype['_astname'] = 'UAdd';
UAdd.prototype['_isenum'] = true;
USub.prototype['_astname'] = 'USub';
USub.prototype['_isenum'] = true;
Eq.prototype['_astname'] = 'Eq';
Eq.prototype['_isenum'] = true;
NotEq.prototype['_astname'] = 'NotEq';
NotEq.prototype['_isenum'] = true;
Lt.prototype['_astname'] = 'Lt';
Lt.prototype['_isenum'] = true;
LtE.prototype['_astname'] = 'LtE';
LtE.prototype['_isenum'] = true;
Gt.prototype['_astname'] = 'Gt';
Gt.prototype['_isenum'] = true;
GtE.prototype['_astname'] = 'GtE';
GtE.prototype['_isenum'] = true;
Is.prototype['_astname'] = 'Is';
Is.prototype['_isenum'] = true;
IsNot.prototype['_astname'] = 'IsNot';
IsNot.prototype['_isenum'] = true;
In.prototype['_astname'] = 'In';
In.prototype['_isenum'] = true;
NotIn.prototype['_astname'] = 'NotIn';
NotIn.prototype['_isenum'] = true;
Comprehension.prototype['_astname'] = 'Comprehension';
Comprehension.prototype['_fields'] = [
    'target', function (n) { return n.target; },
    'iter', function (n) { return n.iter; },
    'ifs', function (n) { return n.ifs; }
];
ExceptHandler.prototype['_astname'] = 'ExceptHandler';
ExceptHandler.prototype['_fields'] = [
    'type', function (n) { return n.type; },
    'name', function (n) { return n.name; },
    'body', function (n) { return n.body; }
];
Arguments.prototype['_astname'] = 'Arguments';
Arguments.prototype['_fields'] = [
    'args', function (n) { return n.args; },
    'vararg', function (n) { return n.vararg; },
    'kwarg', function (n) { return n.kwarg; },
    'defaults', function (n) { return n.defaults; }
];
Keyword.prototype['_astname'] = 'Keyword';
Keyword.prototype['_fields'] = [
    'arg', function (n) { return n.arg; },
    'value', function (n) { return n.value; }
];
Alias.prototype['_astname'] = 'Alias';
Alias.prototype['_fields'] = [
    'name', function (n) { return n.name; },
    'asname', function (n) { return n.asname; }
];
