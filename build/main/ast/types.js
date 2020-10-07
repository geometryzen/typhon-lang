"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alias = exports.Keyword = exports.Arguments = exports.ExceptHandler = exports.Comprehension = exports.Index = exports.ExtSlice = exports.Slice = exports.Ellipsis = exports.Tuple = exports.List = exports.Name = exports.Subscript = exports.Attribute = exports.Str = exports.Num = exports.Call = exports.Compare = exports.Yield = exports.GeneratorExp = exports.ListComp = exports.Dict = exports.IfExp = exports.Lambda = exports.UnaryOp = exports.BinOp = exports.BoolOp = exports.ContinueStatement = exports.BreakStatement = exports.Pass = exports.ExpressionStatement = exports.NonLocal = exports.Global = exports.Exec = exports.ImportFrom = exports.ImportStatement = exports.Assert = exports.TryFinally = exports.TryExcept = exports.Raise = exports.WithStatement = exports.IfStatement = exports.WhileStatement = exports.ForStatement = exports.Print = exports.AnnAssign = exports.AugAssign = exports.Assign = exports.DeleteStatement = exports.ReturnStatement = exports.ClassDef = exports.FunctionParamDef = exports.FunctionDef = exports.Suite = exports.UnaryExpression = exports.Interactive = exports.Module = exports.IterationStatement = exports.Statement = exports.Expression = exports.RangeAnnotated = exports.NotIn = exports.In = exports.IsNot = exports.Is = exports.GtE = exports.Gt = exports.LtE = exports.Lt = exports.NotEq = exports.Eq = exports.USub = exports.UAdd = exports.Not = exports.Invert = exports.FloorDiv = exports.BitAnd = exports.BitXor = exports.BitOr = exports.RShift = exports.LShift = exports.Pow = exports.Mod = exports.Div = exports.Mult = exports.Sub = exports.Add = exports.Or = exports.And = exports.Param = exports.AugStore = exports.AugLoad = exports.Del = exports.Store = exports.Load = void 0;
var tslib_1 = require("tslib");
//
// This module is at the bottom.
// It should only import modules that don't introduce circularity.
//
var asserts_1 = require("../common/asserts");
var Load = /** @class */ (function () {
    function Load() {
    }
    return Load;
}());
exports.Load = Load;
var Store = /** @class */ (function () {
    function Store() {
    }
    return Store;
}());
exports.Store = Store;
var Del = /** @class */ (function () {
    function Del() {
    }
    return Del;
}());
exports.Del = Del;
var AugLoad = /** @class */ (function () {
    function AugLoad() {
    }
    return AugLoad;
}());
exports.AugLoad = AugLoad;
var AugStore = /** @class */ (function () {
    function AugStore() {
    }
    return AugStore;
}());
exports.AugStore = AugStore;
var Param = /** @class */ (function () {
    function Param() {
    }
    return Param;
}());
exports.Param = Param;
var And = /** @class */ (function () {
    function And() {
    }
    return And;
}());
exports.And = And;
var Or = /** @class */ (function () {
    function Or() {
    }
    return Or;
}());
exports.Or = Or;
var Add = /** @class */ (function () {
    function Add() {
    }
    return Add;
}());
exports.Add = Add;
var Sub = /** @class */ (function () {
    function Sub() {
    }
    return Sub;
}());
exports.Sub = Sub;
var Mult = /** @class */ (function () {
    function Mult() {
    }
    return Mult;
}());
exports.Mult = Mult;
var Div = /** @class */ (function () {
    function Div() {
    }
    return Div;
}());
exports.Div = Div;
var Mod = /** @class */ (function () {
    function Mod() {
    }
    return Mod;
}());
exports.Mod = Mod;
var Pow = /** @class */ (function () {
    function Pow() {
    }
    return Pow;
}());
exports.Pow = Pow;
var LShift = /** @class */ (function () {
    function LShift() {
    }
    return LShift;
}());
exports.LShift = LShift;
var RShift = /** @class */ (function () {
    function RShift() {
    }
    return RShift;
}());
exports.RShift = RShift;
var BitOr = /** @class */ (function () {
    function BitOr() {
    }
    return BitOr;
}());
exports.BitOr = BitOr;
var BitXor = /** @class */ (function () {
    function BitXor() {
    }
    return BitXor;
}());
exports.BitXor = BitXor;
var BitAnd = /** @class */ (function () {
    function BitAnd() {
    }
    return BitAnd;
}());
exports.BitAnd = BitAnd;
var FloorDiv = /** @class */ (function () {
    function FloorDiv() {
    }
    return FloorDiv;
}());
exports.FloorDiv = FloorDiv;
var Invert = /** @class */ (function () {
    function Invert() {
    }
    return Invert;
}());
exports.Invert = Invert;
var Not = /** @class */ (function () {
    function Not() {
    }
    return Not;
}());
exports.Not = Not;
var UAdd = /** @class */ (function () {
    function UAdd() {
    }
    return UAdd;
}());
exports.UAdd = UAdd;
var USub = /** @class */ (function () {
    function USub() {
    }
    return USub;
}());
exports.USub = USub;
var Eq = /** @class */ (function () {
    function Eq() {
    }
    return Eq;
}());
exports.Eq = Eq;
var NotEq = /** @class */ (function () {
    function NotEq() {
    }
    return NotEq;
}());
exports.NotEq = NotEq;
var Lt = /** @class */ (function () {
    function Lt() {
    }
    return Lt;
}());
exports.Lt = Lt;
var LtE = /** @class */ (function () {
    function LtE() {
    }
    return LtE;
}());
exports.LtE = LtE;
var Gt = /** @class */ (function () {
    function Gt() {
    }
    return Gt;
}());
exports.Gt = Gt;
var GtE = /** @class */ (function () {
    function GtE() {
    }
    return GtE;
}());
exports.GtE = GtE;
var Is = /** @class */ (function () {
    function Is() {
    }
    return Is;
}());
exports.Is = Is;
var IsNot = /** @class */ (function () {
    function IsNot() {
    }
    return IsNot;
}());
exports.IsNot = IsNot;
var In = /** @class */ (function () {
    function In() {
    }
    return In;
}());
exports.In = In;
var NotIn = /** @class */ (function () {
    function NotIn() {
    }
    return NotIn;
}());
exports.NotIn = NotIn;
var RangeAnnotated = /** @class */ (function () {
    function RangeAnnotated(value, range) {
        this.value = value;
        this.range = range;
        asserts_1.assert(typeof value !== 'undefined', "value must be defined.");
    }
    return RangeAnnotated;
}());
exports.RangeAnnotated = RangeAnnotated;
var Expression = /** @class */ (function () {
    function Expression() {
        // Do noting yet.
    }
    Expression.prototype.accept = function (visitor) {
        // accept must be implemented by derived classes.
        throw new Error("\"Expression.accept\" is not implemented.");
    };
    return Expression;
}());
exports.Expression = Expression;
var Statement = /** @class */ (function () {
    function Statement() {
    }
    Statement.prototype.accept = function (visitor) {
        // accept must be implemented by derived classes.
        throw new Error("\"Statement.accept\" is not implemented.");
    };
    return Statement;
}());
exports.Statement = Statement;
var IterationStatement = /** @class */ (function (_super) {
    tslib_1.__extends(IterationStatement, _super);
    function IterationStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IterationStatement;
}(Statement));
exports.IterationStatement = IterationStatement;
var Module = /** @class */ (function () {
    function Module(body) {
        this.body = body;
    }
    Module.prototype.accept = function (visitor) {
        visitor.module(this);
    };
    return Module;
}());
exports.Module = Module;
var Interactive = /** @class */ (function () {
    function Interactive(body) {
        this.body = body;
    }
    return Interactive;
}());
exports.Interactive = Interactive;
var UnaryExpression = /** @class */ (function (_super) {
    tslib_1.__extends(UnaryExpression, _super);
    function UnaryExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnaryExpression;
}(Expression));
exports.UnaryExpression = UnaryExpression;
var Suite = /** @class */ (function () {
    function Suite(body) {
        this.body = body;
    }
    return Suite;
}());
exports.Suite = Suite;
var FunctionDef = /** @class */ (function (_super) {
    tslib_1.__extends(FunctionDef, _super);
    function FunctionDef(name, args, body, returnType, decorator_list, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.name = name;
        _this.args = args;
        _this.body = body;
        _this.decorator_list = decorator_list;
        _this.returnType = returnType;
        return _this;
    }
    FunctionDef.prototype.accept = function (visitor) {
        visitor.functionDef(this);
    };
    return FunctionDef;
}(Statement));
exports.FunctionDef = FunctionDef;
var FunctionParamDef = /** @class */ (function () {
    function FunctionParamDef(name, type) {
        this.name = name;
        if (type) {
            this.type = type;
        }
        else {
            this.type = null;
        }
    }
    return FunctionParamDef;
}());
exports.FunctionParamDef = FunctionParamDef;
var ClassDef = /** @class */ (function (_super) {
    tslib_1.__extends(ClassDef, _super);
    function ClassDef(name, bases, body, decorator_list, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.name = name;
        _this.bases = bases;
        _this.body = body;
        _this.decorator_list = decorator_list;
        return _this;
    }
    ClassDef.prototype.accept = function (visitor) {
        visitor.classDef(this);
    };
    return ClassDef;
}(Statement));
exports.ClassDef = ClassDef;
var ReturnStatement = /** @class */ (function (_super) {
    tslib_1.__extends(ReturnStatement, _super);
    function ReturnStatement(value, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.value = value;
        return _this;
    }
    ReturnStatement.prototype.accept = function (visitor) {
        visitor.returnStatement(this);
    };
    return ReturnStatement;
}(Statement));
exports.ReturnStatement = ReturnStatement;
var DeleteStatement = /** @class */ (function (_super) {
    tslib_1.__extends(DeleteStatement, _super);
    function DeleteStatement(targets, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.targets = targets;
        return _this;
    }
    return DeleteStatement;
}(Statement));
exports.DeleteStatement = DeleteStatement;
var Assign = /** @class */ (function (_super) {
    tslib_1.__extends(Assign, _super);
    function Assign(targets, value, range, eqRange, type) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.eqRange = eqRange;
        _this.targets = targets;
        _this.value = value;
        if (type) {
            _this.type = type;
        }
        return _this;
    }
    Assign.prototype.accept = function (visitor) {
        visitor.assign(this);
    };
    return Assign;
}(Statement));
exports.Assign = Assign;
var AugAssign = /** @class */ (function (_super) {
    tslib_1.__extends(AugAssign, _super);
    function AugAssign(target, op, value, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.target = target;
        _this.op = op;
        _this.value = value;
        return _this;
    }
    return AugAssign;
}(Statement));
exports.AugAssign = AugAssign;
var AnnAssign = /** @class */ (function (_super) {
    tslib_1.__extends(AnnAssign, _super);
    function AnnAssign(type, target, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.value = type;
        _this.target = target;
        return _this;
    }
    AnnAssign.prototype.accept = function (visitor) {
        visitor.annAssign(this);
    };
    return AnnAssign;
}(Statement));
exports.AnnAssign = AnnAssign;
var Print = /** @class */ (function (_super) {
    tslib_1.__extends(Print, _super);
    function Print(dest, values, nl, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.dest = dest;
        _this.values = values;
        _this.nl = nl;
        return _this;
    }
    Print.prototype.accept = function (visitor) {
        visitor.print(this);
    };
    return Print;
}(Statement));
exports.Print = Print;
var ForStatement = /** @class */ (function (_super) {
    tslib_1.__extends(ForStatement, _super);
    function ForStatement(target, iter, body, orelse, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.target = target;
        _this.iter = iter;
        _this.body = body;
        _this.orelse = orelse;
        return _this;
    }
    ForStatement.prototype.accept = function (visitor) {
        visitor.forStatement(this);
    };
    return ForStatement;
}(Statement));
exports.ForStatement = ForStatement;
var WhileStatement = /** @class */ (function (_super) {
    tslib_1.__extends(WhileStatement, _super);
    function WhileStatement(test, body, orelse, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.test = test;
        _this.body = body;
        _this.orelse = orelse;
        return _this;
    }
    return WhileStatement;
}(IterationStatement));
exports.WhileStatement = WhileStatement;
var IfStatement = /** @class */ (function (_super) {
    tslib_1.__extends(IfStatement, _super);
    function IfStatement(test, consequent, alternate, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.test = test;
        _this.consequent = consequent;
        _this.alternate = alternate;
        return _this;
    }
    IfStatement.prototype.accept = function (visitor) {
        visitor.ifStatement(this);
    };
    return IfStatement;
}(Statement));
exports.IfStatement = IfStatement;
var WithStatement = /** @class */ (function (_super) {
    tslib_1.__extends(WithStatement, _super);
    function WithStatement(context_expr, optional_vars, body, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.context_expr = context_expr;
        _this.optional_vars = optional_vars;
        _this.body = body;
        return _this;
    }
    return WithStatement;
}(Statement));
exports.WithStatement = WithStatement;
var Raise = /** @class */ (function (_super) {
    tslib_1.__extends(Raise, _super);
    function Raise(type, inst, tback, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.type = type;
        _this.inst = inst;
        _this.tback = tback;
        return _this;
    }
    return Raise;
}(Statement));
exports.Raise = Raise;
var TryExcept = /** @class */ (function (_super) {
    tslib_1.__extends(TryExcept, _super);
    function TryExcept(body, handlers, orelse, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.body = body;
        _this.handlers = handlers;
        _this.orelse = orelse;
        return _this;
    }
    return TryExcept;
}(Statement));
exports.TryExcept = TryExcept;
var TryFinally = /** @class */ (function (_super) {
    tslib_1.__extends(TryFinally, _super);
    function TryFinally(body, finalbody, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.body = body;
        _this.finalbody = finalbody;
        return _this;
    }
    return TryFinally;
}(Statement));
exports.TryFinally = TryFinally;
var Assert = /** @class */ (function (_super) {
    tslib_1.__extends(Assert, _super);
    function Assert(test, msg, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.test = test;
        _this.msg = msg;
        return _this;
    }
    return Assert;
}(Statement));
exports.Assert = Assert;
var ImportStatement = /** @class */ (function (_super) {
    tslib_1.__extends(ImportStatement, _super);
    function ImportStatement(names, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.names = names;
        return _this;
    }
    return ImportStatement;
}(Statement));
exports.ImportStatement = ImportStatement;
var ImportFrom = /** @class */ (function (_super) {
    tslib_1.__extends(ImportFrom, _super);
    function ImportFrom(module, names, level, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        asserts_1.assert(typeof module.value === 'string', "module must be a string.");
        asserts_1.assert(Array.isArray(names), "names must be an Array.");
        _this.module = module;
        _this.names = names;
        _this.level = level;
        return _this;
    }
    ImportFrom.prototype.accept = function (visitor) {
        visitor.importFrom(this);
    };
    return ImportFrom;
}(Statement));
exports.ImportFrom = ImportFrom;
var Exec = /** @class */ (function (_super) {
    tslib_1.__extends(Exec, _super);
    function Exec(body, globals, locals, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.body = body;
        _this.globals = globals;
        _this.locals = locals;
        return _this;
    }
    return Exec;
}(Statement));
exports.Exec = Exec;
var Global = /** @class */ (function (_super) {
    tslib_1.__extends(Global, _super);
    function Global(names, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.names = names;
        return _this;
    }
    return Global;
}(Statement));
exports.Global = Global;
var NonLocal = /** @class */ (function (_super) {
    tslib_1.__extends(NonLocal, _super);
    function NonLocal(names, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.names = names;
        return _this;
    }
    return NonLocal;
}(Statement));
exports.NonLocal = NonLocal;
var ExpressionStatement = /** @class */ (function (_super) {
    tslib_1.__extends(ExpressionStatement, _super);
    function ExpressionStatement(value, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.value = value;
        return _this;
    }
    ExpressionStatement.prototype.accept = function (visitor) {
        visitor.expressionStatement(this);
    };
    return ExpressionStatement;
}(Statement));
exports.ExpressionStatement = ExpressionStatement;
var Pass = /** @class */ (function (_super) {
    tslib_1.__extends(Pass, _super);
    function Pass(range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        return _this;
    }
    return Pass;
}(Statement));
exports.Pass = Pass;
var BreakStatement = /** @class */ (function (_super) {
    tslib_1.__extends(BreakStatement, _super);
    function BreakStatement(range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        return _this;
    }
    return BreakStatement;
}(Statement));
exports.BreakStatement = BreakStatement;
var ContinueStatement = /** @class */ (function (_super) {
    tslib_1.__extends(ContinueStatement, _super);
    function ContinueStatement(range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        return _this;
    }
    return ContinueStatement;
}(Statement));
exports.ContinueStatement = ContinueStatement;
var BoolOp = /** @class */ (function (_super) {
    tslib_1.__extends(BoolOp, _super);
    function BoolOp(op, values, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.op = op;
        _this.values = values;
        return _this;
    }
    return BoolOp;
}(Expression));
exports.BoolOp = BoolOp;
var BinOp = /** @class */ (function (_super) {
    tslib_1.__extends(BinOp, _super);
    function BinOp(lhs, ops, rhs, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.lhs = lhs;
        _this.op = ops.op;
        _this.opRange = ops.range;
        _this.rhs = rhs;
        return _this;
    }
    BinOp.prototype.accept = function (visitor) {
        visitor.binOp(this);
    };
    return BinOp;
}(Expression));
exports.BinOp = BinOp;
var UnaryOp = /** @class */ (function (_super) {
    tslib_1.__extends(UnaryOp, _super);
    function UnaryOp(op, operand, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.op = op;
        _this.operand = operand;
        return _this;
    }
    return UnaryOp;
}(Expression));
exports.UnaryOp = UnaryOp;
var Lambda = /** @class */ (function (_super) {
    tslib_1.__extends(Lambda, _super);
    function Lambda(args, body, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.args = args;
        _this.body = body;
        return _this;
    }
    return Lambda;
}(Expression));
exports.Lambda = Lambda;
var IfExp = /** @class */ (function (_super) {
    tslib_1.__extends(IfExp, _super);
    function IfExp(test, body, orelse, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.test = test;
        _this.body = body;
        _this.orelse = orelse;
        return _this;
    }
    return IfExp;
}(Expression));
exports.IfExp = IfExp;
var Dict = /** @class */ (function (_super) {
    tslib_1.__extends(Dict, _super);
    function Dict(keys, values, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.keys = keys;
        _this.values = values;
        return _this;
    }
    Dict.prototype.accept = function (visitor) {
        visitor.dict(this);
    };
    return Dict;
}(Expression));
exports.Dict = Dict;
var ListComp = /** @class */ (function (_super) {
    tslib_1.__extends(ListComp, _super);
    function ListComp(elt, generators, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.elt = elt;
        _this.generators = generators;
        return _this;
    }
    return ListComp;
}(Expression));
exports.ListComp = ListComp;
var GeneratorExp = /** @class */ (function (_super) {
    tslib_1.__extends(GeneratorExp, _super);
    function GeneratorExp(elt, generators, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.elt = elt;
        _this.generators = generators;
        return _this;
    }
    return GeneratorExp;
}(Expression));
exports.GeneratorExp = GeneratorExp;
var Yield = /** @class */ (function (_super) {
    tslib_1.__extends(Yield, _super);
    function Yield(value, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.value = value;
        return _this;
    }
    return Yield;
}(Expression));
exports.Yield = Yield;
var Compare = /** @class */ (function (_super) {
    tslib_1.__extends(Compare, _super);
    function Compare(left, ops, comparators, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.left = left;
        for (var _i = 0, ops_1 = ops; _i < ops_1.length; _i++) {
            var op = ops_1[_i];
            switch (op) {
                case Eq: {
                    break;
                }
                case NotEq: {
                    break;
                }
                case Gt: {
                    break;
                }
                case GtE: {
                    break;
                }
                case Lt: {
                    break;
                }
                case LtE: {
                    break;
                }
                case In: {
                    break;
                }
                case NotIn: {
                    break;
                }
                case Is: {
                    break;
                }
                case IsNot: {
                    break;
                }
                default: {
                    throw new Error("ops must only contain CompareOperator(s) but contains " + op);
                }
            }
        }
        _this.ops = ops;
        _this.comparators = comparators;
        return _this;
    }
    Compare.prototype.accept = function (visitor) {
        visitor.compareExpression(this);
    };
    return Compare;
}(Expression));
exports.Compare = Compare;
var Call = /** @class */ (function (_super) {
    tslib_1.__extends(Call, _super);
    function Call(func, args, keywords, starargs, kwargs) {
        var _this = _super.call(this) || this;
        _this.func = func;
        _this.args = args;
        _this.keywords = keywords;
        _this.starargs = starargs;
        _this.kwargs = kwargs;
        return _this;
    }
    Call.prototype.accept = function (visitor) {
        visitor.callExpression(this);
    };
    return Call;
}(Expression));
exports.Call = Call;
var Num = /** @class */ (function (_super) {
    tslib_1.__extends(Num, _super);
    function Num(n) {
        var _this = _super.call(this) || this;
        _this.n = n;
        return _this;
    }
    Num.prototype.accept = function (visitor) {
        visitor.num(this);
    };
    return Num;
}(Expression));
exports.Num = Num;
var Str = /** @class */ (function (_super) {
    tslib_1.__extends(Str, _super);
    function Str(s) {
        var _this = _super.call(this) || this;
        _this.s = s;
        return _this;
    }
    Str.prototype.accept = function (visitor) {
        visitor.str(this);
    };
    return Str;
}(Expression));
exports.Str = Str;
var Attribute = /** @class */ (function (_super) {
    tslib_1.__extends(Attribute, _super);
    function Attribute(value, attr, ctx, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.value = value;
        _this.attr = attr;
        _this.ctx = ctx;
        return _this;
    }
    Attribute.prototype.accept = function (visitor) {
        visitor.attribute(this);
    };
    return Attribute;
}(Expression));
exports.Attribute = Attribute;
var Subscript = /** @class */ (function (_super) {
    tslib_1.__extends(Subscript, _super);
    function Subscript(value, slice, ctx, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.value = value;
        _this.slice = slice;
        _this.ctx = ctx;
        return _this;
    }
    return Subscript;
}(Expression));
exports.Subscript = Subscript;
var Name = /** @class */ (function (_super) {
    tslib_1.__extends(Name, _super);
    function Name(id, ctx) {
        var _this = _super.call(this) || this;
        _this.id = id;
        _this.ctx = ctx;
        return _this;
    }
    Name.prototype.accept = function (visitor) {
        visitor.name(this);
    };
    return Name;
}(Expression));
exports.Name = Name;
var List = /** @class */ (function (_super) {
    tslib_1.__extends(List, _super);
    function List(elts, ctx, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.elts = elts;
        _this.ctx = ctx;
        return _this;
    }
    List.prototype.accept = function (visitor) {
        visitor.list(this);
    };
    return List;
}(Expression));
exports.List = List;
var Tuple = /** @class */ (function (_super) {
    tslib_1.__extends(Tuple, _super);
    function Tuple(elts, ctx, range) {
        var _this = _super.call(this) || this;
        _this.range = range;
        _this.elts = elts;
        _this.ctx = ctx;
        return _this;
    }
    return Tuple;
}(Expression));
exports.Tuple = Tuple;
var Ellipsis = /** @class */ (function () {
    function Ellipsis() {
        // Do nothing yet.
    }
    return Ellipsis;
}());
exports.Ellipsis = Ellipsis;
var Slice = /** @class */ (function () {
    function Slice(lower, upper, step) {
        this.lower = lower;
        this.upper = upper;
        this.step = step;
    }
    return Slice;
}());
exports.Slice = Slice;
var ExtSlice = /** @class */ (function () {
    function ExtSlice(dims) {
        this.dims = dims;
    }
    return ExtSlice;
}());
exports.ExtSlice = ExtSlice;
var Index = /** @class */ (function () {
    function Index(value) {
        this.value = value;
    }
    return Index;
}());
exports.Index = Index;
var Comprehension = /** @class */ (function () {
    function Comprehension(target, iter, ifs, range) {
        this.range = range;
        this.target = target;
        this.iter = iter;
        this.ifs = ifs;
    }
    return Comprehension;
}());
exports.Comprehension = Comprehension;
var ExceptHandler = /** @class */ (function () {
    function ExceptHandler(type, name, body, range) {
        this.range = range;
        this.type = type;
        this.name = name;
        this.body = body;
    }
    return ExceptHandler;
}());
exports.ExceptHandler = ExceptHandler;
var Arguments = /** @class */ (function () {
    function Arguments(args, vararg, kwarg, defaults) {
        this.args = args;
        this.vararg = vararg;
        this.kwarg = kwarg;
        this.defaults = defaults;
    }
    return Arguments;
}());
exports.Arguments = Arguments;
var Keyword = /** @class */ (function () {
    function Keyword(arg, value) {
        this.arg = arg;
        this.value = value;
    }
    return Keyword;
}());
exports.Keyword = Keyword;
var Alias = /** @class */ (function () {
    function Alias(name, asname) {
        asserts_1.assert(typeof name.value === 'string');
        asserts_1.assert(typeof asname === 'string' || asname === null);
        this.name = name;
        this.asname = asname;
    }
    Alias.prototype.toString = function () {
        return this.name.value + " as " + this.asname;
    };
    return Alias;
}());
exports.Alias = Alias;
Module.prototype['_astname'] = 'Module';
Module.prototype['_fields'] = [
    'body',
    function (n) { return n.body; }
];
Interactive.prototype['_astname'] = 'Interactive';
Interactive.prototype['_fields'] = [
    'body',
    function (n) { return n.body; }
];
Expression.prototype['_astname'] = 'Expression';
Expression.prototype['_fields'] = [
    'body',
    function (n) {
        // TOD: Expression is abstract so we should not be here?
        return void 0;
    }
];
Suite.prototype['_astname'] = 'Suite';
Suite.prototype['_fields'] = [
    'body',
    function (n) { return n.body; }
];
FunctionDef.prototype['_astname'] = 'FunctionDef';
FunctionDef.prototype['_fields'] = [
    'name',
    function (n) { return n.name.value; },
    'args',
    function (n) { return n.args; },
    'body',
    function (n) { return n.body; },
    'returnType',
    function (n) { return n.returnType; },
    'decorator_list',
    function (n) { return n.decorator_list; }
];
ClassDef.prototype['_astname'] = 'ClassDef';
ClassDef.prototype['_fields'] = [
    'name',
    function (n) { return n.name.value; },
    'bases',
    function (n) { return n.bases; },
    'body',
    function (n) { return n.body; },
    'decorator_list',
    function (n) { return n.decorator_list; }
];
ReturnStatement.prototype['_astname'] = 'ReturnStatement';
ReturnStatement.prototype['_fields'] = [
    'value',
    function (n) { return n.value; }
];
DeleteStatement.prototype['_astname'] = 'DeleteStatement';
DeleteStatement.prototype['_fields'] = [
    'targets',
    function (n) { return n.targets; }
];
Assign.prototype['_astname'] = 'Assign';
Assign.prototype['_fields'] = [
    'targets',
    function (n) { return n.targets; },
    'value',
    function (n) { return n.value; }
];
AugAssign.prototype['_astname'] = 'AugAssign';
AugAssign.prototype['_fields'] = [
    'target',
    function (n) { return n.target; },
    'op',
    function (n) { return n.op; },
    'value',
    function (n) { return n.value; }
];
AnnAssign.prototype['_astname'] = 'AnnAssign';
AnnAssign.prototype['_fields'] = [
    'target',
    function (n) { return n.target; },
    'type',
    function (n) { return n.value; }
];
Print.prototype['_astname'] = 'Print';
Print.prototype['_fields'] = [
    'dest',
    function (n) { return n.dest; },
    'values',
    function (n) { return n.values; },
    'nl',
    function (n) { return n.nl; }
];
ForStatement.prototype['_astname'] = 'ForStatement';
ForStatement.prototype['_fields'] = [
    'target',
    function (n) { return n.target; },
    'iter',
    function (n) { return n.iter; },
    'body',
    function (n) { return n.body; },
    'orelse',
    function (n) { return n.orelse; }
];
WhileStatement.prototype['_astname'] = 'WhileStatement';
WhileStatement.prototype['_fields'] = [
    'test',
    function (n) { return n.test; },
    'body',
    function (n) { return n.body; },
    'orelse',
    function (n) { return n.orelse; }
];
IfStatement.prototype['_astname'] = 'IfStatement';
IfStatement.prototype['_fields'] = [
    'test',
    function (n) { return n.test; },
    'consequent',
    function (n) { return n.consequent; },
    'alternate',
    function (n) { return n.alternate; }
];
WithStatement.prototype['_astname'] = 'WithStatement';
WithStatement.prototype['_fields'] = [
    'context_expr',
    function (n) { return n.context_expr; },
    'optional_vars',
    function (n) { return n.optional_vars; },
    'body',
    function (n) { return n.body; }
];
Raise.prototype['_astname'] = 'Raise';
Raise.prototype['_fields'] = [
    'type',
    function (n) { return n.type; },
    'inst',
    function (n) { return n.inst; },
    'tback',
    function (n) { return n.tback; }
];
TryExcept.prototype['_astname'] = 'TryExcept';
TryExcept.prototype['_fields'] = [
    'body',
    function (n) { return n.body; },
    'handlers',
    function (n) { return n.handlers; },
    'orelse',
    function (n) { return n.orelse; }
];
TryFinally.prototype['_astname'] = 'TryFinally';
TryFinally.prototype['_fields'] = [
    'body',
    function (n) { return n.body; },
    'finalbody',
    function (n) { return n.finalbody; }
];
Assert.prototype['_astname'] = 'Assert';
Assert.prototype['_fields'] = [
    'test',
    function (n) { return n.test; },
    'msg',
    function (n) { return n.msg; }
];
ImportStatement.prototype['_astname'] = 'Import';
ImportStatement.prototype['_fields'] = [
    'names',
    function (n) { return n.names; }
];
ImportFrom.prototype['_astname'] = 'ImportFrom';
ImportFrom.prototype['_fields'] = [
    'module',
    function (n) { return n.module.value; },
    'names',
    function (n) { return n.names; },
    'level',
    function (n) { return n.level; }
];
Exec.prototype['_astname'] = 'Exec';
Exec.prototype['_fields'] = [
    'body',
    function (n) { return n.body; },
    'globals',
    function (n) { return n.globals; },
    'locals',
    function (n) { return n.locals; }
];
Global.prototype['_astname'] = 'Global';
Global.prototype['_fields'] = [
    'names',
    function (n) { return n.names; }
];
NonLocal.prototype['_astname'] = 'NonLocal';
NonLocal.prototype['_fields'] = [
    'names',
    function (n) { return n.names; }
];
ExpressionStatement.prototype['_astname'] = 'ExpressionStatement';
ExpressionStatement.prototype['_fields'] = [
    'value',
    function (n) { return n.value; }
];
Pass.prototype['_astname'] = 'Pass';
Pass.prototype['_fields'] = [];
BreakStatement.prototype['_astname'] = 'BreakStatement';
BreakStatement.prototype['_fields'] = [];
ContinueStatement.prototype['_astname'] = 'ContinueStatement';
ContinueStatement.prototype['_fields'] = [];
BoolOp.prototype['_astname'] = 'BoolOp';
BoolOp.prototype['_fields'] = [
    'op',
    function (n) { return n.op; },
    'values',
    function (n) { return n.values; }
];
BinOp.prototype['_astname'] = 'BinOp';
BinOp.prototype['_fields'] = [
    'lhs',
    function (n) { return n.lhs; },
    'op',
    function (n) { return n.op; },
    'rhs',
    function (n) { return n.rhs; }
];
UnaryOp.prototype['_astname'] = 'UnaryOp';
UnaryOp.prototype['_fields'] = [
    'op',
    function (n) { return n.op; },
    'operand',
    function (n) { return n.operand; }
];
Lambda.prototype['_astname'] = 'Lambda';
Lambda.prototype['_fields'] = [
    'args',
    function (n) { return n.args; },
    'body',
    function (n) { return n.body; }
];
IfExp.prototype['_astname'] = 'IfExp';
IfExp.prototype['_fields'] = [
    'test',
    function (n) { return n.test; },
    'body',
    function (n) { return n.body; },
    'orelse',
    function (n) { return n.orelse; }
];
Dict.prototype['_astname'] = 'Dict';
Dict.prototype['_fields'] = [
    'keys',
    function (n) { return n.keys; },
    'values',
    function (n) { return n.values; }
];
ListComp.prototype['_astname'] = 'ListComp';
ListComp.prototype['_fields'] = [
    'elt',
    function (n) { return n.elt; },
    'generators',
    function (n) { return n.generators; }
];
GeneratorExp.prototype['_astname'] = 'GeneratorExp';
GeneratorExp.prototype['_fields'] = [
    'elt',
    function (n) { return n.elt; },
    'generators',
    function (n) { return n.generators; }
];
Yield.prototype['_astname'] = 'Yield';
Yield.prototype['_fields'] = [
    'value',
    function (n) { return n.value; }
];
Compare.prototype['_astname'] = 'Compare';
Compare.prototype['_fields'] = [
    'left',
    function (n) { return n.left; },
    'ops',
    function (n) { return n.ops; },
    'comparators',
    function (n) { return n.comparators; }
];
Call.prototype['_astname'] = 'Call';
Call.prototype['_fields'] = [
    'func',
    function (n) { return n.func; },
    'args',
    function (n) { return n.args; },
    'keywords',
    function (n) { return n.keywords; },
    'starargs',
    function (n) { return n.starargs; },
    'kwargs',
    function (n) { return n.kwargs; }
];
Num.prototype['_astname'] = 'Num';
Num.prototype['_fields'] = [
    'n',
    function (n) { return n.n.value; }
];
Str.prototype['_astname'] = 'Str';
Str.prototype['_fields'] = [
    's',
    function (n) { return n.s.value; }
];
Attribute.prototype['_astname'] = 'Attribute';
Attribute.prototype['_fields'] = [
    'value',
    function (n) { return n.value; },
    'attr',
    function (n) { return n.attr.value; },
    'ctx',
    function (n) { return n.ctx; }
];
Subscript.prototype['_astname'] = 'Subscript';
Subscript.prototype['_fields'] = [
    'value',
    function (n) { return n.value; },
    'slice',
    function (n) { return n.slice; },
    'ctx',
    function (n) { return n.ctx; }
];
Name.prototype['_astname'] = 'Name';
Name.prototype['_fields'] = [
    'id',
    function (n) { return n.id.value; },
    'ctx',
    function (n) { return n.ctx; }
];
List.prototype['_astname'] = 'List';
List.prototype['_fields'] = [
    'elts',
    function (n) { return n.elts; },
    'ctx',
    function (n) { return n.ctx; }
];
Tuple.prototype['_astname'] = 'Tuple';
Tuple.prototype['_fields'] = [
    'elts',
    function (n) { return n.elts; },
    'ctx',
    function (n) { return n.ctx; }
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
    'lower',
    function (n) { return n.lower; },
    'upper',
    function (n) { return n.upper; },
    'step',
    function (n) { return n.step; }
];
ExtSlice.prototype['_astname'] = 'ExtSlice';
ExtSlice.prototype['_fields'] = [
    'dims',
    function (n) { return n.dims; }
];
Index.prototype['_astname'] = 'Index';
Index.prototype['_fields'] = [
    'value',
    function (n) { return n.value; }
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
    'target',
    function (n) { return n.target; },
    'iter',
    function (n) { return n.iter; },
    'ifs',
    function (n) { return n.ifs; }
];
ExceptHandler.prototype['_astname'] = 'ExceptHandler';
ExceptHandler.prototype['_fields'] = [
    'type',
    function (n) { return n.type; },
    'name',
    function (n) { return n.name; },
    'body',
    function (n) { return n.body; }
];
Arguments.prototype['_astname'] = 'Arguments';
Arguments.prototype['_fields'] = [
    'args',
    function (n) { return n.args; },
    'vararg',
    function (n) { return n.vararg; },
    'kwarg',
    function (n) { return n.kwarg; },
    'defaults',
    function (n) { return n.defaults; }
];
Keyword.prototype['_astname'] = 'Keyword';
Keyword.prototype['_fields'] = [
    'arg',
    function (n) { return n.arg.value; },
    'value',
    function (n) { return n.value; }
];
FunctionParamDef.prototype['_astname'] = 'FunctionParamDef';
FunctionParamDef.prototype['_fields'] = [
    'name',
    function (n) { return n.name; },
    'type',
    function (n) { return n.type; }
];
Alias.prototype['_astname'] = 'Alias';
Alias.prototype['_fields'] = [
    'name',
    function (n) { return n.name.value; },
    'asname',
    function (n) { return n.asname; }
];
