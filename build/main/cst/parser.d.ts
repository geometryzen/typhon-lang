import { Tokens } from './Tokens';
import { Range } from '../common/Range';
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
    Single = 2
}
export declare function parse(sourceText: string, sourceKind?: SourceKind): boolean | PyNode;
/**
 * Concrete Syntax Tree
 */
export declare function cstDump(parseTree: PyNode): string;
