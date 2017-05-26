import { assert } from './asserts';
/**
 * Returns the number of children in the specified node.
 */
export function NCH(n) {
    assert(n !== undefined);
    if (Array.isArray(n.children)) {
        return n.children.length;
    }
    else {
        return 0;
    }
}
export function CHILD(n, i) {
    assert(i !== undefined);
    return CHILDREN(n)[i];
}
export function CHILDREN(n) {
    assert(n !== undefined);
    if (n.children) {
        return n.children;
    }
    else {
        throw new Error("node does not have any children");
    }
}
export function IDXLAST(xs) {
    return xs.length - 1;
}
/**
 * Returns the terminal nodes of the tree.
 */
export function TERMS(n) {
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
