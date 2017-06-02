import { assert } from '../pytools/asserts';
import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';
// import { RangeMapping } from '../pytools/RangeMapping';
import { MutablePosition } from '../pytools/MutableRange';
import { MutableRange } from '../pytools/MutableRange';
import { MappingTree } from './MappingTree';

const BEGIN_LINE = 1;

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
    constructor(public readonly begin: string, public readonly end: string) {
        // Do nothing yet.
    }
    write(text: string, tree: MappingTree): void {
        this.texts.push(text);
        this.trees.push(tree);
    }
    snapshot(): { text: string; tree: MappingTree } {
        const texts = this.texts;
        const trees = this.trees;
        const N = texts.length;
        if (N === 0) {
            return { text: '', tree: null };
        }
        else if (N === 1) {
            const text = texts[0];
            const tree = trees[0];
            let line = BEGIN_LINE;
            let beginColumn = 0;
            const endColumn = beginColumn + text.length;
            if (tree) {
                tree.target = new MutableRange(new MutablePosition(line, beginColumn), new MutablePosition(line, endColumn));
                return { text, tree };
            }
            else {
                return { text, tree: null };
            }
        }
        else {
            let sourceBeginLine = Number.MAX_SAFE_INTEGER;
            let sourceBeginColumn = Number.MAX_SAFE_INTEGER;
            let sourceEndLine = Number.MIN_SAFE_INTEGER;
            let sourceEndColumn = Number.MIN_SAFE_INTEGER;
            let targetBeginLine = Number.MAX_SAFE_INTEGER;
            const children: MappingTree[] = [];
            let line = BEGIN_LINE;
            let beginColumn = 0;
            for (let i = 0; i < N; i++) {
                const text = texts[i];
                const tree = trees[i];
                const endColumn = beginColumn + text.length;
                if (tree) {
                    assert(tree, "mapping must be defined");
                    if (tree.source && tree.source.begin) {
                        sourceBeginLine = Math.min(sourceBeginLine, tree.source.begin.line);
                        sourceBeginColumn = Math.min(sourceBeginColumn, tree.source.begin.column);
                    }
                    if (tree.source && tree.source.end) {
                        sourceEndLine = Math.max(sourceEndLine, tree.source.end.line);
                        sourceEndColumn = Math.max(sourceEndColumn, tree.source.end.column);
                    }
                    tree.target = new MutableRange(new MutablePosition(line, beginColumn), new MutablePosition(line, endColumn));
                    children.push(tree);
                }
                beginColumn = endColumn;
            }
            const text = texts.join("");
            if (children.length > 1) {
                const source = new Range(new Position(sourceBeginLine, sourceBeginColumn), new Position(sourceEndLine, sourceEndColumn));
                const target = new MutableRange(new MutablePosition(targetBeginLine, -10), new MutablePosition(-10, -10));
                return { text, tree: new MappingTree(source, target, children) };
            }
            else if (children.length === 1) {
                return { text, tree: children[0] };
            }
            else {
                return { text, tree: null };
            }
        }
    }
}

function IDXLAST<T>(xs: ArrayLike<T>): number {
    return xs.length - 1;
}

class Stack {
    private readonly elements: StackElement[] = [];
    constructor() {
        this.elements.push(new StackElement('', ''));
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
}

export interface TextAndMappings {
    text: string;
    tree: MappingTree;
}

/**
 * A smart buffer for writing TypeScript code.
 */
export class TypeWriter {
    // private readonly buffer: string[] = [];
    private readonly stack: Stack = new Stack();
    /**
     * Determines the indentation.
     */
    // private indentLevel = 0;
    /**
     * Constructs a TypeWriter instance using the specified options.
     */
    constructor(private options: FormatCodeOptions = {}) {
        // Do nothing.
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
    private prolog(begin: string, end: string): void {
        this.stack.push(new StackElement(begin, end));
    }
    private epilog(insertSpaceAfterOpeningAndBeforeClosingNonempty: boolean | undefined): void {
        const popped = this.stack.pop();
        const textAndMappings = popped.snapshot();
        const text = textAndMappings.text;
        const tree = textAndMappings.tree;
        if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            this.write(popped.begin, null);
            this.space();
            const rows = 0;
            const cols = popped.begin.length + 1;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.space();
            this.write(popped.end, null);
        }
        else {
            this.write(popped.begin, null);
            const rows = 0;
            const cols = popped.begin.length;
            if (tree) {
                tree.offset(rows, cols);
            }
            this.write(text, tree);
            this.write(popped.end, null);
        }
    }
}
