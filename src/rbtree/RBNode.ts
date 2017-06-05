export class RBNode {
    /**
     * The parent pointer. This will only be valid following searches.
     * It is present to avoid allocating memory for the p, g, gg context.
     */
    p: RBNode;
    /**
     * The left child link.
     */
    l: RBNode;
    /**
     * The right child link.
     */
    r: RBNode;
    /**
     * The red/black flag.
     */
    red = false;
    /**
     * Constructs a red-black binary tree node.
     * @param key
     * @param value
     */
    constructor(public key: number, public value: number) {
        this.l = this;
        this.r = this;
    }
}
