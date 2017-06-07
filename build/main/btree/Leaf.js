"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Leaf = (function () {
    /**
     * Constructs a new Leaf containing a value.
     * @param parent
     * @param key
     * @param value
     */
    function Leaf(parent, key, value) {
        this.parent = parent;
        this.key = key;
        this.value = value;
    }
    /**
     * Returns a string representation of this instance.
     */
    Leaf.prototype.toString = function () {
        return "" + this.key;
    };
    return Leaf;
}());
exports.Leaf = Leaf;
