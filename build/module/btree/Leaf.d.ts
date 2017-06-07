import { TreeNode } from './TreeNode';
export declare class Leaf<K, V> {
    parent: TreeNode<K, V>;
    key: K;
    value: V;
    /**
     * Constructs a new Leaf containing a value.
     * @param parent
     * @param key
     * @param value
     */
    constructor(parent: TreeNode<K, V>, key: K, value: V);
    /**
     * Returns a string representation of this instance.
     */
    toString(): string;
}
