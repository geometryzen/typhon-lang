import { assert } from '../pytools/asserts';
import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';
// import { RangeMapping } from '../pytools/RangeMapping';
import { MutablePosition } from '../pytools/MutableRange';
import { MutableRange } from '../pytools/MutableRange';
import { MappingTree } from './MappingTree';

export enum IndentStyle {
    None = 0,
    Block = 1,
    Smart = 2,
}

export interface EditorOptions {
    baseIndentSize?: number;
    indentSize?: number;
    tabSize?: number;
    newLineCharacter?: string;
    convertTabsToSpaces?: boolean;
    indentStyle?: IndentStyle;
}
export interface FormatCodeOptions extends EditorOptions {
    insertSpaceAfterCommaDelimiter?: boolean;
    insertSpaceAfterSemicolonInForStatements?: boolean;
    insertSpaceBeforeAndAfterBinaryOperators?: boolean;
    insertSpaceAfterConstructor?: boolean;
    insertSpaceAfterKeywordsInControlFlowStatements?: boolean;
    insertSpaceAfterFunctionKeywordForAnonymousFunctions?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces?: boolean;
    insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces?: boolean;
    insertSpaceAfterTypeAssertion?: boolean;
    insertSpaceBeforeFunctionParenthesis?: boolean;
    placeOpenBraceOnNewLineForFunctions?: boolean;
    placeOpenBraceOnNewLineForControlBlocks?: boolean;
}

class StackElement {
    private readonly texts: string[] = [];
    private readonly trees: MappingTree[] = [];
    // FIXME: A mutable position can be renamed to a Cursor.
    private readonly cursor: MutablePosition;
    constructor(public readonly bMark: string, public readonly eMark: string, targetBeginLine: number, targetBeginColumn: number, private trace: boolean) {
        this.cursor = new MutablePosition(targetBeginLine, targetBeginColumn);
    }
    /**
     *
     */
    write(text: string, tree: MappingTree): void {
        assert(typeof text === 'string', "text must be a string");
        this.texts.push(text);
        this.trees.push(tree);

        const cursor = this.cursor;
        const beginLine = cursor.line;
        const beginColumn = cursor.column;
        const endLine = cursor.line;
        const endColumn = beginColumn + text.length;
        if (tree) {
            tree.target.begin.line = beginLine;
            tree.target.begin.column = beginColumn;
            tree.target.end.line = endLine;
            tree.target.end.column = endColumn;
        }
        cursor.line = endLine;
        cursor.column = endColumn;
    }
    snapshot(): { text: string; tree: MappingTree; targetEndLine: number; targetEndColumn: number } {
        const texts = this.texts;
        const trees = this.trees;
        const N = texts.length;
        if (N === 0) {
            return this.package('', null);
        }
        else {
            let sBL = Number.MAX_SAFE_INTEGER;
            let sBC = Number.MAX_SAFE_INTEGER;
            let sEL = Number.MIN_SAFE_INTEGER;
            let sEC = Number.MIN_SAFE_INTEGER;
            let tBL = Number.MAX_SAFE_INTEGER;
            let tBC = Number.MAX_SAFE_INTEGER;
            let tEL = Number.MIN_SAFE_INTEGER;
            let tEC = Number.MIN_SAFE_INTEGER;
            const children: MappingTree[] = [];
            for (let i = 0; i < N; i++) {
                const tree = trees[i];
                if (tree) {
                    sBL = Math.min(sBL, tree.source.begin.line);
                    sBC = Math.min(sBC, tree.source.begin.column);
                    sEL = Math.max(sEL, tree.source.end.line);
                    sEC = Math.max(sEC, tree.source.end.column);

                    tBL = Math.min(tBL, tree.target.begin.line);
                    tBC = Math.min(tBC, tree.target.begin.column);
                    tEL = Math.max(tEL, tree.target.end.line);
                    tEC = Math.max(tEC, tree.target.end.column);

                    if (this.trace) {
                        console.log(`txt = ${texts[i]}`);
                        console.log(`tBL = ${tBL}`);
                        console.log(`tBC = ${tBC}`);
                        console.log(`tEL = ${tEL}`);
                        console.log(`tEC = ${tEC}`);
                    }

                    children.push(tree);
                }
            }
            const text = texts.join("");
            if (children.length > 1) {
                const source = new Range(new Position(sBL, sBC), new Position(sEL, sEC));
                const target = new MutableRange(new MutablePosition(tBL, tBC), new MutablePosition(tEL, tEC));
                return this.package(text, new MappingTree(source, target, children));
            }
            else if (children.length === 1) {
                return this.package(text, children[0]);
            }
            else {
                return this.package(text, null);
            }
        }
    }
    private package(text: string, tree: MappingTree): { text: string; tree: MappingTree; targetEndLine: number; targetEndColumn: number } {
        return { text, tree, targetEndLine: this.cursor.line, targetEndColumn: this.cursor.column };
    }

    public getLine(): number {
        return this.cursor.line;
    }
    public getColumn(): number {
        return this.cursor.column;
    }
}

function IDXLAST<T>(xs: ArrayLike<T>): number {
    return xs.length - 1;
}

/**
 *
 */
class Stack {
    private readonly elements: StackElement[] = [];
    constructor(begin: string, end: string, targetLine: number, targetColumn: number, trace: boolean) {
        this.elements.push(new StackElement(begin, end, targetLine, targetColumn, trace));
    }
    get length() {
        return this.elements.length;
    }
    push(element: StackElement): void {
        this.elements.push(element);
    }
    pop(): StackElement {
        return this.elements.pop();
    }
    write(text: string, tree: MappingTree): void {
        this.elements[IDXLAST(this.elements)].write(text, tree);
    }
    dispose(): TextAndMappings {
        assert(this.elements.length === 1, "stack length should be 1");
        const textAndMappings = this.elements[IDXLAST(this.elements)].snapshot();
        this.pop();
        assert(this.elements.length === 0, "stack length should be 0");
        return textAndMappings;
    }
    getLine(): number {
        return this.elements[IDXLAST(this.elements)].getLine();
    }
    getColumn(): number {
        return this.elements[IDXLAST(this.elements)].getColumn();
    }
}

