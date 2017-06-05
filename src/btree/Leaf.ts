import { TreeNode } from './TreeNode';

export class Leaf<K, V> {
    public parent: TreeNode<K, V>;
    public key: K;
    public value: V;
    /**
     * Constructs a new Leaf containing a value.
     * @param parent
     * @param key
     * @param value
     */
    constructor(parent: TreeNode<K, V>, key: K, value: V) {
        this.parent = parent;
        this.key = key;
        this.value = value;
    }

    /**
     * Returns a string representation of this instance.
     */
    toString() {
        return `${this.key}`;
    }
}
