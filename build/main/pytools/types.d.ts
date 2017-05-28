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
export declare class ASTSpan {
    minChar?: number;
    limChar?: number;
}
export declare class AST extends ASTSpan {
}
export declare class ModuleElement extends AST {
}
export interface TextRange {
}
export interface Node extends TextRange {
    col_offset?: number;
}
export declare abstract class Expression implements Node, Visitable {
    id?: string;
    lineno?: number;
    col_offset?: number;
    constructor();
    accept(visitor: Visitor): void;
}
export declare abstract class Statement extends ModuleElement implements Visitable {
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
    name: string;
    args: Arguments;
    body: Statement[];
    decorator_list: Decorator[];
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(name: string, args: Arguments, body: Statement[], decorator_list: Decorator[], lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class ClassDef extends Statement {
    name: string;
    bases: Expression[];
    body: Statement[];
    decorator_list: Decorator[];
    lineno?: number;
    col_offset?: number;
    scopeId: number;
    constructor(name: string, bases: Expression[], body: Statement[], decorator_list: Decorator[], lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class ReturnStatement extends Statement {
    /**
     * An expression, and probably should be optional.
     */
    value: Expression | Tuple | null;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple | null, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class DeleteStatement extends Statement {
    targets: Expression[];
    lineno: number;
    col_offset: number;
    constructor(targets: Expression[], lineno: number, col_offset: number);
}
export declare type Target = Expression | Tuple;
export declare class Assign extends Statement {
    targets: Target[];
    value: Target;
    lineno: number;
    col_offset: number;
    constructor(targets: Target[], value: Target, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare type AugAssignOperator = Add | Sub | FloorDiv | Div | Mod | LShift | RShift | BitAnd | BitXor | BitOr | Pow | Mult;
export declare class AugAssign extends Statement {
    target: Expression | Tuple;
    op: AugAssignOperator;
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(target: Expression | Tuple, op: AugAssignOperator, value: Expression | Tuple, lineno: number, col_offset: number);
}
export declare class Print extends Statement {
    dest: Expression;
    values: Expression[];
    nl: boolean;
    lineno: number;
    col_offset: number;
    constructor(dest: Expression, values: Expression[], nl: boolean, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class ForStatement extends IterationStatement {
    target: Target;
    iter: Expression | Tuple;
    body: Statement[];
    orelse: Statement[];
    lineno: number;
    col_offset: number;
    constructor(target: Target, iter: Expression | Tuple, body: Statement[], orelse: Statement[], lineno: number, col_offset: number);
}
export declare class WhileStatement extends IterationStatement {
    test: Expression;
    body: Statement[];
    orelse: Statement[];
    lineno: number;
    col_offset: number;
    constructor(test: Expression, body: Statement[], orelse: Statement[], lineno: number, col_offset: number);
}
export declare class IfStatement extends Statement {
    test: Expression;
    consequent: Statement[];
    alternate: Statement[];
    lineno: number;
    col_offset: number;
    constructor(test: Expression, consequent: Statement[], alternate: Statement[], lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class WithStatement extends Statement {
    context_expr: Expression;
    optional_vars: Expression | undefined;
    body: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(context_expr: Expression, optional_vars: Expression | undefined, body: Statement[], lineno?: number, col_offset?: number);
}
export declare class Raise extends Statement {
    type: Expression;
    inst: Expression;
    tback: Expression;
    lineno: number;
    col_offset: number;
    constructor(type: Expression, inst: Expression, tback: Expression, lineno: number, col_offset: number);
}
export declare class TryExcept extends Statement {
    body: Statement[];
    handlers: ExceptHandler[];
    orelse: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(body: Statement[], handlers: ExceptHandler[], orelse: Statement[], lineno?: number, col_offset?: number);
}
export declare class TryFinally extends Statement {
    body: Statement[];
    finalbody: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(body: Statement[], finalbody: Statement[], lineno?: number, col_offset?: number);
}
export declare class Assert extends Statement {
    test: Expression;
    msg: Expression;
    lineno: number;
    col_offset: number;
    constructor(test: Expression, msg: Expression, lineno: number, col_offset: number);
}
export declare class ImportStatement extends Statement {
    names: Alias[];
    lineno: number;
    col_offset: number;
    constructor(names: Alias[], lineno: number, col_offset: number);
}
export declare class ImportFrom extends Statement {
    module: string;
    names: Alias[];
    level: number;
    lineno: number;
    col_offset: number;
    constructor(module: string, names: Alias[], level: number, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class Exec extends Statement {
    body: Expression;
    globals: Expression | null;
    locals: Expression | null;
    lineno?: number;
    col_offset?: number;
    constructor(body: Expression, globals: Expression | null, locals: Expression | null, lineno?: number, col_offset?: number);
}
export declare class Global extends Statement {
    names: string[];
    lineno: number;
    col_offset: number;
    constructor(names: string[], lineno: number, col_offset: number);
}
export declare class NonLocal extends Statement {
    names: string[];
    lineno: number;
    col_offset: number;
    constructor(names: string[], lineno: number, col_offset: number);
}
export declare class ExpressionStatement extends Statement {
    value: Expression;
    lineno: number;
    col_offset: number;
    constructor(value: Expression, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class Pass extends Statement {
    lineno: number;
    col_offset: number;
    constructor(lineno: number, col_offset: number);
}
export declare class BreakStatement extends Statement {
    lineno: number;
    col_offset: number;
    constructor(lineno: number, col_offset: number);
}
export declare class ContinueStatement extends Statement {
    lineno: number;
    col_offset: number;
    constructor(lineno: number, col_offset: number);
}
export declare class BoolOp extends Expression {
    op: And;
    values: Expression[];
    lineno: number;
    col_offset: number;
    constructor(op: And, values: Expression[], lineno: number, col_offset: number);
}
export declare class BinOp extends Expression {
    left: Expression;
    op: Operator;
    right: Expression;
    lineno: number;
    col_offset: number;
    constructor(left: Expression, op: Operator, right: Expression, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare type UnaryOperator = UAdd | USub | Invert | Not;
export declare class UnaryOp extends Expression {
    op: UnaryOperator;
    operand: Expression;
    lineno: number;
    col_offset: number;
    constructor(op: UnaryOperator, operand: Expression, lineno: number, col_offset: number);
}
export declare class Lambda extends Expression {
    args: Arguments;
    body: Expression;
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(args: Arguments, body: Expression, lineno: number, col_offset: number);
}
export declare class IfExp extends Expression {
    test: Expression;
    body: Expression;
    orelse: Expression;
    lineno: number;
    col_offset: number;
    constructor(test: Expression, body: Expression, orelse: Expression, lineno: number, col_offset: number);
}
export declare class Dict extends Expression {
    keys: Expression[];
    values: Expression[];
    lineno: number;
    col_offset: number;
    constructor(keys: Expression[], values: Expression[], lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class ListComp extends Expression {
    elt: Expression;
    generators: Comprehension[];
    lineno: number;
    col_offset: number;
    constructor(elt: Expression, generators: Comprehension[], lineno: number, col_offset: number);
}
export declare class GeneratorExp extends Expression {
    elt: Expression;
    generators: Comprehension[];
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(elt: Expression, generators: Comprehension[], lineno: number, col_offset: number);
}
export declare class Yield extends Expression {
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple, lineno: number, col_offset: number);
}
/**
 * TODO: Consider replacing with an enum.
 */
export declare type CompareOperator = Eq | NotEq | Gt | GtE | Lt | LtE | Is | IsNot | In | NotIn;
export declare class Compare extends Expression {
    left: Expression;
    ops: CompareOperator[];
    comparators: Expression[];
    lineno: number;
    col_offset: number;
    constructor(left: Expression, ops: CompareOperator[], comparators: Expression[], lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class Call extends Expression {
    func: Attribute | Name;
    args: (Expression | GeneratorExp)[];
    keywords: Keyword[];
    starargs: Expression | null;
    kwargs: Expression | null;
    lineno?: number;
    col_offset?: number;
    constructor(func: Attribute | Name, args: (Expression | GeneratorExp)[], keywords: Keyword[], starargs: Expression | null, kwargs: Expression | null, lineno?: number, col_offset?: number);
    accept(visitor: Visitor): void;
}
export declare class Num extends Expression {
    n: INumericLiteral;
    lineno: number;
    col_offset: number;
    constructor(n: INumericLiteral, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class Str extends Expression {
    s: string;
    lineno: number;
    col_offset: number;
    constructor(s: string, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class Attribute extends Expression {
    value: Attribute | Name;
    attr: string;
    ctx: Load;
    lineno?: number;
    col_offset?: number;
    constructor(value: Attribute | Name, attr: string, ctx: Load, lineno?: number, col_offset?: number);
    accept(visitor: Visitor): void;
}
export declare type SubscriptContext = AugLoad | AugStore | Load | Store | Del | Param;
export declare class Subscript extends Expression {
    value: Attribute | Name;
    slice: Ellipsis | Index | Name | Slice;
    ctx: SubscriptContext;
    lineno: number;
    col_offset: number;
    constructor(value: Attribute | Name, slice: Ellipsis | Index | Name | Slice, ctx: SubscriptContext, lineno: number, col_offset: number);
}
export declare class Name extends Expression {
    id: string;
    ctx: Param;
    lineno?: number;
    col_offset?: number;
    constructor(id: string, ctx: Param, lineno?: number, col_offset?: number);
    accept(visitor: Visitor): void;
}
export declare class List extends Expression {
    elts: Expression[];
    ctx: Load;
    lineno: number;
    col_offset: number;
    constructor(elts: Expression[], ctx: Load, lineno: number, col_offset: number);
    accept(visitor: Visitor): void;
}
export declare class Tuple extends Expression {
    elts: (Expression | Tuple)[];
    ctx: Load;
    lineno: number;
    col_offset: number;
    id?: string;
    constructor(elts: (Expression | Tuple)[], ctx: Load, lineno: number, col_offset: number);
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
    target: Expression | Tuple;
    iter: Expression;
    ifs: any[];
    constructor(target: Expression | Tuple, iter: Expression, ifs: any[]);
}
export declare class ExceptHandler {
    type: Expression | null;
    name: Expression | null;
    body: Statement[];
    lineno?: number;
    col_offset?: number;
    constructor(type: Expression | null, name: Expression | null, body: Statement[], lineno?: number, col_offset?: number);
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
    name: string;
    asname: string | null;
    constructor(name: string, asname: string);
    toString(): string;
}
