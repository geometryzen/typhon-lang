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
/**
 * A smart buffer for writing TypeScript code.
 */
export declare class TypeWriter {
    private options;
    private readonly stack;
    /**
     * Determines the indentation.
     */
    /**
     * Constructs a TypeWriter instance using the specified options.
     */
    constructor(options?: FormatCodeOptions);
    write(text: string): void;
    snapshot(): string;
    binOp(binOp: '+' | '-' | '*' | '/' | '|' | '^' | '&' | '<<' | '>>' | '%' | '//'): void;
    comma(): void;
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
    private prolog(begin, end);
    private epilog(insertSpaceAfterOpeningAndBeforeClosingNonempty);
}
