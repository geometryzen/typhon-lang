define(["require", "exports", './asserts', './base'], function (require, exports, asserts_1, base_1) {
    "use strict";
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
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
});
