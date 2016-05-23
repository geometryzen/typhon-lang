import INumericLiteral from './INumericLiteral';

export class Load { }
export class Store { }
export class Del { }
export class AugLoad { }
export class AugStore { }
export class Param { }

export class And { }
export class Or { }

export class Add { }
export class Sub { }
export class Mult { }
export class Div { }
export class Mod { }
export class Pow { }
export class LShift { }
export class RShift { }
export class BitOr { }
export class BitXor { }
export class BitAnd { }
export class FloorDiv { }

export class Invert { }
export class Not { }
export class UAdd { }
export class USub { }

export class Eq { }
export class NotEq { }
export class Lt { }
export class LtE { }
export class Gt { }
export class GtE { }
export class Is { }
export class IsNot { }
export class In { }
export class NotIn { }

export class ASTSpan {
    public minChar: number = -1;  // -1 = "undefined" or "compiler generated"
    public limChar: number = -1;  // -1 = "undefined" or "compiler generated"   
}

export class AST extends ASTSpan {

}

export class ModuleElement extends AST {

}

export class Statement extends ModuleElement {
    lineno: number;
}

export class IterationStatement extends Statement {
    // statement: Statement;
}

export class Module {
    body: Statement[];
    constructor(body: Statement[]) {
        this.body = body;
    }
}

export class Interactive {
    body;
    constructor(body) {
        this.body = body;
    }
}

interface TextRange {
    // pos: number;
    // end: number;
}

interface Node extends TextRange {

}

export class Expression extends Statement implements Node {
    body;
    constructor(body) {
        super();
        this.body = body;
    }
}

export class UnaryExpression extends Expression {

}

export class Suite {
    body;
    constructor(body) {
        this.body = body;
    }
}

