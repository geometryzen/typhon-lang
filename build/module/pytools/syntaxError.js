import * as tslib_1 from "tslib";
import { assert } from './asserts';
import { isDef, isNumber, isString } from './base';
/**
 * @param message
 * @param lineNumber
 */
export function syntaxError(message, lineNumber) {
    assert(isString(message), "message must be a string");
    if (isDef(lineNumber)) {
        assert(isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message /*, fileName*/);
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
var ParseError = (function (_super) {
    tslib_1.__extends(ParseError, _super);
    function ParseError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ParseError';
        return _this;
    }
    return ParseError;
}(SyntaxError));
export { ParseError };
/**
 * @param message
 * @param begin
 * @param end
 */
export function parseError(message, begin, end) {
    var e = new ParseError(message);
    if (Array.isArray(begin)) {
        e.begin = { row: begin[0] - 1, column: begin[1] - 1 };
    }
    if (Array.isArray(end)) {
        e.end = { row: end[0] - 1, column: end[1] - 1 };
    }
    return e;
}
