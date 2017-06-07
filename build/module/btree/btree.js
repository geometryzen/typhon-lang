import { TreeNode } from './TreeNode';
import { asearch } from './TreeNode';
/**
 * Strictly compares two strings, character by character. No locales, no number extension.
 * @param a
 * @param b
 * @returns -1 if a < b, 1 if a > b, 0 otherwise
 */
export function strcmp(a, b) {
    var ac;
    var bc;
    for (var i = 0; i < a.length; i++) {
        if (i >= b.length) {
            return 1;
        }
        if ((ac = a.charCodeAt(i)) < (bc = b.charCodeAt(i))) {
            return -1;
        }
        else if (ac > bc) {
            return 1;
        }
        // If same, continue
    }
    return a.length === b.length ? 0 : -1;
}
/**
 * Compares two numbers.
 * @param a
 * @param b
 * @returns -1 if a < b, 1 if a > b, 0 otherwise
 */
export function intcmp(a, b) {
    return a < b ? -1 : (a > b ? 1 : 0);
}
export function computeOrder(order) {
    // Validate order
    if (typeof order === 'undefined') {
        order = 52; // Benchmarks proofed that this is close to the optimum
    }
    else if (typeof order === 'number') {
        order = Math.floor(order);
    }
    else {
        order = parseInt(order, 10);
    }
    if (order < 1) {
        order = 1;
    }
    return order;
}
var Tree = (function () {
    /**
     * Constructs a new Tree.
     */
    function Tree(compare, order) {
        this.compare = compare;
        this.root = new TreeNode(this);
        this.order = computeOrder(order);
        this.minOrder = this.order > 1 ? Math.floor(this.order / 2) : 1;
    }
    /**
     * Inserts a key/value pair into the tree.
     * @param key
     * @param value
     * @param overwrite Whether to overwrite existing values, defaults to `true`
     * @returns true if set, false if already present and overwrite is `false`
     * @throws If the key is undefined or null or the value is undefined
     */
    Tree.prototype.put = function (key, value, overwrite) {
        if (typeof key === 'undefined' || key === null)
            throw (new Error("Illegal key: " + key));
        if (typeof value === 'undefined')
            throw (new Error("Illegal value: " + value));
        return this.root.put(key, value, this.order, this.compare, overwrite);
    };
    /**
     * Gets the value of the specified key.
     * @param key
     * @returns If there is no such key, undefined is returned
     * @throws If the key is undefined or null
     */
    Tree.prototype.get = function (key) {
        if (typeof key === 'undefined' || key === null)
            throw (new Error("Illegal key: " + key));
        return this.root.get(key, this.compare);
    };
    /**
     * Deletes a key from the tree.
     * @param key
     * @returns true if the key has been deleted, false if the key does not exist
     */
    Tree.prototype.del = function (key) {
        if (typeof key === 'undefined' || key === null)
            throw (new Error("Illegal key: " + key));
        return this.root.del(key, this.minOrder, this.compare);
    };
    /**
     * Walks through all keys [minKey, ..., maxKey] in ascending order.
     * @param minKey If omitted or NULL, starts at the beginning
     * @param maxKey If omitted or NULL, walks till the end
     * @param callback Callback receiving the key and the corresponding value as its
     *  parameters. May explicitly return true to stop the loop.
     */
    Tree.prototype.walkAsc = function (minKey, maxKey, callback) {
        if (this.root.leaves.length === 0) {
            return;
        }
        var ptr;
        var index;
        if (minKey === null) {
            ptr = this.root; // set ptr to the outer left node
            while (ptr.nodes[0] !== null) {
                ptr = ptr.nodes[0];
            }
            index = 0; // and start at its first leaf
        }
        else {
            var result = this.root.search(minKey, this.compare);
            if (result.leaf) {
                ptr = result.leaf.parent; // set ptr to the containing node
                index = asearch(ptr.leaves, result.leaf); // and start at its index
            }
            else {
                ptr = result.node; // set ptr to the insertion node
                index = result.index; // and start at the insertion index (key > minKey)
                if (index >= ptr.leaves.length) {
                    if (ptr.parent instanceof Tree) {
                        return; // empty range
                    }
                    index = asearch(ptr.parent.nodes, ptr);
                    if (index >= ptr.parent.leaves.length) {
                        return; // empty range
                    }
                    ptr = ptr.parent;
                }
            }
        }
        // ptr/index now points at our first result
        while (true) {
            if (maxKey !== null && this.compare(ptr.leaves[index].key, maxKey) > 0) {
                break; // if there are no more keys less than maxKey
            }
            if (callback(ptr.leaves[index].key, ptr.leaves[index].value)) {
                break; // if the user explicitly breaks the loop by returning true
            }
            if (ptr.nodes[index + 1] !== null) {
                ptr = ptr.nodes[index + 1];
                index = 0;
                while (ptr.nodes[0] !== null) {
                    ptr = ptr.nodes[0];
                }
            }
            else if (ptr.leaves.length > index + 1) {
                index++;
            }
            else {
                do {
                    if ((ptr.parent instanceof Tree)) {
                        return;
                    }
                    index = asearch(ptr.parent.nodes, ptr);
                    ptr = ptr.parent;
                } while (index >= ptr.leaves.length);
            }
        }
    };
    /**
     * Walks through all keys [minKey, ..., maxKey] in descending order.
     * @param minKey If omitted or null, walks till the beginning
     * @param maxKey If omitted or null, starts at the end
     * @param callback Callback receiving the key and the corresponding value as its
     *  parameters. May explicitly return true to stop the loop.
     */
    Tree.prototype.walkDesc = function (minKey, maxKey, callback) {
        var ptr;
        var index;
        if (maxKey === null) {
            ptr = this.root; // set ptr to the outer right node
            while (ptr.nodes[ptr.nodes.length - 1] !== null) {
                ptr = ptr.nodes[ptr.nodes.length - 1];
            }
            index = ptr.leaves.length - 1; // and start at its last leaf
        }
        else {
            var result = this.root.search(maxKey, this.compare);
            if (result.leaf) {
                ptr = result.leaf.parent; // set ptr to the containing node
                index = asearch(ptr.leaves, result.leaf); // and start at its index
            }
            else {
                ptr = result.node; // set ptr to the insertion node
                index = result.index - 1; // and start at the insertion index-1 (key < maxKey)
                while (index < 0) {
                    if (ptr.parent instanceof Tree) {
                        return; // empty range
                    }
                    index = asearch(ptr.parent.nodes, ptr) - 1;
                    if (index < 0) {
                        return; // empty range
                    }
                    ptr = ptr.parent;
                }
            }
        }
        // ptr/index now points at our first result
        while (true) {
            if (minKey !== null && this.compare(ptr.leaves[index].key, minKey) < 0) {
                break; // if there are no more keys bigger than minKey
            }
            if (callback(ptr.leaves[index].key, ptr.leaves[index].value)) {
                break; // if the user explicitly breaks the loop by returning true
            }
            if (ptr.nodes[index] !== null) {
                ptr = ptr.nodes[index];
                while (ptr.nodes[ptr.nodes.length - 1] !== null) {
                    ptr = ptr.nodes[ptr.nodes.length - 1];
                }
                index = ptr.leaves.length - 1;
            }
            else if (index > 0) {
                index--;
            }
            else {
                do {
                    if ((ptr.parent instanceof Tree)) {
                        return;
                    }
                    index = asearch(ptr.parent.nodes, ptr) - 1;
                    ptr = ptr.parent;
                } while (index < 0);
            }
        }
    };
    /**
     * Counts the number of keys between minKey and maxKey (both inclusive).
     * @param minKey If omitted, counts from the start
     * @param maxKey If omitted, counts till the end
     */
    Tree.prototype.count = function (minKey, maxKey) {
        var n = 0;
        this.walkAsc(typeof minKey !== 'undefined' ? minKey : null, typeof maxKey !== 'undefined' ? maxKey : null, function () { n++; });
        return n;
    };
    /**
     * Prints out all nodes in the tree.
     */
    Tree.prototype.print = function () {
        this.root.print(0);
    };
    /**
     * Returns a string representation of this instance.
     */
    Tree.prototype.toString = function () {
        return "Tree(" + this.order + ") " + this.root.toString();
    };
    return Tree;
}());
export { Tree };
