import { Leaf } from './Leaf';
import { Tree } from './btree';
export interface KeyComparator<K> {
    (a: K, b: K): (-1 | 1 | 0);
}
/**
 * Searches an array for the specified value.
 * Index or -1 if not found.
 */
export declare function asearch<T>(a: T[], v: T): number;
export declare class TreeNode<K, V> {
    parent: TreeNode<K, V> | Tree<K, V>;
    leaves: Leaf<K, V>[];
    nodes: (TreeNode<K, V> | null)[];
    /**
     * Constructs a new TreeNode.
     * @param parent Parent node
     * @param leaves Leaf nodes
     * @param nodes Child nodes
     */
    constructor(parent: TreeNode<K, V> | Tree<K, V>, leaves?: Leaf<K, V>[], nodes?: (TreeNode<K, V> | null)[]);
    /**
     * Searches for the node that would contain the specified key.
     * Leaf if the key exists, else the insertion node
     */
    search(key: K, compare: KeyComparator<K>): {
        leaf?: Leaf<K, V>;
        node?: TreeNode<K, V>;
        index: number;
    };
    /**
     * Gets the value for the given key.
     * If there is no such key, undefined is returned
     */
    get(key: K, compare: KeyComparator<K>): V;
    /**
     * Inserts a key/value pair into this node.
     * @param key
     * @param value
     * @param overwrite Whether to overwrite existing values, defaults to `true`
     * @returns true if successfully set, false if already present and overwrite is `false`
     */
    put(key: K, value: V, order: number, compare: KeyComparator<K>, overwrite?: boolean): boolean;
    /**
     * Deletes a key from this node.
     * @param {!*} key
     * @returns {boolean} true if the key has been deleted, false if the key does not exist
     */
    del(key: K, minOrder: number, compare: KeyComparator<K>): boolean;
    /**
     * Balances this node to fulfill all conditions.
     */
    balance(minOrder: number): void;
    /**
     * Unsplits a child.
     * @param leaf
     * @param rest
     */
    unsplit(leaf: Leaf<K, V>, rest: TreeNode<K, V>, order: number, compare: KeyComparator<K>): void;
    /**
     * Splits this node.
     */
    split(order: number, compare: KeyComparator<K>): void;
    /**
     * Returns a string representation of this node.
     * @param includeNodes Whether to include sub-nodes or not
     */
    toString(includeNodes?: boolean): string;
    /**
     * Prints out the nodes leaves and nodes.
     * @param indent
     */
    print(indent: number): void;
}
