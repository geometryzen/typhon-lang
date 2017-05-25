"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("./asserts");
var base_1 = require("./base");
/**
 * @param {string} message
 * @param {string} fileName
 * @param {number=} lineNumber
 */
function default_1(message, fileName, lineNumber) {
    asserts_1.assert(base_1.isString(message), "message must be a string");
    asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
    if (base_1.isDef(lineNumber)) {
        asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
    }
    var e = new SyntaxError(message /*, fileName*/);
    e['fileName'] = fileName;
    if (typeof lineNumber === 'number') {
        e['lineNumber'] = lineNumber;
    }
    return e;
}
exports.default = default_1;
