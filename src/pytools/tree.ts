import { assert } from './asserts';

export interface Tree {
    children: Tree[];
}

/**
 * Returns the number of children in the specified node.
 */
export function NCH<T extends Tree>(n: T): number {
    assert(n !== undefined);
    if (Array.isArray(n.children)) {
        return n.children.length;
    }
    else {
        return 0;
    }
}

export function CHILD<T extends Tree>(n: T, i: number): T {
    assert(i !== undefined);
    return CHILDREN(n)[i];
}

export function CHILDREN<T extends Tree>(n: T): T[] {
    assert(n !== undefined);
    if (n.children) {
        return n.children as T[];
    }
    else {
        throw new Error("node does not have any children");
    }
}

export function IDXLAST<T>(xs: ArrayLike<T>): number {
    return xs.length - 1;
}

/**
 * Returns the terminal nodes of the tree.
 */
export function TERMS<T extends Tree>(n: T): T[] {
    const childLength = NCH(n);
    if (childLength === 0) {
        return [n];
    }
    else {
        const terminals: T[] = [];
        for (const child of CHILDREN(n)) {
            for (const t of TERMS(child)) {
                terminals.push(t);
            }
        }
        return terminals;
    }
}
