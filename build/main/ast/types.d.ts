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
export declare type Operator = BitOr | BitXor | BitAnd | LShift | RShift | Add | Sub | Mult | Div | FloorDiv | Mod;
export interface HasAstName {
}
export declare class Load {
}
export declare class Store {
}
export declare class Del {
}
export declare class AugLoad {
}
export declare class AugStore {
}
export declare class Param {
}
export declare class And {
}
export declare class Or {
}
export declare class Add implements HasAstName {
}
export declare class Sub implements HasAstName {
}
export declare class Mult implements HasAstName {
}
export declare class Div implements HasAstName {
}
export declare class Mod implements HasAstName {
}
export declare class Pow implements HasAstName {
}
export declare class LShift implements HasAstName {
}
export declare class RShift implements HasAstName {
}
export declare class BitOr implements HasAstName {
}
export declare class BitXor implements HasAstName {
}
export declare class BitAnd implements HasAstName {
}
export declare class FloorDiv implements HasAstName {
}
export declare class Invert implements HasAstName {
}
export declare class Not {
}
export declare class UAdd implements HasAstName {
}
export declare class USub implements HasAstName {
}
export declare class Eq {
}
export declare class NotEq {
}
export declare class Lt {
}
export declare class LtE {
}
export declare class Gt {
}
export declare class GtE {
}
export declare class Is {
}
export declare class IsNot {
}
export declare class In {
}
export declare class NotIn {
}
export declare class RangeAnnotated<T> {
    readonly value: T;
    readonly range: Range;
    constructor(value: T, range: Range);
}
export declare abstract class Expression implements Visitable {
    id?: RangeAnnotated<string>;
    constructor();
    accept(visitor: Visitor): void;
}
export declare abstract class Statement implements Visitable {
    lineno?: number;
    accept(visitor: Visitor): void;
}
export declare class IterationStatement extends Statement {
}
export declare class Module implements Visitable {
    body: Statement[];
    scopeId: number;
    constructor(body: Statement[]);
    accept(visitor: Visitor): void;
}
export declare class Interactive {
    body: any;
    constructor(body: any);
}
export declare class UnaryExpression extends Expression {
}
export declare class Suite {
    body: any;
    constructor(body: any);
}
export declare type Decorator = Attribute | Call | Name;
export declare class FunctionDef extends Statement {
    readonly range: Range;
    name: RangeAnnotated<string>;
    args: Arguments;
    body: Statement[];
    decorator_list: Decorator[];
    scopeId: number;
    returnType: Expression;
    constructor(name: RangeAnnotated<string>, args: Arguments, body: Statement[], returnType: Expression, decorator_list: Decorator[], range?: Range);
    accept(visitor: Visitor): void;
}
export declare class ClassDef extends Statement {
    readonly range: Range;
    name: RangeAnnotated<string>;
    bases: Expression[];
    body: Statement[];
    decorator_list: Decorator[];
    scopeId: number;
    constructor(name: RangeAnnotated<string>, bases: Expression[], body: Statement[], decorator_list: Decorator[], range?: Range);
    accept(visitor: Visitor): void;
}
export declare class ReturnStatement extends Statement {
    readonly range: Range;
    /**
     * An expression, and probably should be optional.
     */
    value: Expression | Tuple | null;
    constructor(value: Expression | Tuple | null, range?: Range);
    accept(visitor: Visitor): void;
}
export declare class DeleteStatement extends Statement {
    readonly range: Range;
    targets: Expression[];
    constructor(targets: Expression[], range?: Range);
}
export declare type Target = Expression | Tuple;
export declare class Assign extends Statement {
    readonly range: Range;
    readonly eqRange: Range;
    targets: Target[];
    value: Target;
    constructor(targets: Target[], value: Target, range: Range, eqRange: Range);
    accept(visitor: Visitor): void;
}
export declare type AugAssignOperator = Add | Sub | FloorDiv | Div | Mod | LShift | RShift | BitAnd | BitXor | BitOr | Pow | Mult;
export declare class AugAssign extends Statement {
    readonly range: Range;
    target: Expression | Tuple;
    op: AugAssignOperator;
    value: Expression | Tuple;
    constructor(target: Expression | Tuple, op: AugAssignOperator, value: Expression | Tuple, range?: Range);
}
export declare class Print extends Statement {
    readonly range: Range;
    dest: Expression;
    values: Expression[];
    nl: boolean;
    constructor(dest: Expression, values: Expression[], nl: boolean, range?: Range);
    accept(visitor: Visitor): void;
}
export declare class ForStatement extends IterationStatement {
    readonly range: Range;
    target: Target;
    iter: Expression | Tuple;
    body: Statement[];
    orelse: Statement[];
    constructor(target: Target, iter: Expression | Tuple, body: Statement[], orelse: Statement[], range?: Range);
}
export declare class WhileStatement extends IterationStatement {
    readonly range: Range;
    test: Expression;
    body: Statement[];
    orelse: Statement[];
    constructor(test: Expression, body: Statement[], orelse: Statement[], range?: Range);
}
export declare class IfStatement extends Statement {
    readonly range: Range;
    test: Expression;
    consequent: Statement[];
    alternate: Statement[];
    constructor(test: Expression, consequent: Statement[], alternate: Statement[], range?: Range);
    accept(visitor: Visitor): void;
}
export declare class WithStatement extends Statement {
    readonly range: Range;
    context_expr: Expression;
    optional_vars: Expression | undefined;
    body: Statement[];
    constructor(context_expr: Expression, optional_vars: Expression | undefined, body: Statement[], range?: Range);
}
export declare class Raise extends Statement {
    readonly range: Range;
    type: Expression;
    inst: Expression;
    tback: Expression;
    constructor(type: Expression, inst: Expression, tback: Expression, range?: Range);
}
export declare class TryExcept extends Statement {
    readonly range: Range;
    body: Statement[];
    handlers: ExceptHandler[];
    orelse: Statement[];
    constructor(body: Statement[], handlers: ExceptHandler[], orelse: Statement[], range?: Range);
}
export declare class TryFinally extends Statement {
    readonly range: Range;
    body: Statement[];
    finalbody: Statement[];
    constructor(body: Statement[], finalbody: Statement[], range?: Range);
}
export declare class Assert extends Statement {
    readonly range: Range;
    test: Expression;
    msg: Expression;
    constructor(test: Expression, msg: Expression, range?: Range);
}
export declare class ImportStatement extends Statement {
    readonly range: Range;
    names: Alias[];
    constructor(names: Alias[], range?: Range);
}
export declare class ImportFrom extends Statement {
    readonly range: Range;
    module: RangeAnnotated<string>;
    names: Alias[];
    level: number;
    constructor(module: RangeAnnotated<string>, names: Alias[], level: number, range?: Range);
    accept(visitor: Visitor): void;
}
export declare class Exec extends Statement {
    readonly range: Range;
    body: Expression;
    globals: Expression | null;
    locals: Expression | null;
    constructor(body: Expression, globals: Expression | null, locals: Expression | null, range?: Range);
}
export declare class Global extends Statement {
    readonly range: Range;
    names: string[];
    constructor(names: string[], range?: Range);
}
export declare class NonLocal extends Statement {
    readonly range: Range;
    names: string[];
    constructor(names: string[], range?: Range);
}
export declare class ExpressionStatement extends Statement {
    readonly range: Range;
    value: Expression;
    constructor(value: Expression, range?: Range);
    accept(visitor: Visitor): void;
}
export declare class Pass extends Statement {
    readonly range: Range;
    constructor(range?: Range);
}
export declare class BreakStatement extends Statement {
    readonly range: Range;
    constructor(range?: Range);
}
export declare class ContinueStatement extends Statement {
    readonly range: Range;
    constructor(range?: Range);
}
export declare class BoolOp extends Expression {
    readonly range: Range;
    op: And;
    values: Expression[];
    constructor(op: And, values: Expression[], range?: Range);
}
export declare class BinOp extends Expression {
    readonly range: Range;
    lhs: Expression;
    op: Operator;
    opRange: Range;
    rhs: Expression;
    constructor(lhs: Expression, ops: {
        op: Operator;
        range: Range;
    }, rhs: Expression, range: Range);
    accept(visitor: Visitor): void;
}
export declare type UnaryOperator = UAdd | USub | Invert | Not;
export declare class UnaryOp extends Expression {
    readonly range: Range;
    op: UnaryOperator;
    operand: Expression;
    constructor(op: UnaryOperator, operand: Expression, range?: Range);
}
export declare class Lambda extends Expression {
    readonly range: Range;
    args: Arguments;
    body: Expression;
    scopeId: number;
    constructor(args: Arguments, body: Expression, range?: Range);
}
export declare class IfExp extends Expression {
    readonly range: Range;
    test: Expression;
    body: Expression;
    orelse: Expression;
    constructor(test: Expression, body: Expression, orelse: Expression, range?: Range);
}
export declare class Dict extends Expression {
    readonly range: Range;
    keys: Expression[];
    values: Expression[];
    constructor(keys: Expression[], values: Expression[], range?: Range);
    accept(visitor: Visitor): void;
}
export declare class ListComp extends Expression {
    readonly range: Range;
    elt: Expression;
    generators: Comprehension[];
    constructor(elt: Expression, generators: Comprehension[], range?: Range);
}
export declare class GeneratorExp extends Expression {
    readonly range: Range;
    elt: Expression;
    generators: Comprehension[];
    scopeId: number;
    constructor(elt: Expression, generators: Comprehension[], range?: Range);
}
export declare class Yield extends Expression {
    readonly range: Range;
    value: Expression;
    constructor(value: Expression, range?: Range);
}
/**
 * TODO: Consider replacing with an enum.
 */
