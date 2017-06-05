import { TreeNode } from './TreeNode';
import { KeyComparator } from './TreeNode';
/**
 * Strictly compares two strings, character by character. No locales, no number extension.
 * @param {string} a
 * @param {string} b
 * @returns {number} -1 if a < b, 1 if a > b, 0 otherwise
 * @expose
 */
export declare function strcmp(a: string, b: string): -1 | 1 | 0;
/**
 * Compares two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number} -1 if a < b, 1 if a > b, 0 otherwise
 * @expose
 */
export declare function intcmp(a: number, b: number): -1 | 1 | 0;
export declare function computeOrder(order: number): number;
export declare class Tree<K, V> {
    private compare;
    root: TreeNode<K, V>;
    private readonly order;
    private readonly minOrder;
    /**
     * Constructs a new Tree.
     * @class A Tree.
     * @constructor
     */
    constructor(compare: KeyComparator<K>, order?: number);
    /**
     * Inserts a key/value pair into the tree.
     * @param {!*} key
     * @param {*} value
     * @param {boolean=} overwrite Whether to overwrite existing values, defaults to `true`
     * @returns {boolean} true if set, false if already present and overwrite is `false`
     * @throws {Error} If the key is undefined or null or the value is undefined
     * @expose
     */
    put(key: any, value: any, overwrite?: boolean): boolean;
    /**
     * Gets the value of the specified key.
     * @param {!*} key
     * @returns {*|undefined} If there is no such key, undefined is returned
     * @throws {Error} If the key is undefined or null
     * @expose
     */
    get(key: K): V | undefined;
    /**
     * Deletes a key from the tree.
     * @param {!*} key
     * @returns {boolean} true if the key has been deleted, false if the key does not exist
     * @expose
     */
    del(key: K): boolean;
    /**
     * Walks through all keys [minKey, ..., maxKey] in ascending order.
     * @param {*|function(*, *):(boolean|undefined)} minKey If omitted or NULL, starts at the beginning
     * @param {(*|function(*, *):(boolean|undefined))=} maxKey If omitted or NULL, walks till the end
     * @param {function(*, *):(boolean|undefined)=} callback Callback receiving the key and the corresponding value as its
     *  parameters. May explicitly return true to stop the loop.
     * @expose
     */
    walkAsc(minKey: K, maxKey: K, callback: (key: K, value: V) => void): void;
    /**
     * Walks through all keys [minKey, ..., maxKey] in descending order.
     * @param {*|function(*, *):(boolean|undefined)} minKey If omitted or null, walks till the beginning
     * @param {(*|function(*, *):(boolean|undefined))=} maxKey If omitted or null, starts at the end
     * @param {function(*, *):(boolean|undefined)=} callback Callback receiving the key and the corresponding value as its
     *  parameters. May explicitly return true to stop the loop.
     * @expose
     */
    walkDesc(minKey: K, maxKey: K, callback: (key: K, value: V) => void): void;
    /**
     * Counts the number of keys between minKey and maxKey (both inclusive).
     * @param {*=} minKey If omitted, counts from the start
     * @param {*=} maxKey If omitted, counts till the end
     * @returns {number}
     * @expose
     */
    count(minKey: K, maxKey: K): number;
    /**
     * Prints out all nodes in the tree.
     * @expose
     */
    print(): void;
    /**
     * Returns a string representation of this instance.
     * @returns {string}
     */
    toString(): string;
}
