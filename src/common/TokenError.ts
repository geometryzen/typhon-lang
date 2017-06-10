import { assert } from './asserts';
import { isNumber, isString } from './base';

/**
 *
 */
export class TokenError {
    name: string;
    message: string;
    lineNumber: number;
    columnNumber: number;
    constructor(message: string, lineNumber: number, columnNumber: number) {
        assert(isString(message), "message must be a string");
        assert(isNumber(lineNumber), "lineNumber must be a number");
        assert(isNumber(columnNumber), "columnNumber must be a number");

        this.name = "TokenError";
        this.message = message;
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
    }
}
