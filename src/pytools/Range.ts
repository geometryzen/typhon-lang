import { Position } from './Position';

export class Range {
    public readonly begin: Position;
    public readonly end: Position;
    /**
     *
     */
    constructor(begin: Position, end: Position) {
        this.begin = begin;
        this.end = end;
    }
}
