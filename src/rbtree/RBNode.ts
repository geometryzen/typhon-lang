export class RBNode {
    /**
     * The parent pointer. This will only be valid following searches.
     * It is present to avoid allocating memory for the p, g, gg context.
     */
    // p: RBNode;
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
    red = false;
    /**
     * Constructs a red-blue binary tree node.
     */
    constructor(public key: number, public value: number) {
        this.l = this;
        this.r = this;
        // this.p = this;
    }
    get blue(): boolean {
        return !this.red;
    }
    set blue(blue: boolean) {
        this.red = !blue;
    }
    toString(): string {
        return `${this.red ? 'red' : 'blue'} ${this.key}`;
    }
}
