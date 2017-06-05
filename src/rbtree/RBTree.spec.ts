import { RBTree } from './RBTree';

describe("RBTree", function () {
    describe("constructor", function () {
        const zValue = -42;
        const tree = new RBTree(0, zValue);
        const z = tree.z;
        // const head = tree.head;
        it("should create the dummy node", function () {
            expect(z).toBeDefined();
        });
        it("should satisfy z.l = z", function () {
            expect(z.l).toBe(z);
        });
        it("should satisfy z.r = z", function () {
            expect(z.r).toBe(z);
        });
        // TODO: generics.
        it("should satisfy z.value = constructer zValue argument", function () {
            expect(z.value).toBe(zValue);
        });
        it("should satisfy root (head.r) = z", function () {
            expect(tree.root).toBe(z);
        });
        /*
        it("should create the head node", function () {
            expect(head).toBeDefined();
        });
        it("should satisfy head.l = undefined", function () {
            expect(head.l).toBeUndefined();
        });
        it("should satisfy head.r = z", function () {
            expect(head.r).toBe(z);
        });
        // TODO: generics.
        it("should satisfy head.key = 0", function () {
            expect(head.key).toBe(0);
        });
        */
        it("should set the number of keys inserted to zero", function () {
            expect(tree.N).toBe(0);
        });
    });
    describe("insert", function () {
        it("should update the count of nodes inserted", function () {
            const tree = new RBTree(0, -1);
            for (let i = 1; i <= 10; i++) {
                tree.insert(i, Math.random());
                expect(tree.N).toBe(i);
            }
        });
        it("should not allow key = head key", function () {
            const headKey = 100;
            const tree = new RBTree(headKey, -1);
            tree.insert(headKey + 1, Math.random());
            expect(tree.N).toBe(1);
            expect(function () {
                tree.insert(headKey, Math.random());
            }).toThrowError();
        });
        it("should not allow key < head key", function () {
            const headKey = 100;
            const tree = new RBTree(headKey, -1);
            tree.insert(headKey + 1, Math.random());
            expect(tree.N).toBe(1);
            expect(function () {
                tree.insert(headKey - 1, Math.random());
            }).toThrowError();
        });
    });
    describe("search", function () {
        it("should find an internal node", function () {
            const headKey = 0;
            const zValue = -1;
            const tree = new RBTree(headKey, zValue);
            const value = Math.random();
            tree.insert(23, value);
            expect(tree.search(23)).toBe(value);
            expect(tree.search(3)).toBe(zValue);
        });
    });

    describe("remove", function () {
        it("should find an internal node", function () {
            const headKey = 0;
            const zValue = -1;
            const tree = new RBTree(headKey, zValue);
            tree.insert(4, 40);
            tree.insert(2, 20);
            tree.insert(6, 60);
            tree.insert(1, 10);
            tree.insert(3, 30);
            tree.insert(5, 50);
            tree.insert(7, 70);

            tree.remove(4);

            expect(tree.search(1)).toBe(10);
            expect(tree.search(2)).toBe(20);
            expect(tree.search(3)).toBe(30);
            expect(tree.search(4)).toBe(zValue);
            expect(tree.search(5)).toBe(50);
            expect(tree.search(6)).toBe(60);
            expect(tree.search(7)).toBe(70);

            // expect(tree.root.key).toBe(5);
        });
    });
});
