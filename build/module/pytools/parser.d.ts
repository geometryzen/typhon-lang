import { Tokens } from './Tokens';
/**
 * Decode this!!!
 */
export declare type Arc = [number, number];
export declare type State = [Arc[], [[number, number]], [[number, number]]];
export declare type Dfa = [State, {
    [value: number]: number;
}];
/**
 * Describes the shape of the ParseTables objects (which needs to be renamed BTW).
 */
export interface Grammar {
    start: Tokens;
    dfas: {
        [value: number]: Dfa;
    };
    labels: number[][];
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
export declare function parse(filename: string, input: string): boolean | PyNode;
export declare function parseTreeDump(n: PyNode): string;
