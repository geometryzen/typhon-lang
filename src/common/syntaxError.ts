import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
import { Position } from './Position';
import { Range } from './Range';
/**
 * @param message
 * @param lineNumber
 */
export function syntaxError(message: string, range?: Range) {
    assert(isString(message), "message must be a string");
    if (isDef(range)) {
        assert(isNumber(range.begin.line), "lineNumber must be a number");
    }
    const e = new SyntaxError(message/*, fileName*/);
    if (range) {
        assert(isNumber(range.begin.line), "lineNumber must be a number");
        if (typeof range.begin.line === 'number') {
            e['lineNumber'] = range.begin.line;
        }
    }

    return e;
}
export type LineColumn = [line: number, column: number];
/*
export interface Position {
    row: number;
    column: number;
}
*/

/**
 * 
 */
// TODO: SyntaxError is an interface that extends Error. So is ParseError really an Error?
export class ParseError extends SyntaxError {
    constructor(message: string) {
        super(message);
        this.name = 'ParseError';
    }
    begin?: Position;
    end?: Position;
}

/**
 * 
 */
export class UnexpectedTokenError extends ParseError {
    /**
     * 
     * @param message 
     * @param begin 
     * @param end 
     */
    constructor(message: string, begin: LineColumn, end: LineColumn) {
        super(message);
        this.name = 'UnexpectedTokenError';
        if (Array.isArray(begin)) {
            this.begin = new Position(begin[0], begin[1]);
        }
        if (Array.isArray(end)) {
            this.end = new Position(end[0], end[1]);
        }
    }
}

/**
 * @param message
 * @param begin
 * @param end
 */
export function parseError(message: string, begin?: LineColumn, end?: LineColumn): ParseError {
    const e = new ParseError(message);
    // Copying from begin and end is important because they change for each token.
    // Notice that the Line is 1-based, but that row is 0-based.
    // Both column and Column are 0-based.
    if (Array.isArray(begin)) {
        e.begin = new Position(begin[0], begin[1]);
    }
    if (Array.isArray(end)) {
        e.end = new Position(end[0], end[1]);
    }
    return e;
}