export class FunctionDef extends Statement {
    name: string;
    args;
    body;
    decorator_list;
    lineno;
    col_offset;
    constructor(name: string, args, body, decorator_list, lineno, col_offset) {
        super();
        this.name = name;
        this.args = args;
        this.body = body;
        this.decorator_list = decorator_list;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ClassDef extends Statement {
    name: string;
    bases;
    body;
    decorator_list;
    lineno;
    col_offset;
    constructor(name: string, bases, body, decorator_list, lineno, col_offset) {
        super();
        this.name = name;
        this.bases = bases;
        this.body = body;
        this.decorator_list = decorator_list;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ReturnStatement extends Statement {
    /**
     * An expression, and probably should be optional.
     */
    value;
    lineno;
    col_offset;
    constructor(value, lineno, col_offset) {
        super();
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class DeleteExpression extends UnaryExpression {
    targets: UnaryExpression;
    lineno;
    col_offset;
    constructor(targets, lineno, col_offset) {
        super(targets);
        this.targets = targets;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Assign extends Statement {
    targets;
    value;
    lineno;
    col_offset;
    constructor(targets, value, lineno, col_offset) {
        super();
        this.targets = targets;
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class AugAssign extends Statement {
    target;
    op;
    value;
    lineno;
    col_offset;
    constructor(target, op, value, lineno, col_offset) {
        super();
        this.target = target;
        this.op = op;
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Print extends Statement {
    dest;
    values;
    nl;
    lineno;
    col_offset;
    constructor(dest, values, nl, lineno, col_offset) {
        super();
        this.dest = dest;
        this.values = values;
        this.nl = nl;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ForStatement extends IterationStatement {
    target;
    iter;
    body;
    orelse;
    lineno;
    col_offset;
    constructor(target, iter, body, orelse, lineno, col_offset) {
        super();
        this.target = target;
        this.iter = iter;
        this.body = body;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class WhileStatement extends IterationStatement {
    test;
    body;
    orelse;
    lineno;
    col_offset;
    constructor(test, body, orelse, lineno, col_offset) {
        super();
        this.test = test;
        this.body = body;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class IfStatement extends Statement {
    test: Expression;
    body: Statement[];
    orelse: Statement[];
    lineno;
    col_offset;
    constructor(test: Expression, body: Statement[], orelse: Statement[], lineno, col_offset) {
        super();
        this.test = test;
        this.body = body;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class WithStatement extends Statement {
    context_expr;
    optional_vars;
    body;
    lineno;
    col_offset;
    constructor(context_expr, optional_vars, body, lineno, col_offset) {
        super();
        this.context_expr = context_expr;
        this.optional_vars = optional_vars;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Raise extends Statement {
    type;
    inst;
    tback;
    lineno;
    col_offset;
    constructor(type, inst, tback, lineno, col_offset) {
        super();
        this.type = type;
        this.inst = inst;
        this.tback = tback;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class TryExcept extends Statement {
    body;
    handlers;
    orelse;
    lineno;
    col_offset;
    constructor(body, handlers, orelse, lineno, col_offset) {
        super();
        this.body = body;
        this.handlers = handlers;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class TryFinally extends Statement {
    body;
    finalbody;
    lineno;
    col_offset;
    constructor(body, finalbody, lineno, col_offset) {
        super();
        this.body = body;
        this.finalbody = finalbody;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Assert extends Statement {
    test;
    msg;
    lineno;
    col_offset;
    constructor(test, msg, lineno, col_offset) {
        super();
        this.test = test;
        this.msg = msg;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ImportStatement extends Statement {
    names: Alias[];
    lineno;
    col_offset;
    constructor(names: Alias[], lineno, col_offset) {
        super();
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ImportFrom extends Statement {
    module: string;
    names: Alias[];
    private level;
    lineno;
    col_offset;
    constructor(module: string, names: Alias[], level, lineno, col_offset) {
        super();
        this.module = module;
        this.names = names;
        this.level = level;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Exec {
    body;
    globals;
    locals;
    lineno;
    col_offset;
    constructor(body, globals, locals, lineno, col_offset) {
        this.body = body;
        this.globals = globals;
        this.locals = locals;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Global {
    names;
    lineno;
    col_offset;
    constructor(names, lineno, col_offset) {
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class NonLocal {
    names;
    lineno;
    col_offset;
    constructor(names, lineno, col_offset) {
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Expr extends Statement {
    value;
    lineno;
    col_offset;
    constructor(value, lineno, col_offset) {
        super();
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Pass {
    lineno;
    col_offset;
    constructor(lineno, col_offset) {
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class BreakStatement extends Statement {
    lineno;
    col_offset;
    constructor(lineno, col_offset) {
        super();
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ContinueStatement extends Statement {
    lineno;
    col_offset;
    constructor(lineno, col_offset) {
        super();
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class BoolOp {
    op;
    values;
    lineno;
    col_offset;
    constructor(op, values, lineno, col_offset) {
        this.op = op;
        this.values = values;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class BinOp {
    left;
    op;
    right;
    lineno;
    col_offset;
    constructor(left, op, right, lineno, col_offset) {
        this.left = left;
        this.op = op;
        this.right = right;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class UnaryOp {
    op;
    operand;
    lineno;
    col_offset;
    constructor(op, operand, lineno, col_offset) {
        this.op = op;
        this.operand = operand;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Lambda {
    args;
    body;
    lineno;
    col_offset;
    constructor(args, body, lineno, col_offset) {
        this.args = args;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class IfExp {
    test;
    body;
    orelse;
    lineno;
    col_offset;
    constructor(test, body, orelse, lineno, col_offset) {
        this.test = test;
        this.body = body;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Dict {
    keys;
    values;
    lineno;
    col_offset;
    constructor(keys, values, lineno, col_offset) {
        this.keys = keys;
        this.values = values;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ListComp {
    elt;
    generators;
    lineno;
    col_offset;
    constructor(elt, generators, lineno, col_offset) {
        this.elt = elt;
        this.generators = generators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class GeneratorExp {
    elt;
    generators;
    lineno;
    col_offset;
    constructor(elt, generators, lineno, col_offset) {
        this.elt = elt;
        this.generators = generators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Yield {
    value;
    lineno;
    col_offset;
    constructor(value, lineno, col_offset) {
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Compare {
    left;
    ops;
    comparators;
    lineno;
    col_offset;
    constructor(left, ops, comparators, lineno, col_offset) {
        this.left = left;
        this.ops = ops;
        this.comparators = comparators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Call {
    func: Attribute | Name;
    args;
    keywords;
    starargs;
    kwargs;
    lineno;
    col_offset;
    constructor(func: Attribute | Name, args, keywords, starargs, kwargs, lineno, col_offset) {
        this.func = func;
        this.args = args;
        this.keywords = keywords;
        this.starargs = starargs;
        this.kwargs = kwargs;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Num {
    n: INumericLiteral;
    lineno;
    col_offset;
    constructor(n: INumericLiteral, lineno, col_offset) {
        this.n = n;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Str {
    s: string;
    lineno;
    col_offset;
    constructor(s: string, lineno, col_offset) {
        this.s = s;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Attribute {
    value;
    attr;
    ctx;
    lineno;
    col_offset;
    constructor(value, attr, ctx, lineno, col_offset) {
        this.value = value;
        this.attr = attr;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Subscript {
    value;
    slice;
    ctx;
    lineno;
    col_offset;
    constructor(value, slice, ctx, lineno, col_offset) {
        this.value = value;
        this.slice = slice;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Name {
    id;
    ctx;
    lineno;
    col_offset;
    constructor(id, ctx, lineno, col_offset) {
        this.id = id;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class List {
    elts;
    ctx;
    lineno;
    col_offset;
    constructor(elts, ctx, lineno, col_offset) {
        this.elts = elts;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Tuple {
    elts;
    ctx;
    lineno;
    col_offset;
    constructor(elts, ctx, lineno, col_offset) {
        this.elts = elts;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Ellipsis {
    constructor() {
        // Do nothing yet.
    }
}

export class Slice {
    lower;
    upper;
    step;
    constructor(lower, upper, step) {
        this.lower = lower;
        this.upper = upper;
        this.step = step;
    }
}

export class ExtSlice {
    dims;
    constructor(dims) {
        this.dims = dims;
    }
}

export class Index {
    value;
    constructor(value) {
        this.value = value;
    }
}

export class Comprehension {
    target;
    iter;
    ifs;
    constructor(target, iter, ifs) {
        this.target = target;
        this.iter = iter;
        this.ifs = ifs;
    }
}

export class ExceptHandler {
    type;
    name;
    body;
    lineno;
    col_offset;
    constructor(type, name, body, lineno, col_offset) {
        this.type = type;
        this.name = name;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Arguments {
    args;
    vararg;
    kwarg;
    defaults;
    constructor(args, vararg, kwarg, defaults) {
        this.args = args;
        this.vararg = vararg;
        this.kwarg = kwarg;
        this.defaults = defaults;
    }
}

export class Keyword {
    arg;
    value;
    constructor(arg, value) {
        this.arg = arg;
        this.value = value;
    }
}

export class Alias {
    name: string;
    asname: string;
    constructor(name: string, asname: string) {
        this.name = name;
        this.asname = asname;
    }
}

Module.prototype['_astname'] = 'Module';
Module.prototype['_fields'] = [
    'body', function(n) { return n.body; }
];
Interactive.prototype['_astname'] = 'Interactive';
Interactive.prototype['_fields'] = [
    'body', function(n) { return n.body; }
];
Expression.prototype['_astname'] = 'Expression';
Expression.prototype['_fields'] = [
    'body', function(n) { return n.body; }
];
Suite.prototype['_astname'] = 'Suite';
Suite.prototype['_fields'] = [
    'body', function(n) { return n.body; }
];
FunctionDef.prototype['_astname'] = 'FunctionDef';
FunctionDef.prototype['_fields'] = [
    'name', function(n) { return n.name; },
    'args', function(n) { return n.args; },
    'body', function(n) { return n.body; },
    'decorator_list', function(n) { return n.decorator_list; }
];
ClassDef.prototype['_astname'] = 'ClassDef';
ClassDef.prototype['_fields'] = [
    'name', function(n) { return n.name; },
    'bases', function(n) { return n.bases; },
    'body', function(n) { return n.body; },
    'decorator_list', function(n) { return n.decorator_list; }
];
ReturnStatement.prototype['_astname'] = 'ReturnStatement';
ReturnStatement.prototype['_fields'] = [
    'value', function(n) { return n.value; }
];
DeleteExpression.prototype['_astname'] = 'Delete';
DeleteExpression.prototype['_fields'] = [
    'targets', function(n) { return n.targets; }
];
Assign.prototype['_astname'] = 'Assign';
Assign.prototype['_fields'] = [
    'targets', function(n) { return n.targets; },
    'value', function(n) { return n.value; }
];
AugAssign.prototype['_astname'] = 'AugAssign';
AugAssign.prototype['_fields'] = [
    'target', function(n) { return n.target; },
    'op', function(n) { return n.op; },
    'value', function(n) { return n.value; }
];
Print.prototype['_astname'] = 'Print';
Print.prototype['_fields'] = [
    'dest', function(n) { return n.dest; },
    'values', function(n) { return n.values; },
    'nl', function(n) { return n.nl; }
];
ForStatement.prototype['_astname'] = 'ForStatement';
ForStatement.prototype['_fields'] = [
    'target', function(n) { return n.target; },
    'iter', function(n) { return n.iter; },
    'body', function(n) { return n.body; },
    'orelse', function(n) { return n.orelse; }
];
WhileStatement.prototype['_astname'] = 'WhileStatement';
WhileStatement.prototype['_fields'] = [
    'test', function(n) { return n.test; },
    'body', function(n) { return n.body; },
    'orelse', function(n) { return n.orelse; }
];
IfStatement.prototype['_astname'] = 'IfStatement';
IfStatement.prototype['_fields'] = [
    'test', function(n) { return n.test; },
    'body', function(n) { return n.body; },
    'orelse', function(n) { return n.orelse; }
];
WithStatement.prototype['_astname'] = 'WithStatement';
WithStatement.prototype['_fields'] = [
    'context_expr', function(n) { return n.context_expr; },
    'optional_vars', function(n) { return n.optional_vars; },
    'body', function(n) { return n.body; }
];
Raise.prototype['_astname'] = 'Raise';
Raise.prototype['_fields'] = [
    'type', function(n) { return n.type; },
    'inst', function(n) { return n.inst; },
    'tback', function(n) { return n.tback; }
];
TryExcept.prototype['_astname'] = 'TryExcept';
TryExcept.prototype['_fields'] = [
    'body', function(n) { return n.body; },
    'handlers', function(n) { return n.handlers; },
    'orelse', function(n) { return n.orelse; }
];
TryFinally.prototype['_astname'] = 'TryFinally';
TryFinally.prototype['_fields'] = [
    'body', function(n) { return n.body; },
    'finalbody', function(n) { return n.finalbody; }
];
Assert.prototype['_astname'] = 'Assert';
Assert.prototype['_fields'] = [
    'test', function(n) { return n.test; },
    'msg', function(n) { return n.msg; }
];
ImportStatement.prototype['_astname'] = 'Import';
ImportStatement.prototype['_fields'] = [
    'names', function(n) { return n.names; }
];
ImportFrom.prototype['_astname'] = 'ImportFrom';
ImportFrom.prototype['_fields'] = [
    'module', function(n) { return n.module; },
    'names', function(n) { return n.names; },
    'level', function(n) { return n.level; }
];
Exec.prototype['_astname'] = 'Exec';
Exec.prototype['_fields'] = [
    'body', function(n) { return n.body; },
    'globals', function(n) { return n.globals; },
    'locals', function(n) { return n.locals; }
];
Global.prototype['_astname'] = 'Global';
Global.prototype['_fields'] = [
    'names', function(n) { return n.names; }
];
NonLocal.prototype['_astname'] = 'NonLocal';
NonLocal.prototype['_fields'] = [
    'names', function(n) { return n.names; }
];
Expr.prototype['_astname'] = 'Expr';
Expr.prototype['_fields'] = [
    'value', function(n) { return n.value; }
];
Pass.prototype['_astname'] = 'Pass';
Pass.prototype['_fields'] = [
];
BreakStatement.prototype['_astname'] = 'BreakStatement';
BreakStatement.prototype['_fields'] = [
];
ContinueStatement.prototype['_astname'] = 'ContinueStatement';
ContinueStatement.prototype['_fields'] = [
];
BoolOp.prototype['_astname'] = 'BoolOp';
BoolOp.prototype['_fields'] = [
    'op', function(n) { return n.op; },
    'values', function(n) { return n.values; }
];
BinOp.prototype['_astname'] = 'BinOp';
BinOp.prototype['_fields'] = [
    'left', function(n) { return n.left; },
    'op', function(n) { return n.op; },
    'right', function(n) { return n.right; }
];
UnaryOp.prototype['_astname'] = 'UnaryOp';
UnaryOp.prototype['_fields'] = [
    'op', function(n) { return n.op; },
    'operand', function(n) { return n.operand; }
];
Lambda.prototype['_astname'] = 'Lambda';
Lambda.prototype['_fields'] = [
    'args', function(n) { return n.args; },
    'body', function(n) { return n.body; }
];
IfExp.prototype['_astname'] = 'IfExp';
IfExp.prototype['_fields'] = [
    'test', function(n) { return n.test; },
    'body', function(n) { return n.body; },
    'orelse', function(n) { return n.orelse; }
];
Dict.prototype['_astname'] = 'Dict';
Dict.prototype['_fields'] = [
    'keys', function(n) { return n.keys; },
    'values', function(n) { return n.values; }
];
ListComp.prototype['_astname'] = 'ListComp';
ListComp.prototype['_fields'] = [
    'elt', function(n) { return n.elt; },
    'generators', function(n) { return n.generators; }
];
GeneratorExp.prototype['_astname'] = 'GeneratorExp';
GeneratorExp.prototype['_fields'] = [
    'elt', function(n) { return n.elt; },
    'generators', function(n) { return n.generators; }
];
Yield.prototype['_astname'] = 'Yield';
Yield.prototype['_fields'] = [
    'value', function(n) { return n.value; }
];
Compare.prototype['_astname'] = 'Compare';
Compare.prototype['_fields'] = [
    'left', function(n) { return n.left; },
    'ops', function(n) { return n.ops; },
    'comparators', function(n) { return n.comparators; }
];
Call.prototype['_astname'] = 'Call';
Call.prototype['_fields'] = [
    'func', function(n) { return n.func; },
    'args', function(n) { return n.args; },
    'keywords', function(n) { return n.keywords; },
    'starargs', function(n) { return n.starargs; },
    'kwargs', function(n) { return n.kwargs; }
];
Num.prototype['_astname'] = 'Num';
Num.prototype['_fields'] = [
    'n', function(n) { return n.n; }
];
Str.prototype['_astname'] = 'Str';
Str.prototype['_fields'] = [
    's', function(n) { return n.s; }
];
Attribute.prototype['_astname'] = 'Attribute';
Attribute.prototype['_fields'] = [
    'value', function(n) { return n.value; },
    'attr', function(n) { return n.attr; },
    'ctx', function(n) { return n.ctx; }
];
Subscript.prototype['_astname'] = 'Subscript';
Subscript.prototype['_fields'] = [
    'value', function(n) { return n.value; },
    'slice', function(n) { return n.slice; },
    'ctx', function(n) { return n.ctx; }
];
Name.prototype['_astname'] = 'Name';
Name.prototype['_fields'] = [
    'id', function(n) { return n.id; },
    'ctx', function(n) { return n.ctx; }
];
List.prototype['_astname'] = 'List';
List.prototype['_fields'] = [
    'elts', function(n) { return n.elts; },
    'ctx', function(n) { return n.ctx; }
];
Tuple.prototype['_astname'] = 'Tuple';
Tuple.prototype['_fields'] = [
    'elts', function(n) { return n.elts; },
    'ctx', function(n) { return n.ctx; }
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
Ellipsis.prototype['_fields'] = [
];
Slice.prototype['_astname'] = 'Slice';
Slice.prototype['_fields'] = [
    'lower', function(n) { return n.lower; },
    'upper', function(n) { return n.upper; },
    'step', function(n) { return n.step; }
];
ExtSlice.prototype['_astname'] = 'ExtSlice';
ExtSlice.prototype['_fields'] = [
    'dims', function(n) { return n.dims; }
];
Index.prototype['_astname'] = 'Index';
Index.prototype['_fields'] = [
    'value', function(n) { return n.value; }
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
    'target', function(n) { return n.target; },
    'iter', function(n) { return n.iter; },
    'ifs', function(n) { return n.ifs; }
];
ExceptHandler.prototype['_astname'] = 'ExceptHandler';
ExceptHandler.prototype['_fields'] = [
    'type', function(n) { return n.type; },
    'name', function(n) { return n.name; },
    'body', function(n) { return n.body; }
];
Arguments.prototype['_astname'] = 'Arguments';
Arguments.prototype['_fields'] = [
    'args', function(n) { return n.args; },
    'vararg', function(n) { return n.vararg; },
    'kwarg', function(n) { return n.kwarg; },
    'defaults', function(n) { return n.defaults; }
];
Keyword.prototype['_astname'] = 'Keyword';
Keyword.prototype['_fields'] = [
    'arg', function(n) { return n.arg; },
    'value', function(n) { return n.value; }
];
Alias.prototype['_astname'] = 'Alias';
Alias.prototype['_fields'] = [
    'name', function(n) { return n.name; },
    'asname', function(n) { return n.asname; }
];
