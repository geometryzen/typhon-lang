import { INumericLiteral } from './INumericLiteral';

export type Operator = BitOr | BitXor | BitAnd | LShift | RShift | Add | Sub | Mult | Div | FloorDiv | Mod;

export interface HasAstName {
}

export class Load { }
export class Store { }
export class Del { }
export class AugLoad { }
export class AugStore { }
export class Param { }

export class And { }
export class Or { }

export class Add implements HasAstName {
}
export class Sub implements HasAstName {
}
export class Mult implements HasAstName {
}
export class Div implements HasAstName {
}
export class Mod implements HasAstName {
}
export class Pow implements HasAstName {
}
export class LShift implements HasAstName {
}
export class RShift implements HasAstName {
}
export class BitOr implements HasAstName {
}
export class BitXor implements HasAstName {
}
export class BitAnd implements HasAstName {
}
export class FloorDiv implements HasAstName {
}

export class Invert implements HasAstName {
}

export class Not {
}

export class UAdd implements HasAstName {
}
export class USub implements HasAstName {
}

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
    public minChar?: number = -1;  // -1 = "undefined" or "compiler generated"
    public limChar?: number = -1;  // -1 = "undefined" or "compiler generated"
}

export class AST extends ASTSpan {

}

export class ModuleElement extends AST {

}

export class Statement extends ModuleElement {
    lineno?: number;
}

export class IterationStatement extends Statement {
    // statement: Statement;
}

export class Module {
    body: Statement[];
    scopeId: number;
    constructor(body: Statement[]) {
        this.body = body;
    }
}

export class Interactive {
    body: any;
    constructor(body: any) {
        this.body = body;
    }
}

export interface TextRange {
    // pos: number;
    // end: number;
}

export interface Node extends TextRange {
    col_offset?: number;
}

export abstract class Expression implements Node {
    body?: any;
    id?: string;
    lineno?: number;
    col_offset?: number;
    constructor(body: any) {
        this.body = body;
    }
}

export class UnaryExpression extends Expression {

}

export class Suite {
    body: any;
    constructor(body: any) {
        this.body = body;
    }
}

export type Decorator = Attribute | Call | Name;

