import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';
import { MappingTree } from './MappingTree';
export declare enum IndentStyle {
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
export interface TextAndMappings {
    text: string;
    tree: MappingTree;
}
/**
 * A smart buffer for writing TypeScript code.
 */
export declare class TypeWriter {
    private options;
    private trace;
    private readonly stack;
    /**
     * Determines the indentation.
     */
    /**
     * Constructs a TypeWriter instance using the specified options.
     */
    constructor(beginLine: number, beginColumn: number, options?: FormatCodeOptions, trace?: boolean);
    assign(text: '=', source: Range): void;
    /**
     * Writes a name (identifier).
     * @param id The identifier string to be written.
     * @param begin The position of the beginning of the name in the original source.
     * @param end The position of the end of the name in the original source.
     */
    name(id: string, source: Range): void;
    num(text: string, source: Range): void;
    /**
     * Currently defined to be for string literals in unparsed form.
     */
    str(text: string, source: Range): void;
    write(text: string, tree: MappingTree): void;
    snapshot(): TextAndMappings;
    binOp(binOp: '+' | '-' | '*' | '/' | '|' | '^' | '&' | '<<' | '>>' | '%' | '//', source: Range): void;
    comma(begin: Position | null, end: Position | null): void;
    space(): void;
    beginBlock(): void;
    endBlock(): void;
    beginBracket(): void;
    endBracket(): void;
    beginObject(): void;
    endObject(): void;
    openParen(): void;
    closeParen(): void;
    beginQuote(): void;
    endQuote(): void;
    beginStatement(): void;
    endStatement(): void;
    private prolog(bMark, eMark);
    private epilog(insertSpaceAfterOpeningAndBeforeClosingNonempty);
}
