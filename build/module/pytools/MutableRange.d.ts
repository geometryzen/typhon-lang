export declare class MutablePosition {
    line: number;
    column: number;
    constructor(line: number, column: number);
    offset(rows: number, cols: number): void;
}
export declare class MutableRange {
    readonly begin: MutablePosition;
    readonly end: MutablePosition;
    /**
     *
     */
    constructor(begin: MutablePosition, end: MutablePosition);
    offset(rows: number, cols: number): void;
}
