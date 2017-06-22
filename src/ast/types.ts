//
// This module is at the bottom.
// It should only import modules that don't introduce circularity.
//
import { assert } from '../common/asserts';
import { Range } from '../common//Range';

/**
 * A numeric literal used in parsing.
 */
export interface INumericLiteral {
    isFloat(): boolean;
    isInt(): boolean;
    isLong(): boolean;
    radix?: number;
    text?: string;
    toString(): string;
    value?: number;
}

export interface Visitor {
    assign(assign: Assign): void;
    attribute(attribute: Attribute): void;
    binOp(be: BinOp): void;
    callExpression(ce: Call): void;
    classDef(classDef: ClassDef): void;
    compareExpression(ce: Compare): void;
    dict(dict: Dict): void;
    expressionStatement(es: ExpressionStatement): void;
    functionDef(functionDef: FunctionDef): void;
    ifStatement(ifs: IfStatement): void;
    importFrom(importFrom: ImportFrom): void;
    list(list: List): void;
    module(module: Module): void;
    name(name: Name): void;
    num(num: Num): void;
    print(print: Print): void;
    returnStatement(rs: ReturnStatement): void;
    str(str: Str): void;
    forStatement(fs: ForStatement): void;
}

export interface Visitable {
    /**
     * Who am I?
     */
    accept(visitor: Visitor): void;
}

/**
 * Binary operators.
 * TODO: Rename to BinaryOperator. Consider using an enum.
 */
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

export class RangeAnnotated<T> {
    constructor(public readonly value: T, public readonly range: Range) {
        assert(typeof value !== 'undefined', "value must be defined.");
    }
}

export abstract class Expression implements Visitable {
    id?: RangeAnnotated<string>;
    constructor() {
        // Do noting yet.
    }
    accept(visitor: Visitor): void {
        // accept must be implemented by derived classes.
        throw new Error(`"Expression.accept" is not implemented.`);
    }
}

export abstract class Statement implements Visitable {
    lineno?: number;
    accept(visitor: Visitor): void {
        // accept must be implemented by derived classes.
        throw new Error(`"Statement.accept" is not implemented.`);
    }
}

export class IterationStatement extends Statement {
    // statement: Statement;
}

export class Module implements Visitable {
    body: Statement[];
    scopeId: number;
    constructor(body: Statement[]) {
        this.body = body;
    }
    accept(visitor: Visitor): void {
        visitor.module(this);
    }
}

export class Interactive {
    body: any;
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
    name: RangeAnnotated<string>;
    args: Arguments;
    body: Statement[];
    decorator_list: Decorator[];
    scopeId: number;
    returnType: Expression;
    constructor(name: RangeAnnotated<string>, args: Arguments, body: Statement[], returnType: Expression, decorator_list: Decorator[], public readonly range?: Range) {
        super();
        this.name = name;
        this.args = args;
        this.body = body;
        this.decorator_list = decorator_list;
        this.returnType = returnType;
    }
    accept(visitor: Visitor): void {
        visitor.functionDef(this);
    }
}

export class FunctionParamDef {
    name: Name;
    type: Expression;

    constructor(name: Name, type?: Expression) {
        this.name = name;
        if (type) {
            this.type = type;
        }
        else {
            this.type = null;
        }

    }
}
export class ClassDef extends Statement {
    name: RangeAnnotated<string>;
    bases: Expression[];
    body: Statement[];
    decorator_list: Decorator[];
    scopeId: number;
    constructor(name: RangeAnnotated<string>, bases: Expression[], body: Statement[], decorator_list: Decorator[], public readonly range?: Range) {
        super();
        this.name = name;
        this.bases = bases;
        this.body = body;
        this.decorator_list = decorator_list;
    }
    accept(visitor: Visitor): void {
        visitor.classDef(this);
    }
}

export class ReturnStatement extends Statement {
    /**
     * An expression, and probably should be optional.
     */
    value: Expression | Tuple | null;
    constructor(value: Expression | Tuple | null, public readonly range?: Range) {
        super();
        this.value = value;
    }
    accept(visitor: Visitor): void {
        visitor.returnStatement(this);
    }
}

