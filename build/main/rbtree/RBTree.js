"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RBNode_1 = require("./RBNode");
var RBTree = (function () {
    /**
     * Initializes an RBTree.
     * It is important to define a key that is smaller than all expected keys
     * so that the first insert becomes the root (head.r).
     * @param headKey A key that is smaller than all expected keys.
     * @param zValue The value to return when a search is not successful.
     */
    function RBTree(headKey, zValue) {
        /**
         * The number of keys inserted.
         */
        this.N = 0;
        // The key we use for z does not matter so we borrow the head key.
        // We will change the z.key later when doing searches.
        var z = new RBNode_1.RBNode(99999, zValue);
        // The value we use for head does not matter because it won't be part of a search.
        this.head = new RBNode_1.RBNode(headKey, 11111);
        // Head left is never used or changed so we'll store the tail node there.
        this.head.l = z;
        // Head right refers the the actual tree root which is currently empty.
        this.head.r = z;
        this.head.p = this.head;
    }
    Object.defineProperty(RBTree.prototype, "root", {
        get: function () {
            return this.head.r;
        },
        set: function (root) {
            this.head.r = root;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RBTree.prototype, "z", {
        /**
         * The "tail" node.
         * This allows our subtrees never to be undefined or null.
         * All searches will result in a node, but misses will return the tail node.
         */
        get: function () {
            return this.head.l;
        },
        enumerable: true,
        configurable: true
    });
    RBTree.prototype.assertLegalKey = function (key) {
        var head = this.head;
        if (key <= head.key) {
            throw new Error("key must be greater than the head key.");
        }
    };
    /**
     *
     */
    RBTree.prototype.insert = function (key, value) {
        this.assertLegalKey(key);
        var n = new RBNode_1.RBNode(key, value);
        rbInsert(this, n);
        this.root.red = false;
        // Update the count of nodes inserted.
        this.N += 1;
        return n;
    };
    /**
     *
     */
    RBTree.prototype.search = function (key) {
        /**
         * The current node for the search.
         */
        var x = this.root;
        // The search will always be "successful" but may end with z.
        this.z.key = key;
        while (key !== x.key) {
            x = key < x.key ? x.l : x.r;
        }
        return x.value;
    };
    RBTree.prototype.remove = function (key) {
        var head = this.head;
        var z = this.z;
        /**
         * The current node for the search, we begin at the root.
         */
        var x = this.root;
        /**
         * The parent of the current node.
         */
        var p = head;
        // The search will always be "successful" but may end with z.
        z.key = key;
        // Search in the normal way to get p and x.
        while (key !== x.key) {
            p = x;
            x = key < x.key ? x.l : x.r;
        }
        // Our search has terminated and x is either the node to be removed or z.
        /**
         * A reference to the node that we will be removing.
         * This may point to z, but the following code also works in that case.
         */
        var t = x;
        // From now on we will be making x reference the node that replaces t.
        if (t.r === z) {
            // The node t has no right child.
            // The node that replaces t will be the left child of t.
            x = t.l;
        }
        else if (t.r.l === z) {
            // The node t has a right child with no left child.
            // This empty slot can be used to accept t.l
            x = t.r;
            x.l = t.l;
        }
        else {
            // The node with the next highest key must be in the r-l-l-l-l... path with a left child equal to z.
            // It can't be anywhere else of there would be an intervening key.
            // Note also that the previous tests have eliminated the case where
            // there is no highets key. This node with the next highest key must have
            // the property that it has an empty left child.
            var c = t.r;
            while (c.l.l !== z) {
                c = c.l;
            }
            // We exit from the loop when c.l.l equals z, which means that c.l is the node that
            // we want to use to replace t.
            x = c.l;
            c.l = x.r;
            x.l = t.l;
            x.r = t.r;
        }
        // We can now free the t node (if we need to do so).
        // Finally, account for whether t was the left or right child of p.
        if (key < p.key) {
            p.l = x;
        }
        else {
            p.r = x;
        }
    };
    Object.defineProperty(RBTree.prototype, "hInv", {
        /**
         * Determines whether this tree satisfies the height invariant.
         * The height invariant is that the number of blue nodes in every path to leaf nodes should be the same.
         * This property is for testing only; it traverses the tree and so affects performance.
         */
        get: function () {
            return hInv(this.root, this.z);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RBTree.prototype, "cInv", {
        /**
         * Determines whether this tree satisfies the color invarant.
         * The color invariant is that no two adjacent nodes should be colored red.
         * This property is for testing only; it traverses the treeand so affects performance.
         */
        get: function () {
            return cInv(this.root, this.head.red, this.z);
        },
        enumerable: true,
        configurable: true
    });
    return RBTree;
}());
exports.RBTree = RBTree;
/**
 * z, x, y are in diamond-left formation.
 * z is the initial leader and is blue.
 * x and y are initially red.
 *
 * z moves right and back.
 * y takes the lead.
 * children a,b of y are adopted by x and z.
 * x becomes blue.
 *
 *    z          y
 * x    =>    x     z
 *    y        a   b
 *  a   b
 */
function diamondLToVic(tree, lead) {
    var m = lead.p;
    var z = lead;
    var x = z.l;
    var y = x.r;
    var a = y.l;
    var b = y.r;
    x.red = false;
    y.l = x;
    x.p = y;
    y.r = z;
    z.p = y;
    x.r = a;
    a.p = x;
    z.l = b;
    b.p = z;
    if (m.r === lead) {
        m.r = y;
    }
    else {
        m.l = y;
    }
    y.p = m;
    return y;
}
/**
 * x, z, y are in diamond-right formation.
 * x is the initial leader and is blue.
 * z and y are initially red.
 *
 * x moves left and back
 * y takes the lead.
 * z becomes blue.
 *
 *    x          y
 *       z => x     z
 *    y        a   b
 *  a   b
 */
function diamondRToVic(tree, lead) {
    var m = lead.p;
    var x = lead;
    var z = x.r;
    var y = z.l;
    var a = y.l;
    var b = y.r;
    z.red = false;
    y.l = x;
    x.p = y;
    y.r = z;
    z.p = y;
    x.r = a;
    a.p = x;
    z.l = b;
    b.p = z;
    if (m.r === lead) {
        m.r = y;
    }
    else {
        m.l = y;
    }
    y.p = m;
    return y;
}
function echelonLToVic(tree, lead) {
    var m = lead.p;
    var z = lead;
    var y = z.l;
    var q = y.r;
    y.l.red = false;
    y.r = z;
    z.p = y;
    z.l = q;
    q.p = z;
    if (m.r === lead) {
        m.r = y;
    }
    else {
        m.l = y;
    }
    y.p = m;
    return y;
}
function echelonRToVic(tree, lead) {
    var m = lead.p;
    var x = lead;
    var y = x.r;
    var a = y.l;
    y.r.red = false;
    y.l = x;
    x.p = y;
    x.r = a;
    a.p = x;
    if (m.r === lead) {
        m.r = y;
    }
    else {
        m.l = y;
    }
    y.p = m;
    return y;
}
function cInv(node, redParent, z) {
    if (node === z) {
        return true;
    }
    else if (redParent && node.red) {
        return false;
    }
    else {
        return cInv(node.l, node.red, z) && cInv(node.r, node.red, z);
    }
}
function hInv(node, z) {
    return blueHeight(node, z) >= 0;
}
/**
 * Computes the number of blue nodes (including z) on the path from x to leaf, not counting x.
 * The height does not include itself.
 * z nodes are blue.
 */
function blueHeight(x, z) {
    if (x === z) {
        return 0;
    }
    else {
        var hL = blueHeight(x.l, z);
        if (hL >= 0) {
            var hR = blueHeight(x.r, z);
            if (hR >= 0) {
                if (hR === hR) {
                    return x.red ? hL : hL + 1;
                }
            }
        }
        return -1;
    }
}
function rbInsert(tree, n) {
    var key = n.key;
    var z = tree.z;
    var x = tree.root;
    x.p = tree.head;
    while (x !== z) {
        x.l.p = x;
        x.r.p = x;
        x = (key < x.key) ? x.l : x.r;
    }
    n.p = x.p;
    if (x.p === tree.head) {
        tree.root = n;
    }
    else {
        if (key < x.p.key) {
            x.p.l = n;
        }
        else {
            x.p.r = n;
        }
    }
    n.l = z;
    n.r = z;
    // When inserting the node (at any place other than the root), we always color it red.
    // This is so that we don't violate the height invariant.
    // However, this may violate the color invariant, which we address by recursing back up the tree.
    n.red = true;
    rbInsertFixup(tree, n);
}
/**
 * In this algorithm we start with the node that has been inserted and make our way up the tree.
 * This requires carefully maintaining parent pointers.
 *
 * This function fixes up the path from a leaf by using only rotations.
 * I suspect an implementation based upon snakes, ecehelons and vics would be easier to follow?
 */
function rbInsertFixup(tree, n) {
    while (n.red) {
        /**
         * The parent of n.
         */
        var p = n.p;
        if (n === tree.root) {
            tree.root.red = false;
            return;
        }
        else if (n === tree.head) {
            throw new Error("Really bad. Should of caught this earlier.");
        }
        else if (p === tree.root) {
            tree.root.red = false;
            return;
            // throw new Error("n.p === tree.root");
        }
        /**
         * The grandparent of n is the parent of the parent.
         */
        var g = p.p;
        // Establish the n = red, p = red, g = blue condition for a transformation.
        if (p.red && !g.red) {
            if (p === g.l) {
                var gg = g.r;
                if (gg.red) {
                    p.red = false;
                    gg.red = false;
                    g.red = true;
                    n = g;
                }
                else if (n === p.r) {
                    n = diamondLToVic(tree, g);
                }
                else {
                    n = echelonLToVic(tree, g);
                }
            }
            else if (p === g.r) {
                var gg = g.l;
                if (gg.red) {
                    p.red = false;
                    gg.red = false;
                    g.red = true;
                    n = g;
                }
                else if (n === n.p.l) {
                    n = diamondRToVic(tree, g);
                }
                else {
                    n = echelonRToVic(tree, g);
                }
            }
            else {
                break;
                // throw new Error();
            }
        }
        else {
            break;
        }
    }
    tree.root.red = false;
}
