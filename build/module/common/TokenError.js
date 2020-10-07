import { assert } from './asserts';
import { isNumber, isString } from './base';
/**
 *
 */
var TokenError = /** @class */ (function () {
    function TokenError(message, lineNumber, columnNumber) {
        assert(isString(message), "message must be a string");
        assert(isNumber(lineNumber), "lineNumber must be a number");
        assert(isNumber(columnNumber), "columnNumber must be a number");
        this.name = "TokenError";
        this.message = message;
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
    }
    return TokenError;
}());
export { TokenError };
