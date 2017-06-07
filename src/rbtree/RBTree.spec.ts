import { RBNode } from './RBNode';
import { RBTree } from './RBTree';

function expectInvariants(tree: RBTree) {
    expect(tree.hInv).toBe(true, `The height invariant is being violated for the tree with root ${tree.root.key}`);
    expect(tree.cInv).toBe(true, `The color invariant is being violated for the tree with root ${tree.root.key}`);
    expect(tree.root.blue).toBe(true, `The root of the tree should always be blue ${tree.root.key}`);
}

function expect123(tree: RBTree) {
    expect(tree.root.key).toBe(2);
    expect(tree.root.l.key).toBe(1);
    expect(tree.root.r.key).toBe(3);
    expectInvariants(tree);
}

function expectRed(node: RBNode, key: number) {
    expect(node.key).toBe(key);
    expect(node.red).toBe(true);
}

function expectBlue(node: RBNode, key: number) {
    expect(node.key).toBe(key);
    expect(node.blue).toBe(true);
}

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
        describe("one node permutation", function () {
            it('[1] should insert to root', function () {
                const tree = new RBTree(0, -1);
                tree.insert(1, 10);
                expect(tree.root.key).toBe(1);
                expect(tree.root.red).toBe(false);
            });
        });
        describe("two node permutations", function () {
            it('[1, 2] inserts 1 to root and 2 to right', function () {
                const tree = new RBTree(0, -1);
                const z = tree.z;
                tree.insert(1, 10);
                tree.insert(2, 20);
                expect(tree.root.key).toBe(1);
                expect(tree.root.l).toBe(z);
                expect(tree.root.r.key).toBe(2);
                expect(tree.root.red).toBe(false);
                expect(tree.root.r.red).toBe(true);
            });
            it('[2, 1] inserts 2 to root and 1 to left', function () {
                const tree = new RBTree(0, -1);
                const z = tree.z;
                tree.insert(2, 20);
                tree.insert(1, 10);
                expect(tree.root.key).toBe(2);
                expect(tree.root.l.key).toBe(1);
                expect(tree.root.r).toBe(z);
                expect(tree.root.red).toBe(false);
                expect(tree.root.l.red).toBe(true);
            });
        });
        describe("three node permutations", function () {
            it('[2, 1, 3] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                tree.insert(2, 20);
                tree.insert(1, 10);
                tree.insert(3, 30);
                expect123(tree);
                expect(tree.root.l.red).toBe(true);
                expect(tree.root.r.red).toBe(true);
            });
            it('[2, 3, 1] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                tree.insert(2, 20);
                tree.insert(3, 30);
                tree.insert(1, 10);
                expect123(tree);
                expect(tree.root.l.red).toBe(true);
                expect(tree.root.r.red).toBe(true);
            });
            it('[1, 2, 3] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                tree.insert(1, 10);
                tree.insert(2, 20);
                tree.insert(3, 30);
                expect123(tree);
                expect(tree.root.l.blue).toBe(true);
                expect(tree.root.r.blue).toBe(true);
            });
            it('[1, 3, 2] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                tree.insert(1, 10);
                tree.insert(3, 30);
                tree.insert(2, 20);
                expect123(tree);
                expect(tree.root.l.blue).toBe(true);
                expect(tree.root.r.blue).toBe(true);
            });
            it('[3, 1, 2] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                tree.insert(3, 30);
                tree.insert(1, 10);
                tree.insert(2, 20);
                expect123(tree);
                expect(tree.root.l.blue).toBe(true);
                expect(tree.root.r.blue).toBe(true);
            });
            it('[3, 2, 1] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                tree.insert(3, 3);
                tree.insert(2, 2);
                tree.insert(1, 1);
                expect123(tree);
                expect(tree.root.l.blue).toBe(true);
                expect(tree.root.r.blue).toBe(true);
            });
        });
        describe("four node permutations", function () {
            it('[4, 2, 1, 3]', function () {
                const tree = new RBTree(0, -1);
                tree.insert(4, 20);
                tree.insert(2, 20);
                tree.insert(1, 10);
                tree.insert(3, 30);
                expectInvariants(tree);
                expectBlue(tree.root, 2);
                expectBlue(tree.root.l, 1);
                expectBlue(tree.root.r, 4);
                expectRed(tree.root.r.l, 3);
            });
            it('[4, 2, 3, 1]', function () {
                const tree = new RBTree(0, -1);
                tree.insert(4, 20);
                tree.insert(2, 20);
                tree.insert(3, 30);
                tree.insert(1, 10);
                expectInvariants(tree);
                expectBlue(tree.root, 3);
                expectBlue(tree.root.l, 2);
                expectBlue(tree.root.r, 4);
                expectRed(tree.root.l.l, 1);
            });
            it('[4, 3, 2, 1]', function () {
                const tree = new RBTree(0, -1);
                tree.insert(4, 20);
                tree.insert(3, 30);
                tree.insert(2, 20);
                tree.insert(1, 10);
                expectInvariants(tree);
                expectBlue(tree.root, 3);
                expectBlue(tree.root.l, 2);
                expectBlue(tree.root.r, 4);
                expectRed(tree.root.l.l, 1);
            });
            it('[3, 4, 2, 1]', function () {
                const tree = new RBTree(0, -1);
                tree.insert(3, 30);
                tree.insert(4, 40);
                tree.insert(2, 20);
                tree.insert(1, 10);
                expectInvariants(tree);
                expectBlue(tree.root, 3);
                expectBlue(tree.root.l, 2);
                expectBlue(tree.root.r, 4);
                expectRed(tree.root.l.l, 1);
            });
        });
        describe("misc", function () {
            it('[50, 40, 30, 15, 20, 10]', function () {
                const tree = new RBTree(0, -1);
                tree.insert(50, 500);
                tree.insert(40, 400);
                tree.insert(30, 300);
                tree.insert(15, 150);
                tree.insert(20, 200);
                tree.insert(10, 100);
                expectInvariants(tree);
                expectBlue(tree.root.r, 50);
                expectBlue(tree.root, 40);
                expectBlue(tree.root.l.r, 30);
                expectBlue(tree.root.l.l, 15);
                expectRed(tree.root.l, 20);
                expectRed(tree.root.l.l.l, 10);
            });
        });
    });
    xdescribe("search", function () {
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

    xdescribe("remove", function () {
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


describe("debug", function () {
    describe("insert", function () {
        describe("seven node permutation", function () {
            it('[1, 2, 3, 4, 5, 6, 7]', function () {
                const tree = new RBTree(0, -1);
                expectInvariants(tree);

                const head = tree.head;
                const z = tree.z;

                // The tree is currently empty.
                expect(head.key).toBe(0);
                expect(head.blue).toBeTruthy();
                expect(head.l.key).toBe(z.key);
                expect(head.r.key).toBe(z.key);

                const n1 = tree.insert(1, 10);
                expectInvariants(tree);

                expect(n1.blue).toBeTruthy();

                expect(head.key).toBe(0);
                expect(head.l.key).toBe(z.key);
                expect(head.r.key).toBe(1);
                expect(tree.root.key).toBe(1);
                expect(tree.root.red).toBe(false);
                expect(tree.root.l).toBe(z);
                expect(tree.root.r).toBe(z);

                const n2 = tree.insert(2, 20);
                expectInvariants(tree);

                expect(n1.blue).toBeTruthy();
                expect(n2.red).toBeTruthy("n2 should be red in order that we have a 3-node");

                expect(tree.root.key).toBe(1);
                expect(tree.root.l.key).toBe(z.key);
                expect(tree.root.r.key).toBe(2);
                expect(tree.root.r.l).toBe(z);
                expect(tree.root.r.r).toBe(z);

                const n3 = tree.insert(3, 30);
                expect(tree.root.key).toBe(2);
                expect(tree.root.l.key).toBe(1);
                expect(tree.root.r.key).toBe(3);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expectInvariants(tree);

                const n4 = tree.insert(4, 40);
                expect(tree.root.key).toBe(2);
                expect(tree.root.l.key).toBe(1);
                expect(tree.root.r.key).toBe(3);
                expect(tree.root.r.r.key).toBe(4);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.red).toBeTruthy();
                expectInvariants(tree);

                const n5 = tree.insert(5, 50);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.red).toBeTruthy();
                expect(n5.blue).toBeTruthy();
                expectInvariants(tree);

                const n6 = tree.insert(6, 60);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.red).toBeTruthy();
                expect(n5.blue).toBeTruthy();
                expect(n6.red).toBeTruthy();
                expectInvariants(tree);

                const n7 = tree.insert(7, 70);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.blue).toBeTruthy();
                expect(n5.blue).toBeTruthy();
                expect(n6.blue).toBeTruthy();
                expect(n7.blue).toBeTruthy();

                expect(tree.root.key).toBe(4);
                expect(tree.root.l.key).toBe(2);
                expect(tree.root.r.key).toBe(6);
                expect(tree.root.l.l.key).toBe(1);
                expect(tree.root.l.r.key).toBe(3);
                expect(tree.root.r.l.key).toBe(5);
                expect(tree.root.r.r.key).toBe(7);
            });
            it('[7, 6, 5, 4, 3, 2, 1] inserts balanced', function () {
                const tree = new RBTree(0, -1);
                expectInvariants(tree);

                const head = tree.head;
                const z = tree.z;

                // The tree is currently empty.
                expect(head.key).toBe(0);
                expect(head.blue).toBeTruthy();
                expect(head.l.key).toBe(z.key);
                expect(head.r.key).toBe(z.key);

                const n7 = tree.insert(7, 10);
                expectInvariants(tree);

                expect(n7.blue).toBeTruthy();
                expect(head.key).toBe(0);
                expect(head.l.key).toBe(z.key);
                expect(head.r.key).toBe(7);
                expect(tree.root.key).toBe(7);
                expect(tree.root.red).toBe(false);
                expect(tree.root.l).toBe(z);
                expect(tree.root.r).toBe(z);

                const n6 = tree.insert(6, 20);
                expectInvariants(tree);

                expect(n7.blue).toBeTruthy();
                expect(n6.red).toBeTruthy();

                expect(tree.root.key).toBe(7);
                expect(tree.root.l.key).toBe(6);
                expect(tree.root.r).toBe(z);
                expect(tree.root.r.l).toBe(z);
                expect(tree.root.r.r).toBe(z);

                // const n5 = tree.insert(5, 30);
                // expect(tree.root.key).toBe(6);
                // expect(tree.root.l.key).toBe(5);
                // expect(tree.root.r.key).toBe(7);
                /*

                const n3 = tree.insert(3, 30);
                expect(tree.root.key).toBe(2);
                expect(tree.root.l.key).toBe(1);
                expect(tree.root.r.key).toBe(3);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expectInvariants(tree);

                const n4 = tree.insert(4, 40);
                expect(tree.root.key).toBe(2);
                expect(tree.root.l.key).toBe(1);
                expect(tree.root.r.key).toBe(3);
                expect(tree.root.r.r.key).toBe(4);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.red).toBeTruthy();
                expectInvariants(tree);

                const n5 = tree.insert(5, 50);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.red).toBeTruthy();
                expect(n5.blue).toBeTruthy();
                expectInvariants(tree);

                const n6 = tree.insert(6, 60);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.red).toBeTruthy();
                expect(n5.blue).toBeTruthy();
                expect(n6.red).toBeTruthy();
                expectInvariants(tree);

                const n7 = tree.insert(7, 70);
                expect(n1.blue).toBeTruthy();
                expect(n2.blue).toBeTruthy();
                expect(n3.blue).toBeTruthy();
                expect(n4.blue).toBeTruthy();
                expect(n5.blue).toBeTruthy();
                expect(n6.blue).toBeTruthy();
                expect(n7.blue).toBeTruthy();

                expect(tree.root.key).toBe(4);
                expect(tree.root.l.key).toBe(2);
                expect(tree.root.r.key).toBe(6);
                expect(tree.root.l.l.key).toBe(1);
                expect(tree.root.l.r.key).toBe(3);
                expect(tree.root.r.l.key).toBe(5);
                expect(tree.root.r.r.key).toBe(7);
                */
            });
        });
    });
});

