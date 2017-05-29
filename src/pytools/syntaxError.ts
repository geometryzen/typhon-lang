import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
/**
 * @param message
 * @param lineNumber
 */
export function syntaxError(message: string, lineNumber?: number) {
    assert(isString(message), "message must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    const e = new SyntaxError(message/*, fileName*/);
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
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
    if (Array.isArray(begin)) {
        e.begin = { row: begin[0] - 1, column: begin[1] - 1 };
    }
    if (Array.isArray(end)) {
        e.end = { row: end[0] - 1, column: end[1] - 1 };
    }
    return e;
}
