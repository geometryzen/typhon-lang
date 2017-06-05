import { Leaf } from './Leaf';
import { Tree } from './btree';
function concat(as, bs) {
    var cs = [];
    for (var _i = 0, as_1 = as; _i < as_1.length; _i++) {
        var a = as_1[_i];
        cs.push(a);
    }
    for (var _a = 0, bs_1 = bs; _a < bs_1.length; _a++) {
        var b = bs_1[_a];
        cs.push(b);
    }
    return cs;
}
function concat3(as, bs, cs) {
    return concat(concat(as, bs), cs);
}
/**
 * Searches an array for the specified value.
 * @param {Array} a
 * @param {*} v
 * @returns {number} Index or -1 if not found
 * @private
 */
export function asearch(a, v) {
    // This is faster than Array#indexOf because it's raw. However, we
    // cannot use binary search because nodes do not have a comparable
    // key. If the compiler is smart, it will inline this.
    for (var i = 0; i < a.length; i++) {
        if (a[i] === v)
            return i;
    }
    return -1;
}
var TreeNode = (function () {
    /**
     * Constructs a new TreeNode.
     * @class A TreeNode.
     * @param {!(TreeNode|Tree)} parent Parent node
     * @param {Array.<!Leaf>=} leaves Leaf nodes
     * @param {Array.<TreeNode>=} nodes Child nodes
     * @constructor
     */
    function TreeNode(parent, leaves, nodes) {
        if (leaves === void 0) { leaves = []; }
        if (nodes === void 0) { nodes = [null]; }
        var _this = this;
        /**
         * Parent node.
         * @type {!TreeNode|!Tree}
         */
        this.parent = parent;
        /**
         * Leaf nodes (max. order).
         * @type {!Array.<!Leaf>}
         */
        this.leaves = leaves || [];
        this.leaves.forEach(function (leaf) {
            leaf.parent = _this;
        });
        /**
         * Child nodes (max. order+1).
         * @type {!Array.<TreeNode>}
         */
        this.nodes = nodes || [null];
        this.nodes.forEach(function (node) {
            if (node !== null)
                node.parent = this;
        }, this);
    }
    /**
     * Searches for the node that would contain the specified key.
     * @param {!*} key
     * @returns {{leaf: !Leaf, index: number}|{node: !TreeNode, index: number}} Leaf if the key exists, else the insertion node
     */
    TreeNode.prototype.search = function (key, compare) {
        if (this.leaves.length > 0) {
            var a = this.leaves[0];
            if (compare(a.key, key) === 0)
                return { leaf: a, index: 0 };
            if (compare(key, a.key) < 0) {
                var node_1 = this.nodes[0];
                if (node_1) {
                    return node_1.search(key, compare); // Left
                }
                return { node: this, index: 0 };
            }
            var i = void 0;
            for (i = 1; i < this.leaves.length; i++) {
                var b = this.leaves[i];
                if (compare(b.key, key) === 0)
                    return { leaf: b, index: i };
                if (compare(key, b.key) < 0) {
                    var node_2 = this.nodes[i];
                    if (node_2) {
                        return node_2.search(key, compare); // Inner
                    }
                    return { node: this, index: i };
                }
                a = b;
            }
            var node = this.nodes[i];
            if (node) {
                return node.search(key, compare); // Right
            }
            return { node: this, index: i };
        }
        return { node: this, index: 0 };
    };
    /**
     * Gets the value for the given key.
     * @param {!*} key
     * @returns {*|undefined} If there is no such key, undefined is returned
     */
    TreeNode.prototype.get = function (key, compare) {
        var result = this.search(key, compare);
        if (result.leaf) {
            return result.leaf.value;
        }
        return undefined;
    };
    /**
     * Inserts a key/value pair into this node.
     * @param {!*} key
     * @param {*} value
     * @param {boolean=} overwrite Whether to overwrite existing values, defaults to `true`
     * @returns {boolean} true if successfully set, false if already present and overwrite is `false`
     */
    TreeNode.prototype.put = function (key, value, order, compare, overwrite) {
        var result = this.search(key, compare);
        if (result.leaf) {
            if (typeof overwrite !== 'undefined' && !overwrite) {
                return false;
            }
            result.leaf.value = value;
            return true;
        } // Key already exists
        var node = result.node;
        var index = result.index;
        node.leaves.splice(index, 0, new Leaf(node, key, value));
        node.nodes.splice(index + 1, 0, null);
        if (node.leaves.length > order) {
            node.split(order, compare);
        }
        return true;
    };
    /**
     * Deletes a key from this node.
     * @param {!*} key
     * @returns {boolean} true if the key has been deleted, false if the key does not exist
     */
    TreeNode.prototype.del = function (key, minOrder, compare) {
        var result = this.search(key, compare);
        if (!result.leaf) {
            return false;
        }
        var leaf = result.leaf;
        var node = leaf.parent;
        var index = result.index;
        var left = node.nodes[index];
        if (left) {
            // This does not look right. Why don't we have a recursive call?
            var max = left.leaves[left.leaves.length - 1];
            if (max) {
                left.del(max.key, minOrder, compare);
                max.parent = node;
                node.leaves.splice(index, 1, max);
            }
            else {
                // FIXME
                // throw new Error("max not found")
            }
        }
        else {
            node.leaves.splice(index, 1);
            node.nodes.splice(index, 1);
            node.balance(minOrder);
        }
        return true;
    };
    /**
     * Balances this node to fulfill all conditions.
     */
    TreeNode.prototype.balance = function (minOrder) {
        if (this.parent instanceof Tree) {
            // Special case: Root has just a single child and no leaves
            if (this.leaves.length === 0 && this.nodes[0] !== null) {
                this.parent.root = this.nodes[0];
                this.parent.root.parent = this.parent;
            }
            return;
        }
        if (this.leaves.length >= minOrder) {
            return;
        }
        var index = asearch(this.parent.nodes, this);
        var left = index > 0 ? this.parent.nodes[index - 1] : null;
        var right = this.parent.nodes.length > index + 1 ? this.parent.nodes[index + 1] : null;
        var sep;
        var leaf;
        var rest;
        if (right !== null && right.leaves.length > minOrder) {
            // Append the seperator from parent to this
            sep = this.parent.leaves[index];
            sep.parent = this;
            this.leaves.push(sep);
            // Replace the blank with the first right leaf
            leaf = right.leaves.shift();
            leaf.parent = this.parent;
            this.parent.leaves[index] = leaf;
            // Append the right rest to this
            rest = right.nodes.shift();
            if (rest) {
                rest.parent = this;
            }
            this.nodes.push(rest);
        }
        else if (left !== null && left.leaves.length > minOrder) {
            // Prepend the seperator from parent to this
            sep = this.parent.leaves[index - 1];
            sep.parent = this;
            this.leaves.unshift(sep);
            // Replace the blank with the last left leaf
            leaf = left.leaves.pop();
            leaf.parent = this.parent;
            this.parent.leaves[index - 1] = leaf;
            // Prepend the left rest to this
            rest = left.nodes.pop();
            if (rest !== null)
                rest.parent = this;
            this.nodes.unshift(rest);
        }
        else {
            var subst = void 0;
            if (right !== null) {
                // Combine this + seperator from the parent + right
                sep = this.parent.leaves[index];
                subst = new TreeNode(this.parent, concat3(this.leaves, [sep], right.leaves), concat(this.nodes, right.nodes));
                // Remove the seperator from the parent
                this.parent.leaves.splice(index, 1);
                // And replace the nodes it seperated with subst
                this.parent.nodes.splice(index, 2, subst);
            }
            else if (left !== null) {
                // Combine left + seperator from parent + this
                sep = this.parent.leaves[index - 1];
                subst = new TreeNode(this.parent, concat3(left.leaves, [sep], this.leaves), concat(left.nodes, this.nodes));
                // Remove the seperator from the parent
                this.parent.leaves.splice(index - 1, 1);
                // And replace the nodes it seperated with subst
                this.parent.nodes.splice(index - 1, 2, subst);
            }
            else {
                // We should never end here
                throw (new Error("Internal error: " + this.toString(true) + " has neither a left nor a right sibling"));
            }
            this.parent.balance(minOrder);
        }
        // validate(this);
        // validate(this.parent);
    };
    /**
     * Unsplits a child.
     * @param {!Leaf} leaf
     * @param {!TreeNode} rest
     */
    TreeNode.prototype.unsplit = function (leaf, rest, order, compare) {
        leaf.parent = this;
        rest.parent = this;
        var a = this.leaves[0];
        if (compare(leaf.key, a.key) < 0) {
            this.leaves.unshift(leaf);
            this.nodes.splice(1, 0, rest);
        }
        else {
            var i = void 0;
            for (i = 1; i < this.leaves.length; i++) {
                var b = this.leaves[i];
                if (compare(leaf.key, b.key) < 0) {
                    this.leaves.splice(i, 0, leaf);
                    this.nodes.splice(i + 1, 0, rest);
                    break;
                }
            }
            if (i === this.leaves.length) {
                this.leaves.push(leaf);
                this.nodes.push(rest);
            }
        }
        if (this.leaves.length > order) {
            this.split(order, compare);
        }
    };
    /**
     * Splits this node.
     */
    TreeNode.prototype.split = function (order, compare) {
        var index = Math.floor(this.leaves.length / 2);
        if (this.parent instanceof Tree) {
            this.nodes = [
                new TreeNode(this, this.leaves.slice(0, index), this.nodes.slice(0, index + 1)),
                new TreeNode(this, this.leaves.slice(index + 1), this.nodes.slice(index + 1))
            ];
            this.leaves = [this.leaves[index]];
        }
        else {
            var leaf = this.leaves[index];
            var rest = new TreeNode(this.parent, this.leaves.slice(index + 1), this.nodes.slice(index + 1));
            this.leaves = this.leaves.slice(0, index);
            this.nodes = this.nodes.slice(0, index + 1);
            this.parent.unsplit(leaf, rest, order, compare);
        }
    };
    /**
     * Returns a string representation of this node.
     * @param {boolean=} includeNodes Whether to include sub-nodes or not
     * @returns {string}
     */
    TreeNode.prototype.toString = function (includeNodes) {
        var val = [];
        for (var _i = 0, _a = this.leaves; _i < _a.length; _i++) {
            var leaf = _a[_i];
            val.push(leaf.key);
        }
        var s = "[" + val.toString() + "]" + (this.parent instanceof Tree ? ":*" : ":" + this.parent);
        if (includeNodes) {
            for (var _b = 0, _c = this.nodes; _b < _c.length; _b++) {
                var node = _c[_b];
                s += " -> " + node;
            }
        }
        return s;
    };
    /**
     * Prints out the nodes leaves and nodes.
     * @param {number} indent
     */
    TreeNode.prototype.print = function (indent) {
        var space = "";
        for (var i = 0; i < indent; i++)
            space += " ";
        for (var i = this.leaves.length - 1; i >= 0; i--) {
            if (this.nodes[i + 1] !== null)
                this.nodes[i + 1].print(indent + 2);
            console.log(space + this.leaves[i].key + (this.parent instanceof Tree ? "*" : ""));
        }
        if (this.nodes[0] !== null)
            this.nodes[0].print(indent + 2);
    };
    return TreeNode;
}());
export { TreeNode };
