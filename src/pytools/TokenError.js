var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", './asserts', './base'], function (require, exports, asserts_1, base_1) {
    "use strict";
    /**
     * @class TokenError
     * @extends SyntaxError
     */
    var TokenError = (function (_super) {
        __extends(TokenError, _super);
        /**
         * @class TokenError
         * @constructor
         * @param {string} message
         * @param {string} fileName
         * @param {number} lineNumber
         * @param {number} columnNumber
         */
        function TokenError(message, fileName, lineNumber, columnNumber) {
            _super.call(this);
            asserts_1.assert(base_1.isString(message), "message must be a string");
            asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
            asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
            asserts_1.assert(base_1.isNumber(columnNumber), "columnNumber must be a number");
            this.name = "TokenError";
            this.message = message;
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.columnNumber = columnNumber;
        }
        return TokenError;
    }(SyntaxError));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = TokenError;
});