export declare type CompareOperator = Eq | NotEq | Gt | GtE | Lt | LtE | Is | IsNot | In | NotIn;
export declare class Compare extends Expression {
    readonly range: Range;
    left: Expression;
    ops: CompareOperator[];
    comparators: Expression[];
    constructor(left: Expression, ops: CompareOperator[], comparators: Expression[], range?: Range);
    accept(visitor: Visitor): void;
}
export declare class Call extends Expression {
    func: Expression;
    args: (Expression | GeneratorExp)[];
    keywords: Keyword[];
    starargs: Expression | null;
    kwargs: Expression | null;
    constructor(func: Expression, args: (Expression | GeneratorExp)[], keywords: Keyword[], starargs: Expression | null, kwargs: Expression | null);
    accept(visitor: Visitor): void;
}
export declare class Num extends Expression {
    n: RangeAnnotated<INumericLiteral>;
    constructor(n: RangeAnnotated<INumericLiteral>);
    accept(visitor: Visitor): void;
}
export declare class Str extends Expression {
    s: RangeAnnotated<string>;
    constructor(s: RangeAnnotated<string>);
    accept(visitor: Visitor): void;
}
export declare class Attribute extends Expression {
    readonly range: Range;
    value: Expression;
    attr: RangeAnnotated<string>;
    ctx: Load;
    constructor(value: Expression, attr: RangeAnnotated<string>, ctx: Load, range: Range);
    accept(visitor: Visitor): void;
}
export declare type SubscriptContext = AugLoad | AugStore | Load | Store | Del | Param;
export declare class Subscript extends Expression {
    readonly range: Range;
    value: Expression;
    slice: Ellipsis | Index | Name | Slice;
    ctx: SubscriptContext;
    constructor(value: Expression, slice: Ellipsis | Index | Name | Slice, ctx: SubscriptContext, range?: Range);
}
export declare class Name extends Expression {
    readonly range: Range;
    id: RangeAnnotated<string>;
    ctx: Param;
    constructor(id: RangeAnnotated<string>, ctx: Param, range: Range);
    accept(visitor: Visitor): void;
}
export declare class List extends Expression {
    readonly range: Range;
    elts: Expression[];
    ctx: Load;
    constructor(elts: Expression[], ctx: Load, range?: Range);
    accept(visitor: Visitor): void;
}
export declare class Tuple extends Expression {
    readonly range: Range;
    elts: Expression[];
    ctx: Load;
    id?: RangeAnnotated<string>;
    constructor(elts: Expression[], ctx: Load, range?: Range);
}
export declare class Ellipsis {
    constructor();
}
export declare class Slice {
    lower: Expression;
    upper: Expression;
    step: Expression;
    constructor(lower: Expression, upper: Expression, step: Expression);
}
export declare class ExtSlice {
    dims: (Name | Ellipsis | Index | Slice)[];
    constructor(dims: (Name | Ellipsis | Index | Slice)[]);
}
export declare class Index {
    value: Tuple;
    constructor(value: Tuple);
}
export declare class Comprehension {
    readonly range: Range;
    target: Expression | Tuple;
    iter: Expression;
    ifs: any[];
    constructor(target: Expression | Tuple, iter: Expression, ifs: any[], range?: Range);
}
export declare class ExceptHandler {
    readonly range: Range;
    type: Expression | null;
    name: Expression | null;
    body: Statement[];
    constructor(type: Expression | null, name: Expression | null, body: Statement[], range?: Range);
}
export declare class Arguments {
    args: Name[];
    vararg: string;
    kwarg: string;
    defaults: Expression[];
    constructor(args: Name[], vararg: string, kwarg: string, defaults: Expression[]);
}
export declare class Keyword {
    arg: string;
    value: Expression;
    constructor(arg: string, value: Expression);
}
export declare class Alias {
    name: RangeAnnotated<string>;
    asname: string | null;
    constructor(name: RangeAnnotated<string>, asname: string);
    toString(): string;
}
