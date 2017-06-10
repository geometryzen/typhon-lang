import { assert } from './asserts';
import { Position } from './Position';

export class Range {
    /**
     * begin is always defined.
     */
    public readonly begin: Position;
    /**
     * end is always defined.
     */
    public readonly end: Position;
    /**
     *
     */
    constructor(begin: Position, end: Position) {
        assert(begin, "begin must be defined");
        assert(end, "end must be defined");
        this.begin = begin;
        this.end = end;
    }
    toString(): string {
        return `${this.begin} to ${this.end}`;
    }
}
