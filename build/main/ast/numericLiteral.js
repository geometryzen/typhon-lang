"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @param s
 */
function floatAST(s) {
    var thing = {
        text: s,
        value: parseFloat(s),
        isFloat: function () { return true; },
        isInt: function () { return false; },
        isLong: function () { return false; },
        toString: function () { return s; }
    };
    return thing;
}
exports.floatAST = floatAST;
/**
 * @param n
 */
function intAST(n) {
    var thing = {
        value: n,
        isFloat: function () { return false; },
        isInt: function () { return true; },
        isLong: function () { return false; },
        toString: function () { return '' + n; }
    };
    return thing;
}
exports.intAST = intAST;
/**
 * @param {string} s
 */
function longAST(s, radix) {
    var thing = {
        text: s,
        radix: radix,
        isFloat: function () { return false; },
        isInt: function () { return false; },
        isLong: function () { return true; },
        toString: function () { return s; }
    };
    return thing;
}
exports.longAST = longAST;
