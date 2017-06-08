import { Position } from './Position';
export declare class Range {
    /**
     * begin is always defined.
     */
    readonly begin: Position;
    /**
     * end is always defined.
     */
    readonly end: Position;
    /**
     *
     */
    constructor(begin: Position, end: Position);
    toString(): string;
}
