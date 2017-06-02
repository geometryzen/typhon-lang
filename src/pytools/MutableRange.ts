import { assert } from '../pytools/asserts';


export class MutablePosition {
    constructor(public line: number, public column: number) {
        // TODO
    }
    offset(rows: number, cols: number) {
        this.line += rows;
        this.column += cols;
    }
}

export class MutableRange {
    /**
     *
     */
    constructor(public readonly begin: MutablePosition, public readonly end: MutablePosition) {
        assert(begin, "begin must be defined");
        assert(end, "end must be defined");
        this.begin = begin;
        this.end = end;
    }
    offset(rows: number, cols: number): void {
        this.begin.offset(rows, cols);
        this.end.offset(rows, cols);
    }
}