export class DeleteStatement extends Statement {
    targets: Expression[];
    constructor(targets: Expression[], public readonly range?: Range) {
        super();
        this.targets = targets;
    }
}

export type Target = Expression | Tuple;

export class Assign extends Statement {
    targets: Target[];
    value: Target;
    type?: Expression;
    constructor(targets: Target[], value: Target, public readonly range: Range, public readonly eqRange: Range, type?: Expression) {
        super();
        this.targets = targets;
        this.value = value;
        if (type) {
            this.type = type;
        }
    }
    accept(visitor: Visitor): void {
        visitor.assign(this);
    }
}

export type AugAssignOperator = Add | Sub | FloorDiv | Div | Mod | LShift | RShift | BitAnd | BitXor | BitOr | Pow | Mult;

export class AugAssign extends Statement {
    target: Expression | Tuple;
    op: AugAssignOperator;
    value: Expression | Tuple;
    constructor(target: Expression | Tuple, op: AugAssignOperator, value: Expression | Tuple, public readonly range?: Range) {
        super();
        this.target = target;
        this.op = op;
        this.value = value;
    }
}

export class AnnAssign extends Statement {
    value: Expression;
    target: Expression;
    constructor (type: Expression, target: Expression, public readonly range?: Range) {
        super();
        this.value = type;
        this.target = target;
    }
}

export class Print extends Statement {
    dest: Expression;
    values: Expression[];
    nl: boolean;
    constructor(dest: Expression, values: Expression[], nl: boolean, public readonly range?: Range) {
        super();
        this.dest = dest;
        this.values = values;
        this.nl = nl;
    }
    accept(visitor: Visitor): void {
        visitor.print(this);
    }
}

export class ForStatement extends Statement {
    target: Target;
    iter: Expression | Tuple;
    body: Statement[];
    orelse: Statement[];
    constructor(target: Target, iter: Expression | Tuple, body: Statement[], orelse: Statement[], public readonly range?: Range) {
        super();
        this.target = target;
        this.iter = iter;
        this.body = body;
        this.orelse = orelse;
    }
    accept(visitor: Visitor): void {
        visitor.forStatement(this);
    }
}

export class WhileStatement extends IterationStatement {
    test: Expression;
    body: Statement[];
    orelse: Statement[];
    constructor(test: Expression, body: Statement[], orelse: Statement[], public readonly range?: Range) {
        super();
        this.test = test;
        this.body = body;
        this.orelse = orelse;
    }
}

