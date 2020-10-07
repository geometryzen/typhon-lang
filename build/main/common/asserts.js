"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.assert = void 0;
/**
 * We're looking for something that is truthy, not just true.
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
exports.assert = assert;
function fail(message) {
    assert(false, message);
}
exports.fail = fail;
