"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("./asserts");
var base_1 = require("./base");
/**
 *
 */
var TokenError = (function () {
    function TokenError(message, lineNumber, columnNumber) {
        asserts_1.assert(base_1.isString(message), "message must be a string");
        asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
        asserts_1.assert(base_1.isNumber(columnNumber), "columnNumber must be a number");
        this.name = "TokenError";
        this.message = message;
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
    }
    return TokenError;
}());
exports.TokenError = TokenError;
