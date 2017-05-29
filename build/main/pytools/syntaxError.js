"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var asserts_1 = require("./asserts");
var base_1 = require("./base");
/**
 * @param message
 * @param lineNumber
 */
function syntaxError(message, lineNumber) {
    asserts_1.assert(base_1.isString(message), "message must be a string");
    if (base_1.isDef(lineNumber)) {
        asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message /*, fileName*/);
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
exports.syntaxError = syntaxError;
var ParseError = (function (_super) {
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
    if (Array.isArray(begin)) {
        e.begin = { row: begin[0] - 1, column: begin[1] - 1 };
    }
    if (Array.isArray(end)) {
        e.end = { row: end[0] - 1, column: end[1] - 1 };
    }
    return e;
}
exports.parseError = parseError;
