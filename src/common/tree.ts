import { assert } from './asserts';

export interface Tree {
    type: number;
    children: Tree[] | null | undefined;
}

/**
 * Returns the number of children in the specified node.
 * Returns n.children.length
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
    assert(i !== undefined && i >= 0);
    return CHILDREN(n)[i];
}

export function FIND<T extends Tree>(n: T, type: number): number {
    assert(type !== undefined);
    const children = CHILDREN(n);
    const N = children.length;
    for (let i = 0; i < N; i++) {
        const child = children[i];
        if (child.type === type) {
            return i;
        }
    }
    return -1;
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

/**
 * Convenience function to return the index of the last element in an array.
 * @param xs The array.
 * @returns The length of the array minus 1.
 */
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
