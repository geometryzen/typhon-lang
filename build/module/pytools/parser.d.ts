import { Tokens } from './Tokens';
import { Range } from './Range';
export declare type Arc = [number, number];
export declare type Dfa = [Arc[][], {
    [value: number]: number;
}];
/**
 * Describes the shape of the ParseTables objects (which needs to be renamed BTW).
 */
export interface Grammar {
    start: Tokens;
    /**
     *
     */
    dfas: {
        [value: number]: Dfa;
    };
    /**
     * The first index is the symbol for a transition (a number).
     * The second index is the haman-readable decode of the symbol, if it exists, otherwise `null`.
     * Not all symbols have human-readable names.
     * All symbols that have human-readable names are keywords, with one exception.
     * The symbol 0 (zero) is an exceptional symbol and has the human-readavble name 'EMPTY'.
     */
    labels: [number, string | null][];
    /**
     * A mapping from a keyword to the symbol that has been assigned to it.
     */
    keywords: {
        [keyword: string]: number;
    };
    /**
     * A mapping from a token to a symbol.
     */
    tokens: {
        [token: number]: number;
    };
    /**
     * Actually maps from the node constructor name.
     */
    sym: {
        [name: string]: number;
    };
    /**
     * A lookup table for converting the value in the `sym` mapping back to a string.
     */
    number2symbol: {
        [value: number]: string;
    };
    states: any;
}
/**
 * The first element is the line number.
 * The line number is 1-based.
 * The second element is the column.
 * The column is 0-based.
 */
export declare type LineColumn = [number, number];
/**
 * The parse tree (not the abstract syntax tree).
 */
export interface PyNode {
    /**
     * For terminals, the type is defined in the Tokens enumeration.
     * For non-terminals, the type is defined in the generated ParseTables.
     */
    type: Tokens;
    value: string | null;
    range: Range | null;
    used_names?: {
        [name: string]: boolean;
    };
    children: PyNode[] | null;
}
export interface StackElement {
    dfa: Dfa;
    state: number;
    node: PyNode;
}
/**
 * Determines the starting point in the grammar for parsing the source.
 */
export declare enum SourceKind {
    /**
     * Suitable for a module.
     */
    File = 0,
    /**
     * Suitable for execution.
     */
    Eval = 1,
    /**
     * Suitable for a REPL.
     */
    Single = 2,
}
export declare function parse(sourceText: string, sourceKind?: SourceKind): boolean | PyNode;
export declare function parseTreeDump(parseTree: PyNode): string;
