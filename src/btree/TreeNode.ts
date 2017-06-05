import { Leaf } from './Leaf';
import { Tree } from './btree';

export interface KeyComparator<K> {
    (a: K, b: K): (-1 | 1 | 0);
}

function concat2<T>(as: T[], bs: T[]): T[] {
    const ts: T[] = [];
    for (const a of as) {
        ts.push(a);
    }
    for (const b of bs) {
        ts.push(b);
    }
    return ts;
}

function concat3<T>(as: T[], bs: T[], cs: T[]): T[] {
    const ts: T[] = [];
    for (const a of as) {
        ts.push(a);
    }
    for (const b of bs) {
        ts.push(b);
    }
    for (const c of cs) {
        ts.push(c);
    }
    return ts;
}

/**
 * Searches an array for the specified value.
 * Index or -1 if not found.
 */
export function asearch<T>(a: T[], v: T): number {
    // This is faster than Array#indexOf because it's raw. However, we
    // cannot use binary search because nodes do not have a comparable
    // key. If the compiler is smart, it will inline this.
    for (let i = 0; i < a.length; i++) {
        if (a[i] === v) return i;
    }
    return -1;
}

export class TreeNode<K, V> {
    public parent: TreeNode<K, V> | Tree<K, V>;
    public leaves: Leaf<K, V>[];
    public nodes: (TreeNode<K, V> | null)[];
    /**
     * Constructs a new TreeNode.
     * @param parent Parent node
     * @param leaves Leaf nodes
     * @param nodes Child nodes
     */
    constructor(parent: TreeNode<K, V> | Tree<K, V>, leaves: Leaf<K, V>[] = [], nodes: (TreeNode<K, V> | null)[] = [null]) {
        /**
         * Parent node.
         * @type {!TreeNode|!Tree}
         */
        this.parent = parent;

        /**
         * Leaf nodes (max. order).
         * @type {!Array.<!Leaf>}
         */
        this.leaves = leaves || [];
        this.leaves.forEach((leaf) => {
            leaf.parent = this;
        });

        /**
         * Child nodes (max. order+1).
         * @type {!Array.<TreeNode>}
         */
        this.nodes = nodes || [null];
        this.nodes.forEach(function (node) {
            if (node !== null) node.parent = this;
        }, this);
    }

    /**
     * Searches for the node that would contain the specified key.
     * Leaf if the key exists, else the insertion node
     */
    search(key: K, compare: KeyComparator<K>): { leaf?: Leaf<K, V>; node?: TreeNode<K, V>; index: number } {
        if (this.leaves.length > 0) {
            let a = this.leaves[0];
            if (compare(a.key, key) === 0) return { leaf: a, index: 0 };
            if (compare(key, a.key) < 0) {
                const node = this.nodes[0];
                if (node) {
                    return node.search(key, compare); // Left
                }
                return { node: this, index: 0 };
            }
            let i: number;
            for (i = 1; i < this.leaves.length; i++) {
                const b = this.leaves[i];
                if (compare(b.key, key) === 0) return { leaf: b, index: i };
                if (compare(key, b.key) < 0) {
                    const node = this.nodes[i];
                    if (node) {
                        return node.search(key, compare); // Inner
                    }
                    return { node: this, index: i };
                }
                a = b;
            }
            const node = this.nodes[i];
            if (node) {
                return node.search(key, compare); // Right
            }
            return { node: this, index: i };
        }
        return { node: this, index: 0 };
    }

    /**
     * Gets the value for the given key.
     * If there is no such key, undefined is returned
     */
    get(key: K, compare: KeyComparator<K>): V {
        const result = this.search(key, compare);
        if (result.leaf) {
            return result.leaf.value;
        }
        return undefined;
    }

    /**
     * Inserts a key/value pair into this node.
     * @param key
     * @param value
     * @param overwrite Whether to overwrite existing values, defaults to `true`
     * @returns true if successfully set, false if already present and overwrite is `false`
     */
    put(key: K, value: V, order: number, compare: KeyComparator<K>, overwrite?: boolean): boolean {
        const result = this.search(key, compare);
        if (result.leaf) {
            if (typeof overwrite !== 'undefined' && !overwrite) {
                return false;
            }
            result.leaf.value = value;
            return true;
        } // Key already exists
        const node = result.node as TreeNode<K, V>;
        const index = result.index as number;
        node.leaves.splice(index, 0, new Leaf(node, key, value));
        node.nodes.splice(index + 1, 0, null);
        if (node.leaves.length > order) { // Rebalance
            node.split(order, compare);
        }
        return true;
    }

    /**
     * Deletes a key from this node.
     * @param {!*} key
     * @returns {boolean} true if the key has been deleted, false if the key does not exist
     */
    del(key: K, minOrder: number, compare: KeyComparator<K>) {
        const result = this.search(key, compare);
        if (!result.leaf) {
            return false;
        }
        const leaf = result.leaf;
        const node = leaf.parent;
        const index = result.index as number;
        const left = node.nodes[index];
        if (left) {
            // This does not look right. Why don't we have a recursive call?
            const max = left.leaves[left.leaves.length - 1];
            if (max) {
                left.del(max.key, minOrder, compare);
                max.parent = node;
                node.leaves.splice(index, 1, max);
            }
            else {
                // FIXME
                // throw new Error("max not found")
            }
        }
        else {
            node.leaves.splice(index, 1);
            node.nodes.splice(index, 1);
            node.balance(minOrder);
        }
        return true;
    }

