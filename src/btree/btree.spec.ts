import { Tree } from './btree';
import { intcmp } from './btree';

// Run these specifications by selecting 'tests.html' from the 'Choose Program' toolbar menu.
// For a complete list of examples, please see the Jasmine DOCS.
describe("btree", function () {

    describe("debug", function () {
        const keys = [1, 2, 3];
        const tree = new Tree<number, string>(intcmp, 2);
        for (const key of keys) {
            tree.put(key, `${key}`);
        }
        it("should return undefined for a missing key", function () {
            expect(tree.get(42)).toBeUndefined();
        });
    });

    describe("get", function () {
        const keys = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const tree = new Tree<number, string>(intcmp);
        for (const key of keys) {
            tree.put(key, `${key}`);
        }
        it("should return the value for an existing key", function () {
            expect(tree.get(8)).toBe('8');
        });
        it("should return undefined for a missing key", function () {
            expect(tree.get(3)).toBeUndefined();
        });
    });

    describe("put", function () {
        const keys = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const tree = new Tree<number, string>(intcmp);
        for (const key of keys) {
            tree.put(key, `${key}`);
        }
        it("should return the value for an existing key", function () {
            expect(tree.get(8)).toBe('8');
        });
        it("should return undefined for a missing key", function () {
            expect(tree.get(3)).toBeUndefined();
        });
    });

    describe("delete", function () {
        const keys = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const tree = new Tree<number, string>(intcmp);
        for (const key of keys) {
            tree.put(key, `${key}`);
        }
        it("should remove the entry and return true for existing key", function () {
            expect(tree.del(8)).toBe(true);
            expect(tree.get(8)).toBeUndefined();
        });
        it("should return false if the key does not exist", function () {
            expect(tree.del(3)).toBe(false);
        });
    });
    describe("walkAsc(from, to)", function () {
        const comp = [2, 4, 5, 6, 8, 10, 12, 14];
        const data = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const tree = new Tree<number, string>(intcmp);
        for (const key of data) {
            tree.put(key, `${key}`);
        }
        const keys: number[] = [];
        const vals: string[] = [];
        tree.walkAsc(2, 14, function (key, value) {
            keys.push(key);
            vals.push(value);
        });
        it("should remove the entry and return true for existing key", function () {
            expect(keys).toEqual(comp);
        });
    });
    describe("walkDesc(to, from)", function () {
        const comp = [18, 16, 14, 12, 10, 8, 6, 5, 4, 2];
        const data = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const tree = new Tree<number, string>(intcmp);
        for (const key of data) {
            tree.put(key, `${key}`);
        }
        const keys: number[] = [];
        const vals: string[] = [];
        tree.walkDesc(2, 18, function (key, value) {
            keys.push(key);
            vals.push(value);
        });
        it("should remove the entry and return true for existing key", function () {
            expect(keys).toEqual(comp);
        });
    });
    describe("count(from, to)", function () {
        const data = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const tree = new Tree<number, string>(intcmp);
        for (const key of data) {
            tree.put(key, `${key}`);
        }
        it("should remove the entry and return true for existing key", function () {
            expect(tree.count(2, 18)).toBe(10);
        });
    });
});