export class IfStatement extends Statement {
    test: Expression;
    consequent: Statement[];
    alternate: Statement[];
    constructor(test: Expression, consequent: Statement[], alternate: Statement[], public readonly range?: Range) {
        super();
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
    accept(visitor: Visitor): void {
        visitor.ifStatement(this);
    }
}

export class WithStatement extends Statement {
    context_expr: Expression;
    optional_vars: Expression | undefined;
    body: Statement[];
    constructor(context_expr: Expression, optional_vars: Expression | undefined, body: Statement[], public readonly range?: Range) {
        super();
        this.context_expr = context_expr;
        this.optional_vars = optional_vars;
        this.body = body;
    }
}

export class Raise extends Statement {
    type: Expression;
    inst: Expression;
    tback: Expression;
    constructor(type: Expression, inst: Expression, tback: Expression, public readonly range?: Range) {
        super();
        this.type = type;
        this.inst = inst;
        this.tback = tback;
    }
}

export class TryExcept extends Statement {
    body: Statement[];
    handlers: ExceptHandler[];
    orelse: Statement[];
    constructor(body: Statement[], handlers: ExceptHandler[], orelse: Statement[], public readonly range?: Range) {
        super();
        this.body = body;
        this.handlers = handlers;
        this.orelse = orelse;
    }
}

export class TryFinally extends Statement {
    body: Statement[];
    finalbody: Statement[];
    constructor(body: Statement[], finalbody: Statement[], public readonly range?: Range) {
        super();
        this.body = body;
        this.finalbody = finalbody;
    }
}

export class Assert extends Statement {
    test: Expression;
    msg: Expression;
    constructor(test: Expression, msg: Expression, public readonly range?: Range) {
        super();
        this.test = test;
        this.msg = msg;
    }
}

export class ImportStatement extends Statement {
    names: Alias[];
    constructor(names: Alias[], public readonly range?: Range) {
        super();
        this.names = names;
    }
}

export class ImportFrom extends Statement {
    module: RangeAnnotated<string>;
    names: Alias[];
    level: number;
    constructor(module: RangeAnnotated<string>, names: Alias[], level: number, public readonly range?: Range) {
        super();
        assert(typeof module.value === 'string', "module must be a string.");
        assert(Array.isArray(names), "names must be an Array.");
        this.module = module;
        this.names = names;
        this.level = level;
    }
    accept(visitor: Visitor): void {
        visitor.importFrom(this);
    }
}

export class Exec extends Statement {
    body: Expression;
    globals: Expression | null;
    locals: Expression | null;
    constructor(body: Expression, globals: Expression | null, locals: Expression | null, public readonly range?: Range) {
        super();
        this.body = body;
        this.globals = globals;
        this.locals = locals;
    }
}

export class Global extends Statement {
    // TODO: RangeAnnotated...
    names: string[];
    constructor(names: string[], public readonly range?: Range) {
        super();
        this.names = names;
    }
}

export class NonLocal extends Statement {
    // TODO: RangeAnnotated...
    names: string[];
    constructor(names: string[], public readonly range?: Range) {
        super();
        this.names = names;
    }
}

export class ExpressionStatement extends Statement {
    value: Expression;
    constructor(value: Expression, public readonly range?: Range) {
        super();
        this.value = value;
    }
    accept(visitor: Visitor): void {
        visitor.expressionStatement(this);
    }
}

export class Pass extends Statement {
    constructor(public readonly range?: Range) {
        super();
    }
}

export class BreakStatement extends Statement {
    constructor(public readonly range?: Range) {
        super();
    }
}

export class ContinueStatement extends Statement {
    constructor(public readonly range?: Range) {
        super();
    }
}

export class BoolOp extends Expression {
    op: And;
    values: Expression[];
    constructor(op: And, values: Expression[], public readonly range?: Range) {
        super();
        this.op = op;
        this.values = values;
    }
}

export class BinOp extends Expression {
    lhs: Expression;
    op: Operator;
    opRange: Range;
    rhs: Expression;
    constructor(lhs: Expression, ops: { op: Operator; range: Range }, rhs: Expression, readonly range: Range) {
        super();
        this.lhs = lhs;
        this.op = ops.op;
        this.opRange = ops.range;
        this.rhs = rhs;
    }
    accept(visitor: Visitor): void {
        visitor.binOp(this);
    }
}

export type UnaryOperator = UAdd | USub | Invert | Not;

export class UnaryOp extends Expression {
    op: UnaryOperator;
    operand: Expression;
    constructor(op: UnaryOperator, operand: Expression, public readonly range?: Range) {
        super();
        this.op = op;
        this.operand = operand;
    }
}

export class Lambda extends Expression {
    args: Arguments;
    body: Expression;
    scopeId: number;
    constructor(args: Arguments, body: Expression, public readonly range?: Range) {
        super();
        this.args = args;
        this.body = body;
    }
}

export class IfExp extends Expression {
    test: Expression;
    body: Expression;
    orelse: Expression;
    constructor(test: Expression, body: Expression, orelse: Expression, public readonly range?: Range) {
        super();
        this.test = test;
        this.body = body;
        this.orelse = orelse;
    }
}

export class Dict extends Expression {
    keys: Expression[];
    values: Expression[];
    constructor(keys: Expression[], values: Expression[], public readonly range?: Range) {
        super();
        this.keys = keys;
        this.values = values;
    }
    accept(visitor: Visitor): void {
        visitor.dict(this);
    }
}

export class ListComp extends Expression {
    elt: Expression;
    generators: Comprehension[];
    constructor(elt: Expression, generators: Comprehension[], public readonly range?: Range) {
        super();
        this.elt = elt;
        this.generators = generators;
    }
}

export class GeneratorExp extends Expression {
    elt: Expression;
    generators: Comprehension[];
    scopeId: number;
    constructor(elt: Expression, generators: Comprehension[], public readonly range?: Range) {
        super();
        this.elt = elt;
        this.generators = generators;
    }
}

export class Yield extends Expression {
    value: Expression;
    constructor(value: Expression, public readonly range?: Range) {
        super();
        this.value = value;
    }
}

/**
 * TODO: Consider replacing with an enum.
 */
export type CompareOperator = Eq | NotEq | Gt | GtE | Lt | LtE | Is | IsNot | In | NotIn;

export class Compare extends Expression {
    left: Expression;
    ops: CompareOperator[];
    comparators: Expression[];
    constructor(left: Expression, ops: CompareOperator[], comparators: Expression[], public readonly range?: Range) {
        super();
        this.left = left;
        for (const op of ops) {
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
                    throw new Error(`ops must only contain CompareOperator(s) but contains ${op}`);
                }
            }
        }
        this.ops = ops;
        this.comparators = comparators;
    }
    accept(visitor: Visitor): void {
        visitor.compareExpression(this);
    }
}

