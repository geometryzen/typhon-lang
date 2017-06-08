export declare class Position {
    /**
     * 1-based line number.
     */
    readonly line: number;
    /**
     * 0-based column index.
     */
    readonly column: number;
    /**
     *
     */
    constructor(line: number, column: number);
    toString(): string;
}
export declare function positionComparator(a: Position, b: Position): -1 | 1 | 0;
