import { assert } from './asserts';
import { isNumber } from './base';

/**
 * A token error is exclusively used to indicate EOF situations.
 */
export class TokenError extends Error {
    /**
     * @param message 
     * @param lineNumber 
     * @param columnNumber 
     */
    constructor(message: string, public readonly lineNumber: number, public readonly columnNumber: number) {
        super(message)
        assert(isNumber(lineNumber), "lineNumber must be a number");
        assert(isNumber(columnNumber), "columnNumber must be a number");
    }
}