export class Call extends Expression {
    func: Expression;
    args: (Expression | GeneratorExp)[];
    keywords: Keyword[];
    starargs: Expression | null;
    kwargs: Expression | null;
    constructor(func: Expression, args: (Expression | GeneratorExp)[], keywords: Keyword[], starargs: Expression | null, kwargs: Expression | null) {
        super();
        this.func = func;
        this.args = args;
        this.keywords = keywords;
        this.starargs = starargs;
        this.kwargs = kwargs;
    }
    accept(visitor: Visitor): void {
        visitor.callExpression(this);
    }
}

export class Num extends Expression {
    n: RangeAnnotated<INumericLiteral>;
    constructor(n: RangeAnnotated<INumericLiteral>) {
        super();
        this.n = n;
    }
    accept(visitor: Visitor): void {
        visitor.num(this);
    }
}

export class Str extends Expression {
    s: RangeAnnotated<string>;
    constructor(s: RangeAnnotated<string>) {
        super();
        this.s = s;
    }
    accept(visitor: Visitor): void {
        visitor.str(this);
    }
}

export class Attribute extends Expression {
    value: Expression;
    attr: RangeAnnotated<string>;
    ctx: Load;
    constructor(value: Expression, attr: RangeAnnotated<string>, ctx: Load, public readonly range: Range) {
        super();
        this.value = value;
        this.attr = attr;
        this.ctx = ctx;
    }
    accept(visitor: Visitor): void {
        visitor.attribute(this);
    }
}

export type SubscriptContext = AugLoad | AugStore | Load | Store | Del | Param;

export class Subscript extends Expression {
    value: Expression;
    slice: Ellipsis | Index | Name | Slice;
    ctx: SubscriptContext;
    constructor(value: Expression, slice: Ellipsis | Index | Name | Slice, ctx: SubscriptContext, public readonly range?: Range) {
        super();
        this.value = value;
        this.slice = slice;
        this.ctx = ctx;
    }
}

export class Name extends Expression {
    id: RangeAnnotated<string>;
    ctx: Param;
    constructor(id: RangeAnnotated<string>, ctx: Param) {
        super();
        this.id = id;
        this.ctx = ctx;
    }
    accept(visitor: Visitor): void {
        visitor.name(this);
    }
}

export class List extends Expression {
    elts: Expression[];
    ctx: Load;
    constructor(elts: Expression[], ctx: Load, public readonly range?: Range) {
        super();
        this.elts = elts;
        this.ctx = ctx;
    }
    accept(visitor: Visitor): void {
        visitor.list(this);
    }
}

