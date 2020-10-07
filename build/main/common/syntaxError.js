"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseError = exports.ParseError = exports.syntaxError = void 0;
var tslib_1 = require("tslib");
var asserts_1 = require("./asserts");
var base_1 = require("./base");
/**
 * @param message
 * @param lineNumber
 */
function syntaxError(message, range) {
    asserts_1.assert(base_1.isString(message), "message must be a string");
    if (base_1.isDef(range)) {
        asserts_1.assert(base_1.isNumber(range.begin.line), "lineNumber must be a number");
    }
    var e = new SyntaxError(message /*, fileName*/);
    if (range) {
        asserts_1.assert(base_1.isNumber(range.begin.line), "lineNumber must be a number");
        if (typeof range.begin.line === 'number') {
            e['lineNumber'] = range.begin.line;
        }
    }
    return e;
}
exports.syntaxError = syntaxError;
var ParseError = /** @class */ (function (_super) {
    tslib_1.__extends(ParseError, _super);
    function ParseError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ParseError';
        return _this;
    }
    return ParseError;
}(SyntaxError));
exports.ParseError = ParseError;
/**
 * @param message
 * @param begin
 * @param end
 */
function parseError(message, begin, end) {
    var e = new ParseError(message);
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
exports.parseError = parseError;
