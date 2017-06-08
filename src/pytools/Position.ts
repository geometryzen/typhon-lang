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
    toString(): string {
        return `[${this.line}, ${this.column}]`;
    }
}

export function positionComparator(a: Position, b: Position): -1 | 1 | 0 {
    if (a.line < b.line) {
        return -1;
    }
    else if (a.line > b.line) {
        return 1;
    }
    else {
        if (a.column < b.column) {
            return -1;
        }
        else if (a.column > b.column) {
            return 1;
        }
        else {
            return 0;
        }
    }
}
