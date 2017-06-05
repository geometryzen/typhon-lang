import { RBNode } from './RBNode';

export class RBTree {
    /**
     * The "head" node is provided to make insertion easier.
     * It is not the root.
     * It is not actually part of the tree.
     * The right link of head points to the actual root node of the tree.
     * The left link of the `head` is not used, so we store the tail node, z in it.
     * The key for head is smaller than all other keys, consistent with the use of the right link.
     */
    private readonly head: RBNode;
    /**
     * The number of keys inserted.
     */
    public N = 0;

    /**
     * Initializes an RBTree.
     * It is important to define a key that is smaller than all expected keys
     * so that the first insert becomes the root (head.r).
     * @param headKey A key that is smaller than all expected keys.
     * @param zValue The value to return when a search is not successful.
     */
    constructor(headKey: number, zValue: number) {
        // The key we use for z does not matter so we borrow the head key.
        // We will change the z.key later when doing searches.
        const z = new RBNode(headKey, zValue);

        // The value we use for head does not matter because it won't be part of a search.
        this.head = new RBNode(headKey, zValue);
        // Head left is never used or changed so we'll store the tail node there.
        this.head.l = z;
        // Head right refers the the actual tree root which is currently empty.
        this.head.r = z;
    }

    get root(): RBNode {
        return this.head.r;
    }

    /**
     * The "tail" node.
     * This allows our subtrees never to be undefined or null.
     * All searches will result in a node, but misses will return the tail node.
     */
    get z(): RBNode {
        // We're using the 
        return this.head.l;
    }

    private assertLegalKey(key: number): void {
        const head = this.head;

        if (key <= head.key) {
            throw new Error("key must be greater than the head key.");
        }
    }

    /**
     *
     * @param key
     * @param value
     */
    insert(key: number, value: number) {

        this.assertLegalKey(key);

        const node234 = this.search234(key);
        this.merge234(key, value, node234);
    }

    /**
     *
     * @param key
     */
    search(key: number): number {
        /**
         * The current node for the search.
         */
        let x = this.root;

        // The search will always be "successful" but may end with z.
        this.z.key = key;

        while (key !== x.key) {
            x = key < x.key ? x.l : x.r;
        }

        return x.value;
    }

    /**
     * Search method designed to make it feel like a 2-3-4 tree.
     * Returns the 2-3-4 node that we will merge our (key, value) into.
     * The returned node has its parent and grandparent pointers set.
     * Splits any 4-nodes on the way down.
     */
    private search234(key: number): RBNode {
        const head = this.head;
        const root = this.root;
        const z = this.z;
        let p = head;
        let g = head;
        let gg: RBNode = g;

        /**
         * The current node actually ends up referring to a tail node
         */
        let x = root;

        while (x !== z) {
            gg = g;
            g = p;
            p = x;
            x = key < x.key ? x.l : x.r;
            if (x.l.red && x.r.red) {
                // It's a 4-node.
                p.p = g;
                g.p = gg;
                split(x, p, key, root);
            }
        }
        p.p = g;
        g.p = gg;
        return p;
    }

    /**
     * This function is an attempt to make the insertion conceptually resemble a 2-3-4 algorithm.
     */
    merge234(key: number, value: number, p: RBNode): void {
        const z = this.z;
        const x = new RBNode(key, value);
        x.l = z;
        x.r = z;

        // The first time through, p will reference the head but key will never be less than head.key.
        // This means the the first insert goes into head.r and becomes the root.
        if (key < p.key) {
            p.l = x;
        }
        else {
            p.r = x;
        }

        split(x, p, key, this.root);

        // Update the count of nodes inserted.
        this.N += 1;
    }

    remove(key: number): void {
        const head = this.head;
        const z = this.z;
        /**
         * The current node for the search, we begin at the root.
         */
        let x = this.root;

        /**
         * The parent of the current node.
         */
        let p = head;

        // The search will always be "successful" but may end with z.
        z.key = key;

        // Search in the normal way to get p and x.
        while (key !== x.key) {
            p = x;
            x = key < x.key ? x.l : x.r;
        }

        // Our search has terminated and x is either the node to be removed or z.
        /**
         * A reference to the node that we will be removing.
         * This may point to z, but the following code also works in that case.
         */
        const t = x;

        // From now on we will be making x reference the node that replaces t.

        if (t.r === z) {
            // The node t has no right child.
            // The node that replaces t will be the left child of t.
            x = t.l;
        }
        else if (t.r.l === z) {
            // The node t has a right child with no left child.
            // This empty slot can be used to accept t.l
            x = t.r;
            x.l = t.l;
        }
        else {
            // The node with the next highest key must be in the r-l-l-l-l... path with a left child equal to z.
            // It can't be anywhere else of there would be an intervening key.
            // Note also that the previous tests have eliminated the case where
            // there is no highets key. This node with the next highest key must have
            // the property that it has an empty left child.
            let c = t.r;
            while (c.l.l !== z) {
                c = c.l;
            }
            // We exit from the loop when c.l.l equals z, which means that c.l is the node that
            // we want to use to replace t.
            x = c.l;

            c.l = x.r;
            x.l = t.l;
            x.r = t.r;
        }
        // We can now free the t node (if we need to do so).
        // Finally, account for whether t was the left or right child of p.
        if (key < p.key) {
            p.l = x;
        }
        else {
            p.r = x;
        }
    }

}

/**
 * Rotate does not change the color of anything.
 * @param key
 * @param y
 */
function rotate(key: number, y: RBNode): RBNode {
    const c = key < y.key ? y.l : y.r;
    let gc: RBNode;
    if (key < c.key) {
        gc = c.l;
        c.l = gc.r;
        gc.r = c;
    }
    else {
        gc = c.r;
        c.r = gc.l;
        gc.l = c;
    }
    if (key < y.key) {
        y.l = gc;
    }
    else {
        y.r = gc;
    }
    return gc;
}

/**
 * The name of this function is somewhat confusing because its role isn't so simple.
 * One thing it can do is to mark a pair of nodes as being a 3-node.
 * @param x
 * @param p
 * @param g
 * @param gg
 * @param key
 */
function split(x: RBNode, p: RBNode, key: number, root: RBNode): void {
    const g = p.p;
    const gg = g.p;
    x.red = true;
    x.l.red = false;
    x.r.red = false;
    if (p.red) {
        g.red = true;
        if (key < g.key !== key < p.key) {
            p = rotate(key, g);
        }
        x = rotate(key, gg);
        x.red = false;
    }
    // Keep the root black.
    // Can we avoid thrashing the red property by checking whether x is the root?
    root.red = false;
}