export interface TextAndMappings {
    text: string;
    tree: MappingTree;
}

/**
 * A smart buffer for writing TypeScript code.
 */
export class TypeWriter {
    private readonly stack: Stack;
    /**
     * Determines the indentation.
     */
    // private indentLevel = 0;
    /**
     * Constructs a TypeWriter instance using the specified options.
     */
    constructor(beginLine: number, beginColumn: number, private options: FormatCodeOptions = {}, private trace = false) {
        this.stack = new Stack('', '', beginLine, beginColumn, trace);
    }
    assign(text: '=', source: Range): void {
        const target = new MutableRange(new MutablePosition(-3, -3), new MutablePosition(-3, -3));
        const tree = new MappingTree(source, target, null);
        this.stack.write(text, tree);
    }
    /**
     * Writes a name (identifier).
     * @param id The identifier string to be written.
     * @param begin The position of the beginning of the name in the original source.
     * @param end The position of the end of the name in the original source.
     */
    name(id: string, source: Range): void {
        if (source) {
            const target = new MutableRange(new MutablePosition(-2, -2), new MutablePosition(-2, -2));
            const tree = new MappingTree(source, target, null);
            this.stack.write(id, tree);
        }
        else {
            this.stack.write(id, null);
        }
    }
    num(text: string, source: Range): void {
        if (source) {
            const target = new MutableRange(new MutablePosition(-3, -3), new MutablePosition(-3, -3));
            const tree = new MappingTree(source, target, null);
            this.stack.write(text, tree);
        }
        else {
            this.stack.write(text, null);
        }
    }
    /**
     * Currently defined to be for string literals in unparsed form.
     */
    str(text: string, source: Range): void {
        if (source) {
            const target = new MutableRange(new MutablePosition(-23, -23), new MutablePosition(-23, -23));
            const tree = new MappingTree(source, target, null);
            this.stack.write(text, tree);
        }
        else {
            this.stack.write(text, null);
        }
    }
    write(text: string, tree: MappingTree): void {
        this.stack.write(text, tree);
    }
    snapshot(): TextAndMappings {
        assert(this.stack.length === 1, "stack length is not zero");
        return this.stack.dispose();
    }
    binOp(binOp: '+' | '-' | '*' | '/' | '|' | '^' | '&' | '<<' | '>>' | '%' | '//', source: Range): void {
        const target = new MutableRange(new MutablePosition(-5, -5), new MutablePosition(-5, -5));
        const tree = new MappingTree(source, target, null);
        if (this.options.insertSpaceBeforeAndAfterBinaryOperators) {
            this.space();
            this.stack.write(binOp, tree);
            this.space();
        }
        else {
            this.stack.write(binOp, tree);
        }
    }
    comma(begin: Position | null, end: Position | null): void {
        if (begin && end) {
            const source = new Range(begin, end);
            const target = new MutableRange(new MutablePosition(-4, -4), new MutablePosition(-4, -4));
            const tree = new MappingTree(source, target, null);
            this.stack.write(',', tree);
        }
        else {
            this.stack.write(',', null);
        }
        if (this.options.insertSpaceAfterCommaDelimiter) {
            this.stack.write(' ', null);
        }
    }
    space(): void {
        this.stack.write(' ', null);
    }
    beginBlock(): void {
        this.prolog('{', '}');
    }
    endBlock(): void {
        this.epilog(false);
    }
    beginBracket(): void {
        this.prolog('[', ']');
    }
    endBracket(): void {
        this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets);
    }
    beginObject(): void {
        this.prolog('{', '}');
    }
    endObject(): void {
        this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces);
    }
    openParen(): void {
        this.prolog('(', ')');
    }
    closeParen(): void {
        this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis);
    }
    beginQuote(): void {
        this.prolog("'", "'");
    }
    endQuote(): void {
        this.epilog(false);
    }
    beginStatement(): void {
        this.prolog('', ';');
    }
    endStatement(): void {
        this.epilog(false);
    }
    private prolog(bMark: string, eMark: string): void {
        const line = this.stack.getLine();
        const column = this.stack.getColumn();
        if (this.trace) {
            console.log(`prolog(bMark = '${bMark}', eMark = '${eMark}')`);
            console.log(`line = ${line}, column = ${column}`);
        }
        this.stack.push(new StackElement(bMark, eMark, line, column, this.trace));
    }
    private epilog(insertSpaceAfterOpeningAndBeforeClosingNonempty: boolean | undefined): void {
        const popped = this.stack.pop();
        const textAndMappings = popped.snapshot();
        const text = textAndMappings.text;
        const tree = textAndMappings.tree;
        // This is where we would be
        const line = textAndMappings.targetEndLine;
        const column = textAndMappings.targetEndColumn;
        if (this.trace) {
            console.log(`epilog(text = '${text}', tree = '${JSON.stringify(tree)}')`);
            console.log(`line = ${line}, column = ${column}`);
        }
        if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            this.write(popped.bMark, null);
            this.space();
            const rows = 0;
            const cols = popped.bMark.length + 1;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.space();
            this.write(popped.eMark, null);
        }
        else {
            this.write(popped.bMark, null);
            const rows = 0;
            const cols = popped.bMark.length;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.write(popped.eMark, null);
        }
    }
}
