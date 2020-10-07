"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TERMS = exports.IDXLAST = exports.CHILDREN = exports.FIND = exports.CHILD = exports.NCH = void 0;
var asserts_1 = require("./asserts");
/**
 * Returns the number of children in the specified node.
 * Returns n.children.length
 */
function NCH(n) {
    asserts_1.assert(n !== undefined);
    if (Array.isArray(n.children)) {
        return n.children.length;
    }
    else {
        return 0;
    }
}
exports.NCH = NCH;
function CHILD(n, i) {
    asserts_1.assert(i !== undefined && i >= 0);
    return CHILDREN(n)[i];
}
exports.CHILD = CHILD;
function FIND(n, type) {
    asserts_1.assert(type !== undefined);
    var children = CHILDREN(n);
    var N = children.length;
    for (var i = 0; i < N; i++) {
        var child = children[i];
        if (child.type === type) {
            return i;
        }
    }
    return -1;
}
exports.FIND = FIND;
function CHILDREN(n) {
    asserts_1.assert(n !== undefined);
    if (n.children) {
        return n.children;
    }
    else {
        throw new Error("node does not have any children");
    }
}
exports.CHILDREN = CHILDREN;
function IDXLAST(xs) {
    return xs.length - 1;
}
exports.IDXLAST = IDXLAST;
/**
 * Returns the terminal nodes of the tree.
 */
function TERMS(n) {
    var childLength = NCH(n);
    if (childLength === 0) {
        return [n];
    }
    else {
        var terminals = [];
        for (var _i = 0, _a = CHILDREN(n); _i < _a.length; _i++) {
            var child = _a[_i];
            for (var _b = 0, _c = TERMS(child); _b < _c.length; _b++) {
                var t = _c[_b];
                terminals.push(t);
            }
        }
        return terminals;
    }
}
exports.TERMS = TERMS;
