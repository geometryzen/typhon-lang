export interface Tree {
    type: number;
    children: Tree[] | null | undefined;
}
/**
 * Returns the number of children in the specified node.
 */
export declare function NCH<T extends Tree>(n: T): number;
export declare function CHILD<T extends Tree>(n: T, i: number): T;
export declare function FIND<T extends Tree>(n: T, type: number): number;
export declare function CHILDREN<T extends Tree>(n: T): T[];
export declare function IDXLAST<T>(xs: ArrayLike<T>): number;
/**
 * Returns the terminal nodes of the tree.
 */
export declare function TERMS<T extends Tree>(n: T): T[];
