import { Tokens } from './Tokens';
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
     * The index is the symbol for a transition.
     */
    labels: [number, string | null][];
    keywords: {
        [keyword: string]: number;
    };
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
export declare type LineColumn = [number, number];
/**
 * [begin, end, line]
 */
export declare type ParseContext = [LineColumn, LineColumn, string];
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
    context?: any;
    lineno?: number;
    col_offset?: number;
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
