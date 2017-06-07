import { RBNode } from './RBNode';
export declare class RBTree {
    /**
     * The "head" node is provided to make insertion easier.
     * It is not the root.
     * It is not actually part of the tree.
     * The right link of head points to the actual root node of the tree.
     * The left link of the `head` is not used, so we store the tail node, z in it.
     * The key for head is smaller than all other keys, consistent with the use of the right link.
     */
    readonly head: RBNode;
    /**
     * The number of keys inserted.
     */
    N: number;
    /**
     * Initializes an RBTree.
     * It is important to define a key that is smaller than all expected keys
     * so that the first insert becomes the root (head.r).
     * @param headKey A key that is smaller than all expected keys.
     * @param zValue The value to return when a search is not successful.
     */
    constructor(headKey: number, zValue: number);
    root: RBNode;
    /**
     * The "tail" node.
     * This allows our subtrees never to be undefined or null.
     * All searches will result in a node, but misses will return the tail node.
     */
    readonly z: RBNode;
    private assertLegalKey(key);
    /**
     *
     */
    insert(key: number, value: number): RBNode;
    /**
     *
     */
    search(key: number): number;
    remove(key: number): void;
    /**
     * Determines whether this tree satisfies the height invariant.
     * The height invariant is that the number of blue nodes in every path to leaf nodes should be the same.
     * This property is for testing only; it traverses the tree and so affects performance.
     */
    readonly hInv: boolean;
    /**
     * Determines whether this tree satisfies the color invarant.
     * The color invariant is that no two adjacent nodes should be colored red.
     * This property is for testing only; it traverses the treeand so affects performance.
     */
    readonly cInv: boolean;
}
