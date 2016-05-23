define(["require", "exports"], function (require, exports) {
    "use strict";
    var Load = (function () {
        function Load() {
        }
        return Load;
    }());
    exports.Load = Load;
    var Store = (function () {
        function Store() {
        }
        return Store;
    }());
    exports.Store = Store;
    var Del = (function () {
        function Del() {
        }
        return Del;
    }());
    exports.Del = Del;
    var AugLoad = (function () {
        function AugLoad() {
        }
        return AugLoad;
    }());
    exports.AugLoad = AugLoad;
    var AugStore = (function () {
        function AugStore() {
        }
        return AugStore;
    }());
    exports.AugStore = AugStore;
    var Param = (function () {
        function Param() {
        }
        return Param;
    }());
    exports.Param = Param;
    var And = (function () {
        function And() {
        }
        return And;
    }());
    exports.And = And;
    var Or = (function () {
        function Or() {
        }
        return Or;
    }());
    exports.Or = Or;
    var Add = (function () {
        function Add() {
        }
        return Add;
    }());
    exports.Add = Add;
    var Sub = (function () {
        function Sub() {
        }
        return Sub;
    }());
    exports.Sub = Sub;
    var Mult = (function () {
        function Mult() {
        }
        return Mult;
    }());
    exports.Mult = Mult;
    var Div = (function () {
        function Div() {
        }
        return Div;
    }());
    exports.Div = Div;
    var Mod = (function () {
        function Mod() {
        }
        return Mod;
    }());
    exports.Mod = Mod;
    var Pow = (function () {
        function Pow() {
        }
        return Pow;
    }());
    exports.Pow = Pow;
    var LShift = (function () {
        function LShift() {
        }
        return LShift;
    }());
    exports.LShift = LShift;
    var RShift = (function () {
        function RShift() {
        }
        return RShift;
    }());
    exports.RShift = RShift;
    var BitOr = (function () {
        function BitOr() {
        }
        return BitOr;
    }());
    exports.BitOr = BitOr;
    var BitXor = (function () {
        function BitXor() {
        }
        return BitXor;
    }());
    exports.BitXor = BitXor;
    var BitAnd = (function () {
        function BitAnd() {
        }
        return BitAnd;
    }());
    exports.BitAnd = BitAnd;
    var FloorDiv = (function () {
        function FloorDiv() {
        }
        return FloorDiv;
    }());
    exports.FloorDiv = FloorDiv;
    var Invert = (function () {
        function Invert() {
        }
        return Invert;
    }());
    exports.Invert = Invert;
    var Not = (function () {
        function Not() {
        }
        return Not;
    }());
    exports.Not = Not;
    var UAdd = (function () {
        function UAdd() {
        }
        return UAdd;
    }());
    exports.UAdd = UAdd;
    var USub = (function () {
        function USub() {
        }
        return USub;
    }());
    exports.USub = USub;
    var Eq = (function () {
        function Eq() {
        }
        return Eq;
    }());
    exports.Eq = Eq;
    var NotEq = (function () {
        function NotEq() {
        }
        return NotEq;
    }());
    exports.NotEq = NotEq;
    var Lt = (function () {
        function Lt() {
        }
        return Lt;
    }());
    exports.Lt = Lt;
    var LtE = (function () {
        function LtE() {
        }
        return LtE;
    }());
    exports.LtE = LtE;
    var Gt = (function () {
        function Gt() {
        }
        return Gt;
    }());
    exports.Gt = Gt;
    var GtE = (function () {
        function GtE() {
        }
        return GtE;
    }());
    exports.GtE = GtE;
    var Is = (function () {
        function Is() {
        }
        return Is;
    }());
    exports.Is = Is;
    var IsNot = (function () {
        function IsNot() {
        }
        return IsNot;
    }());
    exports.IsNot = IsNot;
    var In_ = (function () {
        function In_() {
        }
        return In_;
    }());
    exports.In_ = In_;
    var NotIn = (function () {
        function NotIn() {
        }
        return NotIn;
    }());
    exports.NotIn = NotIn;
    var Module = (function () {
        function Module(body) {
            this.body = body;
        }
        return Module;
    }());
    exports.Module = Module;
    var Interactive = (function () {
        function Interactive(body) {
            this.body = body;
        }
        return Interactive;
    }());
    exports.Interactive = Interactive;
    var Expression = (function () {
        function Expression(body) {
            this.body = body;
        }
        return Expression;
    }());
    exports.Expression = Expression;
    var Suite = (function () {
        function Suite(body) {
            this.body = body;
        }
        return Suite;
    }());
    exports.Suite = Suite;
    var FunctionDef = (function () {
        function FunctionDef(name, args, body, decorator_list, lineno, col_offset) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return FunctionDef;
    }());
    exports.FunctionDef = FunctionDef;
    var ClassDef = (function () {
        function ClassDef(name, bases, body, decorator_list, lineno, col_offset) {
            this.name = name;
            this.bases = bases;
            this.body = body;
            this.decorator_list = decorator_list;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ClassDef;
    }());
    exports.ClassDef = ClassDef;
    var Return_ = (function () {
        function Return_(value, lineno, col_offset) {
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Return_;
    }());
    exports.Return_ = Return_;
    var Delete_ = (function () {
        function Delete_(targets, lineno, col_offset) {
            this.targets = targets;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Delete_;
    }());
    exports.Delete_ = Delete_;
    var Assign = (function () {
        function Assign(targets, value, lineno, col_offset) {
            this.targets = targets;
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Assign;
    }());
    exports.Assign = Assign;
    var AugAssign = (function () {
        function AugAssign(target, op, value, lineno, col_offset) {
            this.target = target;
            this.op = op;
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return AugAssign;
    }());
    exports.AugAssign = AugAssign;
    var Print = (function () {
        function Print(dest, values, nl, lineno, col_offset) {
            this.dest = dest;
            this.values = values;
            this.nl = nl;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Print;
    }());
    exports.Print = Print;
    var For_ = (function () {
        function For_(target, iter, body, orelse, lineno, col_offset) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return For_;
    }());
    exports.For_ = For_;
    var While_ = (function () {
        function While_(test, body, orelse, lineno, col_offset) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return While_;
    }());
    exports.While_ = While_;
    var If_ = (function () {
        function If_(test, body, orelse, lineno, col_offset) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return If_;
    }());
    exports.If_ = If_;
    var With_ = (function () {
        function With_(context_expr, optional_vars, body, lineno, col_offset) {
            this.context_expr = context_expr;
            this.optional_vars = optional_vars;
            this.body = body;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return With_;
    }());
    exports.With_ = With_;
    var Raise = (function () {
        function Raise(type, inst, tback, lineno, col_offset) {
            this.type = type;
            this.inst = inst;
            this.tback = tback;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Raise;
    }());
    exports.Raise = Raise;
    var TryExcept = (function () {
        function TryExcept(body, handlers, orelse, lineno, col_offset) {
            this.body = body;
            this.handlers = handlers;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return TryExcept;
    }());
    exports.TryExcept = TryExcept;
    var TryFinally = (function () {
        function TryFinally(body, finalbody, lineno, col_offset) {
            this.body = body;
            this.finalbody = finalbody;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return TryFinally;
    }());
    exports.TryFinally = TryFinally;
    var Assert = (function () {
        function Assert(test, msg, lineno, col_offset) {
            this.test = test;
            this.msg = msg;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Assert;
    }());
    exports.Assert = Assert;
    var Import_ = (function () {
        function Import_(names, lineno, col_offset) {
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Import_;
    }());
    exports.Import_ = Import_;
    var ImportFrom = (function () {
        function ImportFrom(module, names, level, lineno, col_offset) {
            this.module = module;
            this.names = names;
            this.level = level;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ImportFrom;
    }());
    exports.ImportFrom = ImportFrom;
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
    exports.Exec = Exec;
    var Global = (function () {
        function Global(names, lineno, col_offset) {
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Global;
    }());
    exports.Global = Global;
    var NonLocal = (function () {
        function NonLocal(names, lineno, col_offset) {
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return NonLocal;
    }());
    exports.NonLocal = NonLocal;
    var Expr = (function () {
        function Expr(value, lineno, col_offset) {
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Expr;
    }());
    exports.Expr = Expr;
    var Pass = (function () {
        function Pass(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Pass;
    }());
    exports.Pass = Pass;
    var Break_ = (function () {
        function Break_(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Break_;
    }());
    exports.Break_ = Break_;
    var Continue_ = (function () {
        function Continue_(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Continue_;
    }());
    exports.Continue_ = Continue_;
    var BoolOp = (function () {
        function BoolOp(op, values, lineno, col_offset) {
            this.op = op;
            this.values = values;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return BoolOp;
    }());
    exports.BoolOp = BoolOp;
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
    exports.BinOp = BinOp;
    var UnaryOp = (function () {
        function UnaryOp(op, operand, lineno, col_offset) {
            this.op = op;
            this.operand = operand;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return UnaryOp;
    }());
    exports.UnaryOp = UnaryOp;
    var Lambda = (function () {
        function Lambda(args, body, lineno, col_offset) {
            this.args = args;
            this.body = body;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Lambda;
    }());
    exports.Lambda = Lambda;
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
    exports.IfExp = IfExp;
    var Dict = (function () {
        function Dict(keys, values, lineno, col_offset) {
            this.keys = keys;
            this.values = values;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Dict;
    }());
    exports.Dict = Dict;
    var ListComp = (function () {
        function ListComp(elt, generators, lineno, col_offset) {
            this.elt = elt;
            this.generators = generators;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ListComp;
    }());
    exports.ListComp = ListComp;
    var GeneratorExp = (function () {
        function GeneratorExp(elt, generators, lineno, col_offset) {
            this.elt = elt;
            this.generators = generators;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return GeneratorExp;
    }());
    exports.GeneratorExp = GeneratorExp;
    var Yield = (function () {
        function Yield(value, lineno, col_offset) {
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Yield;
    }());
    exports.Yield = Yield;
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
    exports.Compare = Compare;
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
    exports.Call = Call;
    var Num = (function () {
        function Num(n, lineno, col_offset) {
            this.n = n;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Num;
    }());
    exports.Num = Num;
    var Str = (function () {
        function Str(s, lineno, col_offset) {
            this.s = s;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Str;
    }());
    exports.Str = Str;
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
    exports.Attribute = Attribute;
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
    exports.Subscript = Subscript;
    var Name = (function () {
        function Name(id, ctx, lineno, col_offset) {
            this.id = id;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Name;
    }());
    exports.Name = Name;
    var List = (function () {
        function List(elts, ctx, lineno, col_offset) {
            this.elts = elts;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return List;
    }());
    exports.List = List;
    var Tuple = (function () {
        function Tuple(elts, ctx, lineno, col_offset) {
            this.elts = elts;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Tuple;
    }());
    exports.Tuple = Tuple;
    var Ellipsis = (function () {
        function Ellipsis() {
        }
        return Ellipsis;
    }());
    exports.Ellipsis = Ellipsis;
    var Slice = (function () {
        function Slice(lower, upper, step) {
            this.lower = lower;
            this.upper = upper;
            this.step = step;
        }
        return Slice;
    }());
    exports.Slice = Slice;
    var ExtSlice = (function () {
        function ExtSlice(dims) {
            this.dims = dims;
        }
        return ExtSlice;
    }());
    exports.ExtSlice = ExtSlice;
    var Index = (function () {
        function Index(value) {
            this.value = value;
        }
        return Index;
    }());
    exports.Index = Index;
    var comprehension = (function () {
        function comprehension(target, iter, ifs) {
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
        }
        return comprehension;
    }());
    exports.comprehension = comprehension;
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
    exports.ExceptHandler = ExceptHandler;
    var arguments_ = (function () {
        function arguments_(args, vararg, kwarg, defaults) {
            this.args = args;
            this.vararg = vararg;
            this.kwarg = kwarg;
            this.defaults = defaults;
        }
        return arguments_;
    }());
    exports.arguments_ = arguments_;
    var keyword = (function () {
        function keyword(arg, value) {
            this.arg = arg;
            this.value = value;
        }
        return keyword;
    }());
    exports.keyword = keyword;
    var alias = (function () {
        function alias(name, asname) {
            this.name = name;
            this.asname = asname;
        }
        return alias;
    }());
    exports.alias = alias;
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
    Return_.prototype['_astname'] = 'Return';
    Return_.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    Delete_.prototype['_astname'] = 'Delete';
    Delete_.prototype['_fields'] = [
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
    For_.prototype['_astname'] = 'For';
    For_.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'iter', function (n) { return n.iter; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    While_.prototype['_astname'] = 'While';
    While_.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    If_.prototype['_astname'] = 'If';
    If_.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    With_.prototype['_astname'] = 'With';
    With_.prototype['_fields'] = [
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
    Import_.prototype['_astname'] = 'Import';
    Import_.prototype['_fields'] = [
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
    Break_.prototype['_astname'] = 'Break';
    Break_.prototype['_fields'] = [];
    Continue_.prototype['_astname'] = 'Continue';
    Continue_.prototype['_fields'] = [];
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
    In_.prototype['_astname'] = 'In';
    In_.prototype['_isenum'] = true;
    NotIn.prototype['_astname'] = 'NotIn';
    NotIn.prototype['_isenum'] = true;
    comprehension.prototype['_astname'] = 'comprehension';
    comprehension.prototype['_fields'] = [
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
    arguments_.prototype['_astname'] = 'arguments';
    arguments_.prototype['_fields'] = [
        'args', function (n) { return n.args; },
        'vararg', function (n) { return n.vararg; },
        'kwarg', function (n) { return n.kwarg; },
        'defaults', function (n) { return n.defaults; }
    ];
    keyword.prototype['_astname'] = 'keyword';
    keyword.prototype['_fields'] = [
        'arg', function (n) { return n.arg; },
        'value', function (n) { return n.value; }
    ];
    alias.prototype['_astname'] = 'alias';
    alias.prototype['_fields'] = [
        'name', function (n) { return n.name; },
        'asname', function (n) { return n.asname; }
    ];
});
