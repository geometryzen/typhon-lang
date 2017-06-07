"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RBNode = (function () {
    /**
     * Constructs a red-blue binary tree node.
     */
    function RBNode(key, value) {
        this.key = key;
        this.value = value;
        /**
         * The red/blue flag.
         */
        this.red = false;
        this.l = this;
        this.r = this;
        // this.p = this;
    }
    Object.defineProperty(RBNode.prototype, "blue", {
        get: function () {
            return !this.red;
        },
        set: function (blue) {
            this.red = !blue;
        },
        enumerable: true,
        configurable: true
    });
    RBNode.prototype.toString = function () {
        return (this.red ? 'red' : 'blue') + " " + this.key;
    };
    return RBNode;
}());
exports.RBNode = RBNode;
