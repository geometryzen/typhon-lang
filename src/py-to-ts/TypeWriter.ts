import { assert } from '../pytools/asserts';
import { Position } from '../pytools/Position';

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
    private readonly buffer: string[] = [];
    constructor(public readonly begin: string, public readonly end: string) {
        // Do nothing yet.
    }
    write(text: string): void {
        this.buffer.push(text);
    }
    snapshot(): string {
        return this.buffer.join("");
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
    write(text: string): void {
        this.elements[IDXLAST(this.elements)].write(text);
    }
    dispose(): string {
        assert(this.elements.length === 1, "stack length should be 1");
        const text = this.elements[IDXLAST(this.elements)].snapshot();
        this.pop();
        assert(this.elements.length === 0, "stack length should be 0");
        return text;
    }
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
    /**
     * Writes a name (identifier).
     * @param id The identifier string to be written.
     * @param begin The position of the beginning of the name in the original source.
     * @param end The position of the end of the name in the original source.
     */
    name(id: string, begin: Position, end: Position): void {
        this.write(id);
    }
    num(text: string, begin: Position, end: Position): void {
        this.write(text);
    }
    write(text: string): void {
        this.stack.write(text);
    }
    snapshot(): string {
        assert(this.stack.length === 1, "stack length is not zero");
        const text = this.stack.dispose();
        return text;
    }
    binOp(binOp: '+' | '-' | '*' | '/' | '|' | '^' | '&' | '<<' | '>>' | '%' | '//'): void {
        if (this.options.insertSpaceBeforeAndAfterBinaryOperators) {
            this.space();
            this.stack.write(binOp);
            this.space();
        }
        else {
            this.stack.write(binOp);
        }
    }
    comma(): void {
        this.stack.write(',');
        if (this.options.insertSpaceAfterCommaDelimiter) {
            this.stack.write(' ');
        }
    }
    space(): void {
        this.stack.write(' ');
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
        const text = popped.snapshot();
        this.write(popped.begin);
        if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            this.space();
            this.write(text);
            this.space();
        }
        else {
            this.write(text);
        }
        this.write(popped.end);
    }
}
