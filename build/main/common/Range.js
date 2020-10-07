"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
var asserts_1 = require("./asserts");
var Range = /** @class */ (function () {
    /**
     *
     */
    function Range(begin, end) {
        asserts_1.assert(begin, "begin must be defined");
        asserts_1.assert(end, "end must be defined");
        this.begin = begin;
        this.end = end;
    }
    Range.prototype.toString = function () {
        return this.begin + " to " + this.end;
    };
    return Range;
}());
exports.Range = Range;