export class FunctionDef extends Statement {
    name: string;
    args: Arguments;
    body: Statement[];
    decorator_list: Decorator[];
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(name: string, args: Arguments, body: Statement[], decorator_list: Decorator[], lineno: number, col_offset: number) {
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
    bases: Expression[];
    body: Statement[];
    decorator_list: Decorator[];
    lineno?: number;
    col_offset?: number;
    scopeId: number;
    constructor(name: string, bases: Expression[], body: Statement[], decorator_list: Decorator[], lineno: number, col_offset: number) {
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
    value: Expression | Tuple | null;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple | null, lineno: number, col_offset: number) {
        super();
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class DeleteExpression extends UnaryExpression {
    targets: Expression[];
    lineno: number;
    col_offset: number;
    constructor(targets: Expression[], lineno: number, col_offset: number) {
        super(targets);
        this.targets = targets;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export type Target = Expression | Tuple;

export class Assign extends Statement {
    targets: Target[];
    value: Target;
    lineno: number;
    col_offset: number;
    constructor(targets: Target[], value: Target, lineno: number, col_offset: number) {
        super();
        this.targets = targets;
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}
export type AugAssignOperator = Add | Sub | FloorDiv | Div | Mod | LShift | RShift | BitAnd | BitXor | BitOr | Pow | Mult;

export class AugAssign extends Statement {
    target: Expression | Tuple;
    op: AugAssignOperator;
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(target: Expression | Tuple, op: AugAssignOperator, value: Expression | Tuple, lineno: number, col_offset: number) {
        super();
        this.target = target;
        this.op = op;
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Print extends Statement {
    dest: Expression;
    values: Expression[];
    nl: boolean;
    lineno: number;
    col_offset: number;
    constructor(dest: Expression, values: Expression[], nl: boolean, lineno: number, col_offset: number) {
        super();
        this.dest = dest;
        this.values = values;
        this.nl = nl;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ForStatement extends IterationStatement {
    target: Target;
    iter: Expression | Tuple;
    body: Statement[];
    orelse: Statement[];
    lineno: number;
    col_offset: number;
    constructor(target: Target, iter: Expression | Tuple, body: Statement[], orelse: Statement[], lineno: number, col_offset: number) {
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
    test: Expression;
    body: Statement[];
    orelse: Statement[];
    lineno: number;
    col_offset: number;
    constructor(test: Expression, body: Statement[], orelse: Statement[], lineno: number, col_offset: number) {
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
    consequent: Statement[];
    alternate: Statement[];
    lineno: number;
    col_offset: number;
    constructor(test: Expression, consequent: Statement[], alternate: Statement[], lineno: number, col_offset: number) {
        super();
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class WithStatement extends Statement {
    context_expr: Expression;
    optional_vars: Expression | undefined;
    body: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(context_expr: Expression, optional_vars: Expression | undefined, body: Statement[], lineno?: number, col_offset?: number) {
        super();
        this.context_expr = context_expr;
        this.optional_vars = optional_vars;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Raise extends Statement {
    type: Expression;
    inst: Expression;
    tback: Expression;
    lineno: number;
    col_offset: number;
    constructor(type: Expression, inst: Expression, tback: Expression, lineno: number, col_offset: number) {
        super();
        this.type = type;
        this.inst = inst;
        this.tback = tback;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class TryExcept extends Statement {
    body: Statement[];
    handlers: ExceptHandler[];
    orelse: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(body: Statement[], handlers: ExceptHandler[], orelse: Statement[], lineno?: number, col_offset?: number) {
        super();
        this.body = body;
        this.handlers = handlers;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class TryFinally extends Statement {
    body: Statement[];
    finalbody: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(body: Statement[], finalbody: Statement[], lineno?: number, col_offset?: number) {
        super();
        this.body = body;
        this.finalbody = finalbody;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Assert extends Statement {
    test: Expression;
    msg: Expression;
    lineno: number;
    col_offset: number;
    constructor(test: Expression, msg: Expression, lineno: number, col_offset: number) {
        super();
        this.test = test;
        this.msg = msg;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ImportStatement extends Statement {
    names: Alias[];
    lineno: number;
    col_offset: number;
    constructor(names: Alias[], lineno: number, col_offset: number) {
        super();
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ImportFrom extends Statement {
    module: string;
    names: Alias[];
    level: number;
    lineno: number;
    col_offset: number;
    constructor(module: string, names: Alias[], level: number, lineno: number, col_offset: number) {
        super();
        this.module = module;
        this.names = names;
        this.level = level;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Exec {
    body: Expression;
    globals: Expression | null;
    locals: Expression | null;
    lineno?: number;
    col_offset?: number;
    constructor(body: Expression, globals: Expression | null, locals: Expression | null, lineno?: number, col_offset?: number) {
        this.body = body;
        this.globals = globals;
        this.locals = locals;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Global {
    names: string[];
    lineno: number;
    col_offset: number;
    constructor(names: string[], lineno: number, col_offset: number) {
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class NonLocal {
    names: string[];
    lineno: number;
    col_offset: number;
    constructor(names: string[], lineno: number, col_offset: number) {
        this.names = names;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ExpressionStatement extends Statement {
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple, lineno: number, col_offset: number) {
        super();
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Pass {
    lineno: number;
    col_offset: number;
    constructor(lineno: number, col_offset: number) {
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class BreakStatement extends Statement {
    lineno: number;
    col_offset: number;
    constructor(lineno: number, col_offset: number) {
        super();
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ContinueStatement extends Statement {
    lineno: number;
    col_offset: number;
    constructor(lineno: number, col_offset: number) {
        super();
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class BoolOp {
    op: And;
    values: Expression[];
    lineno: number;
    col_offset: number;
    constructor(op: And, values: Expression[], lineno: number, col_offset: number) {
        this.op = op;
        this.values = values;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class BinOp {
    left: Expression;
    op: Operator;
    right: Expression;
    lineno: number;
    col_offset: number;
    constructor(left: Expression, op: Operator, right: Expression, lineno: number, col_offset: number) {
        this.left = left;
        this.op = op;
        this.right = right;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export type UnaryOperator = UAdd | USub | Invert | Not;

export class UnaryOp {
    op: UnaryOperator;
    operand: Expression;
    lineno: number;
    col_offset: number;
    constructor(op: UnaryOperator, operand: Expression, lineno: number, col_offset: number) {
        this.op = op;
        this.operand = operand;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Lambda {
    args: Arguments;
    body: Expression;
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(args: Arguments, body: Expression, lineno: number, col_offset: number) {
        this.args = args;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class IfExp {
    test: Expression;
    body: Expression;
    orelse: Expression;
    lineno: number;
    col_offset: number;
    constructor(test: Expression, body: Expression, orelse: Expression, lineno: number, col_offset: number) {
        this.test = test;
        this.body = body;
        this.orelse = orelse;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Dict {
    keys: Expression[];
    values: Expression[];
    lineno: number;
    col_offset: number;
    constructor(keys: Expression[], values: Expression[], lineno: number, col_offset: number) {
        this.keys = keys;
        this.values = values;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class ListComp {
    elt: Expression;
    generators: Comprehension[];
    lineno: number;
    col_offset: number;
    constructor(elt: Expression, generators: Comprehension[], lineno: number, col_offset: number) {
        this.elt = elt;
        this.generators = generators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class GeneratorExp {
    elt: Expression;
    generators: Comprehension[];
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(elt: Expression, generators: Comprehension[], lineno: number, col_offset: number) {
        this.elt = elt;
        this.generators = generators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Yield {
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple, lineno: number, col_offset: number) {
        this.value = value;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export type CompareOperator = Lt | Gt | Eq | LtE | GtE | NotEq | In | NotIn | IsNot;

export class Compare {
    left: Expression;
    ops: CompareOperator[];
    comparators: Expression[];
    lineno: number;
    col_offset: number;
    constructor(left: Expression, ops: CompareOperator[], comparators: Expression[], lineno: number, col_offset: number) {
        this.left = left;
        this.ops = ops;
        this.comparators = comparators;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Call {
    func: Attribute | Name;
    args: (Expression | GeneratorExp)[];
    keywords: Keyword[];
    starargs: Expression | null;
    kwargs: Expression | null;
    lineno?: number;
    col_offset?: number;
    constructor(func: Attribute | Name, args: (Expression | GeneratorExp)[], keywords: Keyword[], starargs: Expression | null, kwargs: Expression | null, lineno?: number, col_offset?: number) {
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
    lineno: number;
    col_offset: number;
    constructor(n: INumericLiteral, lineno: number, col_offset: number) {
        this.n = n;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Str {
    s: string;
    lineno: number;
    col_offset: number;
    constructor(s: string, lineno: number, col_offset: number) {
        this.s = s;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Attribute {
    value: Attribute | Name;
    attr: string;
    ctx: Load;
    lineno?: number;
    col_offset?: number;
    constructor(value: Attribute | Name, attr: string, ctx: Load, lineno?: number, col_offset?: number) {
        this.value = value;
        this.attr = attr;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export type SubscriptContext = AugLoad | AugStore | Load | Store | Del | Param;

export class Subscript {
    value: Attribute | Name;
    slice: Ellipsis | Index | Name | Slice;
    ctx: SubscriptContext;
    lineno: number;
    col_offset: number;
    constructor(value: Attribute | Name, slice: Ellipsis | Index | Name | Slice, ctx: SubscriptContext, lineno: number, col_offset: number) {
        this.value = value;
        this.slice = slice;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Name extends Expression {
    id: string;
    ctx: Param;
    lineno?: number;
    col_offset?: number;
    constructor(id: string, ctx: Param, lineno?: number, col_offset?: number) {
        super(void 0);
        this.id = id;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class List {
    elts: Expression[];
    ctx: Load;
    lineno: number;
    col_offset: number;
    constructor(elts: Expression[], ctx: Load, lineno: number, col_offset: number) {
        this.elts = elts;
        this.ctx = ctx;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Tuple {
    elts: (Expression | Tuple)[];
    ctx: Load;
    lineno: number;
    col_offset: number;
    id?: string;
    constructor(elts: (Expression | Tuple)[], ctx: Load, lineno: number, col_offset: number) {
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
    lower: Expression;
    upper: Expression;
    step: Expression;
    constructor(lower: Expression, upper: Expression, step: Expression) {
        this.lower = lower;
        this.upper = upper;
        this.step = step;
    }
}

export class ExtSlice {
    dims: (Name | Ellipsis | Index | Slice)[];
    constructor(dims: (Name | Ellipsis | Index | Slice)[]) {
        this.dims = dims;
    }
}

export class Index {
    value: Tuple;
    constructor(value: Tuple) {
        this.value = value;
    }
}

export class Comprehension {
    target: Expression | Tuple;
    iter: Expression;
    ifs: any[];
    constructor(target: Expression | Tuple, iter: Expression, ifs: any[]) {
        this.target = target;
        this.iter = iter;
        this.ifs = ifs;
    }
}

export class ExceptHandler {
    type: Expression | null;
    name: Expression | null;
    body: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(type: Expression | null, name: Expression | null, body: Statement[], lineno?: number, col_offset?: number) {
        this.type = type;
        this.name = name;
        this.body = body;
        this.lineno = lineno;
        this.col_offset = col_offset;
    }
}

export class Arguments {
    args: Name[];
    vararg: string;
    kwarg: string;
    defaults: Expression[];
    constructor(args: Name[], vararg: string, kwarg: string, defaults: Expression[]) {
        this.args = args;
        this.vararg = vararg;
        this.kwarg = kwarg;
        this.defaults = defaults;
    }
}

export class Keyword {
    arg: string;
    value: Expression;
    constructor(arg: string, value: Expression) {
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
    'body', function (n: Module) { return n.body; }
];
Interactive.prototype['_astname'] = 'Interactive';
Interactive.prototype['_fields'] = [
    'body', function (n: Interactive) { return n.body; }
];
Expression.prototype['_astname'] = 'Expression';
Expression.prototype['_fields'] = [
    'body', function (n: Expression) { return n.body; }
];
Suite.prototype['_astname'] = 'Suite';
Suite.prototype['_fields'] = [
    'body', function (n: Suite) { return n.body; }
];
FunctionDef.prototype['_astname'] = 'FunctionDef';
FunctionDef.prototype['_fields'] = [
    'name', function (n: FunctionDef) { return n.name; },
    'args', function (n: FunctionDef) { return n.args; },
    'body', function (n: FunctionDef) { return n.body; },
    'decorator_list', function (n: FunctionDef) { return n.decorator_list; }
];
ClassDef.prototype['_astname'] = 'ClassDef';
ClassDef.prototype['_fields'] = [
    'name', function (n: ClassDef) { return n.name; },
    'bases', function (n: ClassDef) { return n.bases; },
    'body', function (n: ClassDef) { return n.body; },
    'decorator_list', function (n: ClassDef) { return n.decorator_list; }
];
ReturnStatement.prototype['_astname'] = 'ReturnStatement';
ReturnStatement.prototype['_fields'] = [
    'value', function (n: ReturnStatement) { return n.value; }
];
DeleteExpression.prototype['_astname'] = 'Delete';
DeleteExpression.prototype['_fields'] = [
    'targets', function (n: DeleteExpression) { return n.targets; }
];
Assign.prototype['_astname'] = 'Assign';
Assign.prototype['_fields'] = [
    'targets', function (n: Assign) { return n.targets; },
    'value', function (n: Assign) { return n.value; }
];
AugAssign.prototype['_astname'] = 'AugAssign';
AugAssign.prototype['_fields'] = [
    'target', function (n: AugAssign) { return n.target; },
    'op', function (n: AugAssign) { return n.op; },
    'value', function (n: AugAssign) { return n.value; }
];
Print.prototype['_astname'] = 'Print';
Print.prototype['_fields'] = [
    'dest', function (n: Print) { return n.dest; },
    'values', function (n: Print) { return n.values; },
    'nl', function (n: Print) { return n.nl; }
];
ForStatement.prototype['_astname'] = 'ForStatement';
ForStatement.prototype['_fields'] = [
    'target', function (n: ForStatement) { return n.target; },
    'iter', function (n: ForStatement) { return n.iter; },
    'body', function (n: ForStatement) { return n.body; },
    'orelse', function (n: ForStatement) { return n.orelse; }
];
WhileStatement.prototype['_astname'] = 'WhileStatement';
WhileStatement.prototype['_fields'] = [
    'test', function (n: WhileStatement) { return n.test; },
    'body', function (n: WhileStatement) { return n.body; },
    'orelse', function (n: WhileStatement) { return n.orelse; }
];
IfStatement.prototype['_astname'] = 'IfStatement';
IfStatement.prototype['_fields'] = [
    'test', function (n: IfStatement) { return n.test; },
    'consequent', function (n: IfStatement) { return n.consequent; },
    'alternate', function (n: IfStatement) { return n.alternate; }
];
WithStatement.prototype['_astname'] = 'WithStatement';
WithStatement.prototype['_fields'] = [
    'context_expr', function (n: WithStatement) { return n.context_expr; },
    'optional_vars', function (n: WithStatement) { return n.optional_vars; },
    'body', function (n: WithStatement) { return n.body; }
];
Raise.prototype['_astname'] = 'Raise';
Raise.prototype['_fields'] = [
    'type', function (n: Raise) { return n.type; },
    'inst', function (n: Raise) { return n.inst; },
    'tback', function (n: Raise) { return n.tback; }
];
TryExcept.prototype['_astname'] = 'TryExcept';
TryExcept.prototype['_fields'] = [
    'body', function (n: TryExcept) { return n.body; },
    'handlers', function (n: TryExcept) { return n.handlers; },
    'orelse', function (n: TryExcept) { return n.orelse; }
];
TryFinally.prototype['_astname'] = 'TryFinally';
TryFinally.prototype['_fields'] = [
    'body', function (n: TryFinally) { return n.body; },
    'finalbody', function (n: TryFinally) { return n.finalbody; }
];
Assert.prototype['_astname'] = 'Assert';
Assert.prototype['_fields'] = [
    'test', function (n: Assert) { return n.test; },
    'msg', function (n: Assert) { return n.msg; }
];
ImportStatement.prototype['_astname'] = 'Import';
ImportStatement.prototype['_fields'] = [
    'names', function (n: ImportStatement) { return n.names; }
];
ImportFrom.prototype['_astname'] = 'ImportFrom';
ImportFrom.prototype['_fields'] = [
    'module', function (n: ImportFrom) { return n.module; },
    'names', function (n: ImportFrom) { return n.names; },
    'level', function (n: ImportFrom) { return n.level; }
];
Exec.prototype['_astname'] = 'Exec';
Exec.prototype['_fields'] = [
    'body', function (n: Exec) { return n.body; },
    'globals', function (n: Exec) { return n.globals; },
    'locals', function (n: Exec) { return n.locals; }
];
Global.prototype['_astname'] = 'Global';
Global.prototype['_fields'] = [
    'names', function (n: Global) { return n.names; }
];
NonLocal.prototype['_astname'] = 'NonLocal';
NonLocal.prototype['_fields'] = [
    'names', function (n: NonLocal) { return n.names; }
];
ExpressionStatement.prototype['_astname'] = 'ExpressionStatement';
ExpressionStatement.prototype['_fields'] = [
    'value', function (n: ExpressionStatement) { return n.value; }
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
    'op', function (n: BoolOp) { return n.op; },
    'values', function (n: BoolOp) { return n.values; }
];
BinOp.prototype['_astname'] = 'BinOp';
BinOp.prototype['_fields'] = [
    'left', function (n: BinOp) { return n.left; },
    'op', function (n: BinOp) { return n.op; },
    'right', function (n: BinOp) { return n.right; }
];
UnaryOp.prototype['_astname'] = 'UnaryOp';
UnaryOp.prototype['_fields'] = [
    'op', function (n: UnaryOp) { return n.op; },
    'operand', function (n: UnaryOp) { return n.operand; }
];
Lambda.prototype['_astname'] = 'Lambda';
Lambda.prototype['_fields'] = [
    'args', function (n: Lambda) { return n.args; },
    'body', function (n: Lambda) { return n.body; }
];
IfExp.prototype['_astname'] = 'IfExp';
IfExp.prototype['_fields'] = [
    'test', function (n: IfExp) { return n.test; },
    'body', function (n: IfExp) { return n.body; },
    'orelse', function (n: IfExp) { return n.orelse; }
];
Dict.prototype['_astname'] = 'Dict';
Dict.prototype['_fields'] = [
    'keys', function (n: Dict) { return n.keys; },
    'values', function (n: Dict) { return n.values; }
];
ListComp.prototype['_astname'] = 'ListComp';
ListComp.prototype['_fields'] = [
    'elt', function (n: ListComp) { return n.elt; },
    'generators', function (n: ListComp) { return n.generators; }
];
GeneratorExp.prototype['_astname'] = 'GeneratorExp';
GeneratorExp.prototype['_fields'] = [
    'elt', function (n: GeneratorExp) { return n.elt; },
    'generators', function (n: GeneratorExp) { return n.generators; }
];
Yield.prototype['_astname'] = 'Yield';
Yield.prototype['_fields'] = [
    'value', function (n: Yield) { return n.value; }
];
Compare.prototype['_astname'] = 'Compare';
Compare.prototype['_fields'] = [
    'left', function (n: Compare) { return n.left; },
    'ops', function (n: Compare) { return n.ops; },
    'comparators', function (n: Compare) { return n.comparators; }
];
Call.prototype['_astname'] = 'Call';
Call.prototype['_fields'] = [
    'func', function (n: Call) { return n.func; },
    'args', function (n: Call) { return n.args; },
    'keywords', function (n: Call) { return n.keywords; },
    'starargs', function (n: Call) { return n.starargs; },
    'kwargs', function (n: Call) { return n.kwargs; }
];
Num.prototype['_astname'] = 'Num';
Num.prototype['_fields'] = [
    'n', function (n: Num) { return n.n; }
];
Str.prototype['_astname'] = 'Str';
Str.prototype['_fields'] = [
    's', function (n: Str) { return n.s; }
];
Attribute.prototype['_astname'] = 'Attribute';
Attribute.prototype['_fields'] = [
    'value', function (n: Attribute) { return n.value; },
    'attr', function (n: Attribute) { return n.attr; },
    'ctx', function (n: Attribute) { return n.ctx; }
];
Subscript.prototype['_astname'] = 'Subscript';
Subscript.prototype['_fields'] = [
    'value', function (n: Subscript) { return n.value; },
    'slice', function (n: Subscript) { return n.slice; },
    'ctx', function (n: Subscript) { return n.ctx; }
];
Name.prototype['_astname'] = 'Name';
Name.prototype['_fields'] = [
    'id', function (n: Name) { return n.id; },
    'ctx', function (n: Name) { return n.ctx; }
];
List.prototype['_astname'] = 'List';
List.prototype['_fields'] = [
    'elts', function (n: List) { return n.elts; },
    'ctx', function (n: List) { return n.ctx; }
];
Tuple.prototype['_astname'] = 'Tuple';
Tuple.prototype['_fields'] = [
    'elts', function (n: Tuple) { return n.elts; },
    'ctx', function (n: Tuple) { return n.ctx; }
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
    'lower', function (n: Slice) { return n.lower; },
    'upper', function (n: Slice) { return n.upper; },
    'step', function (n: Slice) { return n.step; }
];
ExtSlice.prototype['_astname'] = 'ExtSlice';
ExtSlice.prototype['_fields'] = [
    'dims', function (n: ExtSlice) { return n.dims; }
];
Index.prototype['_astname'] = 'Index';
Index.prototype['_fields'] = [
    'value', function (n: Index) { return n.value; }
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
    'target', function (n: Comprehension) { return n.target; },
    'iter', function (n: Comprehension) { return n.iter; },
    'ifs', function (n: Comprehension) { return n.ifs; }
];
ExceptHandler.prototype['_astname'] = 'ExceptHandler';
ExceptHandler.prototype['_fields'] = [
    'type', function (n: ExceptHandler) { return n.type; },
    'name', function (n: ExceptHandler) { return n.name; },
    'body', function (n: ExceptHandler) { return n.body; }
];
Arguments.prototype['_astname'] = 'Arguments';
Arguments.prototype['_fields'] = [
    'args', function (n: Arguments) { return n.args; },
    'vararg', function (n: Arguments) { return n.vararg; },
    'kwarg', function (n: Arguments) { return n.kwarg; },
    'defaults', function (n: Arguments) { return n.defaults; }
];
Keyword.prototype['_astname'] = 'Keyword';
Keyword.prototype['_fields'] = [
    'arg', function (n: Keyword) { return n.arg; },
    'value', function (n: Keyword) { return n.value; }
];
Alias.prototype['_astname'] = 'Alias';
Alias.prototype['_fields'] = [
    'name', function (n: Alias) { return n.name; },
    'asname', function (n: Alias) { return n.asname; }
];
