import {assert} from './asserts';
import {isNumber, isString} from './base';

/**
 * @class TokenError
 * @extends SyntaxError
 */
export default class TokenError extends SyntaxError {
    name: string;
    message: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    /**
     * @class TokenError
     * @constructor
     * @param {string} message
     * @param {string} fileName
     * @param {number} lineNumber
     * @param {number} columnNumber
     */
    constructor(message: string, fileName: string, lineNumber: number, columnNumber: number) {
        super();
        assert(isString(message), "message must be a string");
        assert(isString(fileName), "fileName must be a string");
        assert(isNumber(lineNumber), "lineNumber must be a number");
        assert(isNumber(columnNumber), "columnNumber must be a number");

        this.name = "TokenError";
        this.message = message;
        this.fileName = fileName;
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
    }
}
