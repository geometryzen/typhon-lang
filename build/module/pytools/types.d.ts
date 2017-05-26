import { INumericLiteral } from './INumericLiteral';
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
export declare class Statement extends ModuleElement {
    lineno?: number;
}
export declare class IterationStatement extends Statement {
}
export declare class Module {
    body: Statement[];
    scopeId: number;
    constructor(body: Statement[]);
}
export declare class Interactive {
    body: any;
    constructor(body: any);
}
export interface TextRange {
}
export interface Node extends TextRange {
    col_offset?: number;
}
export declare abstract class Expression extends Statement implements Node {
    body?: any;
    id?: string;
    col_offset?: number;
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
}
export declare class ReturnStatement extends Statement {
    /**
     * An expression, and probably should be optional.
     */
    value: Expression | Tuple | null;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple | null, lineno: number, col_offset: number);
}
export declare class DeleteExpression extends UnaryExpression {
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
}
export declare class Exec {
    body: Expression;
    globals: Expression | null;
    locals: Expression | null;
    lineno?: number;
    col_offset?: number;
    constructor(body: Expression, globals: Expression | null, locals: Expression | null, lineno?: number, col_offset?: number);
}
export declare class Global {
    names: string[];
    lineno: number;
    col_offset: number;
    constructor(names: string[], lineno: number, col_offset: number);
}
export declare class NonLocal {
    names: string[];
    lineno: number;
    col_offset: number;
    constructor(names: string[], lineno: number, col_offset: number);
}
export declare class Expr extends Statement {
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple, lineno: number, col_offset: number);
}
export declare class Pass {
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
export declare class BoolOp {
    op: And;
    values: Expression[];
    lineno: number;
    col_offset: number;
    constructor(op: And, values: Expression[], lineno: number, col_offset: number);
}
export declare class BinOp {
    left: Expression;
    op: Operator;
    right: Expression;
    lineno: number;
    col_offset: number;
    constructor(left: Expression, op: Operator, right: Expression, lineno: number, col_offset: number);
}
export declare type UnaryOperator = UAdd | USub | Invert | Not;
export declare class UnaryOp {
    op: UnaryOperator;
    operand: Expression;
    lineno: number;
    col_offset: number;
    constructor(op: UnaryOperator, operand: Expression, lineno: number, col_offset: number);
}
export declare class Lambda {
    args: Arguments;
    body: Expression;
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(args: Arguments, body: Expression, lineno: number, col_offset: number);
}
export declare class IfExp {
    test: Expression;
    body: Expression;
    orelse: Expression;
    lineno: number;
    col_offset: number;
    constructor(test: Expression, body: Expression, orelse: Expression, lineno: number, col_offset: number);
}
export declare class Dict {
    keys: Expression[];
    values: Expression[];
    lineno: number;
    col_offset: number;
    constructor(keys: Expression[], values: Expression[], lineno: number, col_offset: number);
}
export declare class ListComp {
    elt: Expression;
    generators: Comprehension[];
    lineno: number;
    col_offset: number;
    constructor(elt: Expression, generators: Comprehension[], lineno: number, col_offset: number);
}
export declare class GeneratorExp {
    elt: Expression;
    generators: Comprehension[];
    lineno: number;
    col_offset: number;
    scopeId: number;
    constructor(elt: Expression, generators: Comprehension[], lineno: number, col_offset: number);
}
export declare class Yield {
    value: Expression | Tuple;
    lineno: number;
    col_offset: number;
    constructor(value: Expression | Tuple, lineno: number, col_offset: number);
}
export declare type CompareOperator = Lt | Gt | Eq | LtE | GtE | NotEq | In | NotIn | IsNot;
export declare class Compare {
    left: Expression;
    ops: CompareOperator[];
    comparators: Expression[];
    lineno: number;
    col_offset: number;
    constructor(left: Expression, ops: CompareOperator[], comparators: Expression[], lineno: number, col_offset: number);
}
export declare class Call {
    func: Attribute | Name;
    args: (Expression | GeneratorExp)[];
    keywords: Keyword[];
    starargs: Expression | null;
    kwargs: Expression | null;
    lineno?: number;
    col_offset?: number;
    constructor(func: Attribute | Name, args: (Expression | GeneratorExp)[], keywords: Keyword[], starargs: Expression | null, kwargs: Expression | null, lineno?: number, col_offset?: number);
}
export declare class Num {
    n: INumericLiteral;
    lineno: number;
    col_offset: number;
    constructor(n: INumericLiteral, lineno: number, col_offset: number);
}
export declare class Str {
    s: string;
    lineno: number;
    col_offset: number;
    constructor(s: string, lineno: number, col_offset: number);
}
export declare class Attribute {
    value: Attribute | Name;
    attr: string;
    ctx: Load;
    lineno?: number;
    col_offset?: number;
    constructor(value: Attribute | Name, attr: string, ctx: Load, lineno?: number, col_offset?: number);
}
export declare type SubscriptContext = AugLoad | AugStore | Load | Store | Del | Param;
export declare class Subscript {
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
}
export declare class List {
    elts: Expression[];
    ctx: Load;
    lineno: number;
    col_offset: number;
    constructor(elts: Expression[], ctx: Load, lineno: number, col_offset: number);
}
export declare class Tuple {
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
    asname: string;
    constructor(name: string, asname: string);
}
