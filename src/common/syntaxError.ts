import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
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
    if (typeof range.begin.line === 'number') {
        e['lineNumber'] = range.begin.line;
    }
    return e;
}
export type LineColumn = [number, number];

export interface Position {
    row: number;
    column: number;
}

export class ParseError extends SyntaxError {
    constructor(message: string) {
        super(message);
        this.name = 'ParseError';
    }
    begin?: Position;
    end?: Position;
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
        e.begin = { row: begin[0] - 1, column: begin[1] };
    }
    if (Array.isArray(end)) {
        e.end = { row: end[0] - 1, column: end[1] };
    }
    return e;
}
