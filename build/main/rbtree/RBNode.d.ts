export declare class RBNode {
    key: number;
    value: number;
    /**
     * The parent pointer. This will only be valid following searches.
     * It is present to avoid allocating memory for the p, g, gg context.
     */
    /**
     * The left child link.
     */
    l: RBNode;
    /**
     * The right child link.
     */
    r: RBNode;
    /**
     * The parent of the node.
     */
    p: RBNode;
    /**
     * The red/blue flag.
     */
    red: boolean;
    /**
     * Constructs a red-blue binary tree node.
     */
    constructor(key: number, value: number);
    blue: boolean;
    toString(): string;
}
