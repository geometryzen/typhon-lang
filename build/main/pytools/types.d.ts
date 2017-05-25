import { INumericLiteral } from './INumericLiteral';
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
export declare class Add {
}
export declare class Sub {
}
export declare class Mult {
}
export declare class Div {
}
export declare class Mod {
}
export declare class Pow {
}
export declare class LShift {
}
export declare class RShift {
}
export declare class BitOr {
}
export declare class BitXor {
}
export declare class BitAnd {
}
export declare class FloorDiv {
}
export declare class Invert {
}
export declare class Not {
}
export declare class UAdd {
}
export declare class USub {
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
    lineno: number;
}
export declare class IterationStatement extends Statement {
}
export declare class Module {
    body: Statement[];
    constructor(body: Statement[]);
}
export declare class Interactive {
    body: any;
    constructor(body: any);
}
export interface TextRange {
}
export interface Node extends TextRange {
    col_offset: number;
}
export declare abstract class Expression extends Statement implements Node {
    body?: any;
    id?: string;
    col_offset: number;
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
    constructor(name: string, args: Arguments, body: Statement[], decorator_list: Decorator[], lineno: number, col_offset: number);
}
export declare class ClassDef extends Statement {
    name: string;
    bases: Expression[];
    body: Statement[];
    decorator_list: Decorator[];
    lineno: number;
    col_offset: number;
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
export declare class AugAssign extends Statement {
    target: any;
    op: any;
    value: any;
    lineno: number;
    col_offset: number;
    constructor(target: any, op: any, value: any, lineno: number, col_offset: number);
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
    iter: any;
    body: Statement[];
    orelse: Statement[];
    lineno: number;
    col_offset: number;
    constructor(target: Target, iter: any, body: Statement[], orelse: Statement[], lineno: number, col_offset: number);
}
export declare class WhileStatement extends IterationStatement {
    test: any;
    body: any;
    orelse: any;
    lineno: any;
    col_offset: any;
    constructor(test: any, body: any, orelse: any, lineno: any, col_offset: any);
}
export declare class IfStatement extends Statement {
    test: Expression;
    consequent: Statement[];
    alternate: Statement[];
    lineno: any;
    col_offset: any;
    constructor(test: Expression, consequent: Statement[], alternate: Statement[], lineno: any, col_offset: any);
}
export declare class WithStatement extends Statement {
    context_expr: any;
    optional_vars: any;
    body: any;
    lineno: any;
    col_offset: any;
    constructor(context_expr: any, optional_vars: any, body: any, lineno: any, col_offset: any);
}
export declare class Raise extends Statement {
    type: any;
    inst: any;
    tback: any;
    lineno: any;
    col_offset: any;
    constructor(type: any, inst: any, tback: any, lineno: any, col_offset: any);
}
export declare class TryExcept extends Statement {
    body: Statement[];
    handlers: ExceptHandler[];
    orelse: Statement[];
    lineno: number;
    col_offset: number;
    constructor(body: Statement[], handlers: ExceptHandler[], orelse: Statement[], lineno: number, col_offset: number);
}
export declare class TryFinally extends Statement {
    body: any;
    finalbody: any;
    lineno: any;
    col_offset: any;
    constructor(body: any, finalbody: any, lineno: any, col_offset: any);
}
export declare class Assert extends Statement {
    test: any;
    msg: any;
    lineno: any;
    col_offset: any;
    constructor(test: any, msg: any, lineno: any, col_offset: any);
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
    private level;
    lineno: number;
    col_offset: number;
    constructor(module: string, names: Alias[], level: any, lineno: number, col_offset: number);
}
export declare class Exec {
    body: any;
    globals: any;
    locals: any;
    lineno: number;
    col_offset: number;
    constructor(body: any, globals: any, locals: any, lineno: number, col_offset: number);
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
    value: any;
    lineno: number;
    col_offset: number;
    constructor(value: any, lineno: number, col_offset: number);
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
    left: any;
    op: any;
    right: any;
    lineno: any;
    col_offset: any;
    constructor(left: any, op: any, right: any, lineno: any, col_offset: any);
}
export declare class UnaryOp {
    op: any;
    operand: any;
    lineno: any;
    col_offset: any;
    constructor(op: any, operand: any, lineno: any, col_offset: any);
}
export declare class Lambda {
    args: any;
    body: any;
    lineno: any;
    col_offset: any;
    constructor(args: any, body: any, lineno: any, col_offset: any);
}
export declare class IfExp {
    test: any;
    body: any;
    orelse: any;
    lineno: any;
    col_offset: any;
    constructor(test: any, body: any, orelse: any, lineno: any, col_offset: any);
}
export declare class Dict {
    keys: any;
    values: any;
    lineno: any;
    col_offset: any;
    constructor(keys: any, values: any, lineno: any, col_offset: any);
}
export declare class ListComp {
    elt: any;
    generators: any;
    lineno: any;
    col_offset: any;
    constructor(elt: any, generators: any, lineno: any, col_offset: any);
}
export declare class GeneratorExp {
    elt: any;
    generators: any;
    lineno: any;
    col_offset: any;
    constructor(elt: any, generators: any, lineno: any, col_offset: any);
}
export declare class Yield {
    value: any;
    lineno: any;
    col_offset: any;
    constructor(value: any, lineno: any, col_offset: any);
}
export declare class Compare {
    left: any;
    ops: any;
    comparators: any;
    lineno: any;
    col_offset: any;
    constructor(left: any, ops: any, comparators: any, lineno: any, col_offset: any);
}
export declare class Call {
    func: Attribute | Name;
    args: any;
    keywords: any;
    starargs: any;
    kwargs: any;
    lineno: number;
    col_offset: number;
    constructor(func: Attribute | Name, args: any, keywords: any, starargs: any, kwargs: any, lineno: number, col_offset: number);
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
    value: any;
    attr: any;
    ctx: any;
    lineno: number;
    col_offset: number;
    constructor(value: any, attr: any, ctx: any, lineno: number, col_offset: number);
}
export declare class Subscript {
    value: any;
    slice: any;
    ctx: any;
    lineno: number;
    col_offset: number;
    constructor(value: any, slice: any, ctx: any, lineno: number, col_offset: number);
}
export declare class Name {
    id: any;
    ctx: any;
    lineno: any;
    col_offset: any;
    constructor(id: any, ctx: any, lineno: any, col_offset: any);
}
export declare class List {
    elts: any;
    ctx: any;
    lineno: any;
    col_offset: any;
    constructor(elts: any, ctx: any, lineno: any, col_offset: any);
}
export declare class Tuple {
    elts: any;
    ctx: any;
    lineno: any;
    col_offset: any;
    id?: string;
    constructor(elts: any, ctx: any, lineno: any, col_offset: any);
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
    dims: any;
    constructor(dims: any);
}
export declare class Index {
    value: Tuple;
    constructor(value: Tuple);
}
export declare class Comprehension {
    target: any;
    iter: any;
    ifs: any;
    constructor(target: any, iter: any, ifs: any);
}
export declare class ExceptHandler {
    type: any;
    name: any;
    body: any;
    lineno: any;
    col_offset: any;
    constructor(type: any, name: any, body: any, lineno: any, col_offset: any);
}
export declare class Arguments {
    args: any;
    vararg: any;
    kwarg: any;
    defaults: any;
    constructor(args: any, vararg: any, kwarg: any, defaults: any);
}
export declare class Keyword {
    arg: any;
    value: any;
    constructor(arg: any, value: any);
}
export declare class Alias {
    name: string;
    asname: string;
    constructor(name: string, asname: string);
}
