"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Leaf = (function () {
    /**
     * Constructs a new Leaf containing a value.
     * @class A Leaf.
     * @param {!TreeNode} parent
     * @param {!*} key
     * @param {*} value
     * @constructor
     */
    function Leaf(parent, key, value) {
        /**
         * Parent node.
         * @type {!TreeNode}
         */
        this.parent = parent;
        /**
         * Key.
         * @type {!*}
         */
        this.key = key;
        /**
         * Value.
         * @type {*}
         */
        this.value = value;
    }
    /**
     * Returns a string representation of this instance.
     * @returns {string}
     */
    Leaf.prototype.toString = function () {
        return "" + this.key;
    };
    return Leaf;
}());
exports.Leaf = Leaf;
