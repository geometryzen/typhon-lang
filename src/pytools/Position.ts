export class Position {
    /**
     * 1-based line number.
     */
    public readonly line: number;
    /**
     * 0-based column index.
     */
    public readonly column: number;
    /**
     *
     */
    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
    }
}
