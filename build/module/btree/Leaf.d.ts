import { TreeNode } from './TreeNode';
export declare class Leaf<K, V> {
    parent: TreeNode<K, V>;
    key: K;
    value: V;
    /**
     * Constructs a new Leaf containing a value.
     * @class A Leaf.
     * @param {!TreeNode} parent
     * @param {!*} key
     * @param {*} value
     * @constructor
     */
    constructor(parent: TreeNode<K, V>, key: K, value: V);
    /**
     * Returns a string representation of this instance.
     * @returns {string}
     */
    toString(): string;
}