export class Tuple extends Expression {
    elts: Expression[];
    ctx: Load;
    id?: RangeAnnotated<string>;
    constructor(elts: Expression[], ctx: Load, public readonly range?: Range) {
        super();
        this.elts = elts;
        this.ctx = ctx;
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
    constructor(target: Expression | Tuple, iter: Expression, ifs: any[], public readonly range?: Range) {
        this.target = target;
        this.iter = iter;
        this.ifs = ifs;
    }
}

export class ExceptHandler {
    type: Expression | null;
    name: Expression | null;
    body: Statement[];
    constructor(type: Expression | null, name: Expression | null, body: Statement[], public readonly range?: Range) {
        this.type = type;
        this.name = name;
        this.body = body;
    }
}

export class Arguments {
    args: FunctionParamDef[];
    // TODO: RangeAnnotated...
    vararg: string;
    // TODO: RangeAnnotated...
    kwarg: string;
    defaults: Expression[];
    constructor(args: FunctionParamDef[], vararg: string, kwarg: string, defaults: Expression[]) {
        this.args = args;
        this.vararg = vararg;
        this.kwarg = kwarg;
        this.defaults = defaults;
    }
}

export class Keyword {
    // TODO: RangeAnnotated...
    arg: RangeAnnotated<string>;
    value: Expression;
    constructor(arg: RangeAnnotated<string>, value: Expression) {
        this.arg = arg;
        this.value = value;
    }
}

export class Alias {
    // TODO: RangeAnnotated...
    name: RangeAnnotated<string>;
    asname: string | null;
    constructor(name: RangeAnnotated<string>, asname: string) {
        assert(typeof name.value === 'string');
        assert(typeof asname === 'string' || asname === null);
        this.name = name;
        this.asname = asname;
    }
    toString(): string {
        return `${this.name.value} as ${this.asname}`;
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
    'body', function (n: Expression): void {
        // TOD: Expression is abstract so we should not be here?
        return void 0;
    }
];
Suite.prototype['_astname'] = 'Suite';
Suite.prototype['_fields'] = [
    'body', function (n: Suite) { return n.body; }
];
FunctionDef.prototype['_astname'] = 'FunctionDef';
FunctionDef.prototype['_fields'] = [
    'name', function (n: FunctionDef) { return n.name.value; },
    'args', function (n: FunctionDef) { return n.args; },
    'body', function (n: FunctionDef) { return n.body; },
    'returnType', function (n: FunctionDef) { return n.returnType; },
    'decorator_list', function (n: FunctionDef) { return n.decorator_list; }
];
ClassDef.prototype['_astname'] = 'ClassDef';
ClassDef.prototype['_fields'] = [
    'name', function (n: ClassDef) { return n.name.value; },
    'bases', function (n: ClassDef) { return n.bases; },
    'body', function (n: ClassDef) { return n.body; },
    'decorator_list', function (n: ClassDef) { return n.decorator_list; }
];
ReturnStatement.prototype['_astname'] = 'ReturnStatement';
ReturnStatement.prototype['_fields'] = [
    'value', function (n: ReturnStatement) { return n.value; }
];
DeleteStatement.prototype['_astname'] = 'DeleteStatement';
DeleteStatement.prototype['_fields'] = [
    'targets', function (n: DeleteStatement) { return n.targets; }
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
AnnAssign.prototype['_astname'] = 'AnnAssign';
AnnAssign.prototype['_fields'] = [
    'target', function (n: AnnAssign) { return n.target; },
    'type', function (n: AnnAssign) { return n.value; }
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
    'module', function (n: ImportFrom) { return n.module.value; },
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
    'lhs', function (n: BinOp) { return n.lhs; },
    'op', function (n: BinOp) { return n.op; },
    'rhs', function (n: BinOp) { return n.rhs; }
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
    'n', function (n: Num) { return n.n.value; }
];
Str.prototype['_astname'] = 'Str';
Str.prototype['_fields'] = [
    's', function (n: Str) { return n.s.value; }
];
Attribute.prototype['_astname'] = 'Attribute';
Attribute.prototype['_fields'] = [
    'value', function (n: Attribute) { return n.value; },
    'attr', function (n: Attribute) { return n.attr.value; },
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
    'id', function (n: Name) { return n.id.value; },
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
    'arg', function (n: Keyword) { return n.arg.value; },
    'value', function (n: Keyword) { return n.value; }
];
FunctionParamDef.prototype['_astname'] = 'FunctionParamDef';
FunctionParamDef.prototype['_fields'] = [
    'name', function (n: FunctionParamDef) { return n.name; },
    'type', function (n: FunctionParamDef) { return n.type; }
];
Alias.prototype['_astname'] = 'Alias';
Alias.prototype['_fields'] = [
    'name', function (n: Alias) { return n.name.value; },
    'asname', function (n: Alias) { return n.asname; }
];