    /**
     * Balances this node to fulfill all conditions.
     */
    balance(minOrder: number) {
        if (this.parent instanceof Tree) {
            // Special case: Root has just a single child and no leaves
            if (this.leaves.length === 0 && this.nodes[0] !== null) {
                this.parent.root = this.nodes[0] as TreeNode<K, V>;
                this.parent.root.parent = this.parent;
            }
            return;
        }
        if (this.leaves.length >= minOrder) {
            return;
        }
        const index = asearch(this.parent.nodes, this);
        const left = index > 0 ? this.parent.nodes[index - 1] : null;
        const right = this.parent.nodes.length > index + 1 ? this.parent.nodes[index + 1] : null;
        let sep: Leaf<K, V>;
        let leaf: Leaf<K, V>;
        let rest;
        if (right !== null && right.leaves.length > minOrder) {
            // Append the seperator from parent to this
            sep = this.parent.leaves[index];
            sep.parent = this;
            this.leaves.push(sep);
            // Replace the blank with the first right leaf
            leaf = right.leaves.shift() as Leaf<K, V>;
            leaf.parent = this.parent;
            this.parent.leaves[index] = leaf;
            // Append the right rest to this
            rest = right.nodes.shift();
            if (rest) {
                rest.parent = this;
            }
            this.nodes.push(rest);
        }
        else if (left !== null && left.leaves.length > minOrder) {
            // Prepend the seperator from parent to this
            sep = this.parent.leaves[index - 1];
            sep.parent = this;
            this.leaves.unshift(sep);
            // Replace the blank with the last left leaf
            leaf = left.leaves.pop() as Leaf<K, V>;
            leaf.parent = this.parent;
            this.parent.leaves[index - 1] = leaf;
            // Prepend the left rest to this
            rest = left.nodes.pop();
            if (rest !== null) rest.parent = this;
            this.nodes.unshift(rest);
        }
        else {
            let subst: TreeNode<K, V>;
            if (right !== null) {
                // Combine this + seperator from the parent + right
                sep = this.parent.leaves[index];
                subst = new TreeNode(this.parent, concat3(this.leaves, [sep], right.leaves), concat2(this.nodes, right.nodes));
                // Remove the seperator from the parent
                this.parent.leaves.splice(index, 1);
                // And replace the nodes it seperated with subst
                this.parent.nodes.splice(index, 2, subst);
            }
            else if (left !== null) {
                // Combine left + seperator from parent + this
                sep = this.parent.leaves[index - 1];
                subst = new TreeNode(this.parent, concat3(left.leaves, [sep], this.leaves), concat2(left.nodes, this.nodes));
                // Remove the seperator from the parent
                this.parent.leaves.splice(index - 1, 1);
                // And replace the nodes it seperated with subst
                this.parent.nodes.splice(index - 1, 2, subst);
            }
            else {
                // We should never end here
                throw (new Error("Internal error: " + this.toString(true) + " has neither a left nor a right sibling"));
            }
            this.parent.balance(minOrder);
        }
        // validate(this);
        // validate(this.parent);
    }

    /**
     * Unsplits a child.
     * @param leaf
     * @param rest
     */
    unsplit(leaf: Leaf<K, V>, rest: TreeNode<K, V>, order: number, compare: KeyComparator<K>) {
        leaf.parent = this;
        rest.parent = this;
        const a = this.leaves[0];
        if (compare(leaf.key, a.key) < 0) {
            this.leaves.unshift(leaf);
            this.nodes.splice(1, 0, rest);
        }
        else {
            let i: number;
            for (i = 1; i < this.leaves.length; i++) {
                const b = this.leaves[i];
                if (compare(leaf.key, b.key) < 0) {
                    this.leaves.splice(i, 0, leaf);
                    this.nodes.splice(i + 1, 0, rest);
                    break;
                }
            }
            if (i === this.leaves.length) {
                this.leaves.push(leaf);
                this.nodes.push(rest);
            }
        }
        if (this.leaves.length > order) {
            this.split(order, compare);
        }
    }

    /**
     * Splits this node.
     */
    split(order: number, compare: KeyComparator<K>) {
        const index = Math.floor(this.leaves.length / 2);
        if (this.parent instanceof Tree) {
            this.nodes = [
                new TreeNode(this, this.leaves.slice(0, index), this.nodes.slice(0, index + 1)),
                new TreeNode(this, this.leaves.slice(index + 1), this.nodes.slice(index + 1))
            ];
            this.leaves = [this.leaves[index]];
        }
        else {
            const leaf = this.leaves[index];
            const rest = new TreeNode(this.parent, this.leaves.slice(index + 1), this.nodes.slice(index + 1));
            this.leaves = this.leaves.slice(0, index);
            this.nodes = this.nodes.slice(0, index + 1);
            this.parent.unsplit(leaf, rest, order, compare);
        }
    }

    /**
     * Returns a string representation of this node.
     * @param includeNodes Whether to include sub-nodes or not
     */
    toString(includeNodes?: boolean): string {
        const val: K[] = [];
        for (const leaf of this.leaves) {
            val.push(leaf.key);
        }
        let s = "[" + val.toString() + "]" + (this.parent instanceof Tree ? ":*" : ":" + this.parent);
        if (includeNodes) {
            for (const node of this.nodes) {
                s += " -> " + node;
            }
        }
        return s;
    }

    /**
     * Prints out the nodes leaves and nodes.
     * @param indent
     */
    print(indent: number) {
        let space = "";
        for (let i = 0; i < indent; i++) {
            space += " ";
        }
        for (let i = this.leaves.length - 1; i >= 0; i--) {
            if (this.nodes[i + 1]) {
                this.nodes[i + 1].print(indent + 2);
            }
            console.log(space + this.leaves[i].key + (this.parent instanceof Tree ? "*" : ""));
        }
        if (this.nodes[0]) {
            this.nodes[0].print(indent + 2);
        }
    }
}
