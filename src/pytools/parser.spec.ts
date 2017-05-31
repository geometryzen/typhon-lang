import { parse, PyNode, parseTreeDump, SourceKind } from './parser';
import { ParseTables } from './tables';
import { IDXLAST, TERMS } from './tree';
import { sourceLines } from '../data/eight';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
// import { astFromParse, astDump } from './builder';
// import { symbolTable } from './symtable';
// import { dumpSymbolTable } from './symtable';
// import { Module } from './types';

const sym = ParseTables.sym;

// Helper function to compute the terminals of a node and convert the type(s) to human-readable strings.

function DECODE(n: PyNode) {
    return TERMS(n).map(function (term) {
        return {
            type: tokenNames[term.type],
            value: term.value,
            lineno: term.lineno,
            col_offset: term.col_offset,
            children: term.children,
            context: term.context,
            used_names: term.used_names
        };
    });
}

describe('parse', function () {

    it('123', function () {
        const cst: boolean | PyNode = parse('123');
        if (typeof cst === 'object') {
            expect(cst.type).toBe(sym.file_input);
            expect(cst.value).toBeNull();
            expect(cst.context).toBeNull();
            expect(cst.lineno).toBeUndefined();
            expect(cst.col_offset).toBeUndefined();
            expect(cst.used_names).toEqual({});
            expect(cst.children).toBeDefined();
            expect(Array.isArray(cst.children)).toBeTruthy();

            // Working with the parse tree would make the tests fragile.
            // (Unless you want to closely monitor the grammar).
            // Instead, we will inspect the leaf nodes.
            const ns = TERMS(cst);
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(3);

            const n0 = ns[0];
            const n1 = ns[1];
            const n2 = ns[2];

            expect(n0.type).toBe(Tokens.T_NUMBER);
            expect(n0.value).toBe("123");
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(n1.type).toBe(Tokens.T_NEWLINE);
            expect(n1.value).toBe("\n");
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(3);
            expect(n1.children).toBeNull();

            expect(n2.type).toBe(Tokens.T_ENDMARKER);
            expect(n2.value).toBe("");
            expect(n2.lineno).toBe(2);
            expect(n2.col_offset).toBe(0);
            expect(n2.children).toBeNull();
        }
    });

    it('1.23', function () {
        const cst = parse('1.23') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("1.23");
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(4);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('123L', function () {
        const cst = parse('123L') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("123L");
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(4);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('0xFFFFFF', function () {
        const cst = parse('0xFFFFFF') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("0xFFFFFF");
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(8);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('0O0505L', function () {
        const cst = parse('0O0505L') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("0O0505L");
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(7);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('"Hello"', function () {
        const cst = parse('"Hello"') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_STRING);
        expect(n0.value).toBe('"Hello"');
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(7);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });


    it('True', function () {
        const cst = parse('True') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NAME);
        expect(n0.value).toBe('True');
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(4);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('False', function () {
        const cst = parse('False') as PyNode;
        const ns = TERMS(cst);
        // console.log(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NAME);
        expect(n0.value).toBe('False');
        expect(n0.lineno).toBe(1);
        expect(n0.col_offset).toBe(0);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.lineno).toBe(1);
        expect(n1.col_offset).toBe(5);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.lineno).toBe(2);
        expect(n2.col_offset).toBe(0);
        expect(n2.children).toBeNull();
    });

    describe('[]', function () {
        const cst = parse('[]') as PyNode;

        // console.log(JSON.stringify(DECODE(cst), null, 2));

        const ns = TERMS(cst);
        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(4);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];
        const n3 = ns[3];

        it("should have the correct terminals", function () {
            expect(n0.type).toBe(Tokens.T_LSQB);
            expect(n0.value).toBe('[');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(n1.type).toBe(Tokens.T_RSQB);
            expect(n1.value).toBe("]");
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(1);
            expect(n1.children).toBeNull();

            expect(n2.type).toBe(Tokens.T_NEWLINE);
            expect(n2.value).toBe("\n");
            expect(n2.lineno).toBe(1);
            expect(n2.col_offset).toBe(2);
            expect(n2.children).toBeNull();

            expect(n3.type).toBe(Tokens.T_ENDMARKER);
            expect(n3.value).toBe("");
            expect(n3.lineno).toBe(2);
            expect(n3.col_offset).toBe(0);
            expect(n3.children).toBeNull();

        });
    });

    describe('{}', function () {
        const cst = parse('{}') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(4);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];
        const n3 = ns[3];

        it("should have the correct terminals", function () {
            expect(n0.type).toBe(Tokens.T_LBRACE);
            expect(n0.value).toBe('{');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(n1.type).toBe(Tokens.T_RBRACE);
            expect(n1.value).toBe("}");
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(1);
            expect(n1.children).toBeNull();

            expect(n2.type).toBe(Tokens.T_NEWLINE);
            expect(n2.value).toBe("\n");
            expect(n2.lineno).toBe(1);
            expect(n2.col_offset).toBe(2);
            expect(n2.children).toBeNull();

            expect(n3.type).toBe(Tokens.T_ENDMARKER);
            expect(n3.value).toBe("");
            expect(n3.lineno).toBe(2);
            expect(n3.col_offset).toBe(0);
            expect(n3.children).toBeNull();

        });
    });

    describe('a', function () {
        const cst = parse('a') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(3);
        });

        const n0 = ns[0];
        const nl = ns[1];
        const em = ns[2];

        it("should have the correct terminals", function () {
            expect(n0.type).toBe(Tokens.T_NAME);
            expect(n0.value).toBe('a');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(nl.type).toBe(Tokens.T_NEWLINE);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(1);
            expect(nl.children).toBeNull();

            expect(em.type).toBe(Tokens.T_ENDMARKER);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();

        });
    });

    describe('Unary Plus', function () {
        const cst = parse('+a') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(4);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const nl = ns[2];
        const em = ns[3];

        it("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_PLUS]);
            expect(n0.value).toBe('+');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n1.value).toBe('a');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(1);
            expect(n1.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(2);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();

        });
    });

    describe('Unary Minus', function () {
        const cst = parse('-a') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(4);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const nl = ns[2];
        const em = ns[3];

        it("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_MINUS]);
            expect(n0.value).toBe('-');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n1.value).toBe('a');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(1);
            expect(n1.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(2);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('Unary Tilde', function () {
        const cst = parse('~a') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(4);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const nl = ns[2];
        const em = ns[3];

        it("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_TILDE]);
            expect(n0.value).toBe('~');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n1.value).toBe('a');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(1);
            expect(n1.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(2);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('Binary Addition', function () {
        const cst = parse('a + b') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(5);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        it("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n0.value).toBe('a');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_PLUS]);
            expect(n1.value).toBe('+');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.lineno).toBe(1);
            expect(n2.col_offset).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('Binary Subtraction', function () {
        const cst = parse('a - b') as PyNode;
        // console.log(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(5);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        it("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n0.value).toBe('a');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_MINUS]);
            expect(n1.value).toBe('-');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.lineno).toBe(1);
            expect(n2.col_offset).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    it("ImportFrom", function () {
        const cst = parse("from 'x' import a, b") as PyNode;
        const dump = parseTreeDump(cst);
        expect(typeof dump).toBe('string');
        // expect(dump).toBe('');
    });

    // FIXME: Why is this not being run?
    describe('Binary Multiplication', function () {
        const cst = parse('a * b') as PyNode;
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(5);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        it("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n0.value).toBe('a');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_STAR]);
            expect(n1.value).toBe('*');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.lineno).toBe(1);
            expect(n2.col_offset).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('a = b.c(t)', function () {
        const cst = parse('a = b.c(t)') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(10);
        });

        const a = ns[0];
        const eq = ns[1];
        const b = ns[2];
        const dot = ns[3];
        const c = ns[4];
        const lPar = ns[5];
        const t = ns[6];
        const rPar = ns[7];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        it("should have the correct terminals", function () {
            expect(tokenNames[a.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(a.value).toBe('a');
            expect(a.lineno).toBe(1);
            expect(a.col_offset).toBe(0);
            expect(a.children).toBeNull();

            expect(tokenNames[eq.type]).toBe(tokenNames[Tokens.T_EQUAL]);
            expect(eq.value).toBe('=');
            expect(eq.lineno).toBe(1);
            expect(eq.col_offset).toBe(2);
            expect(eq.children).toBeNull();

            expect(tokenNames[b.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(b.value).toBe('b');
            expect(b.lineno).toBe(1);
            expect(b.col_offset).toBe(4);
            expect(b.children).toBeNull();

            expect(tokenNames[dot.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot.value).toBe('.');
            expect(dot.lineno).toBe(1);
            expect(dot.col_offset).toBe(5);
            expect(dot.children).toBeNull();

            expect(tokenNames[c.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(c.value).toBe('c');
            expect(c.lineno).toBe(1);
            expect(c.col_offset).toBe(6);
            expect(c.children).toBeNull();

            expect(tokenNames[lPar.type]).toBe(tokenNames[Tokens.T_LPAR]);
            expect(lPar.value).toBe('(');
            expect(lPar.lineno).toBe(1);
            expect(lPar.col_offset).toBe(7);
            expect(lPar.children).toBeNull();

            expect(tokenNames[t.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(t.value).toBe('t');
            expect(t.lineno).toBe(1);
            expect(t.col_offset).toBe(8);
            expect(t.children).toBeNull();

            expect(tokenNames[rPar.type]).toBe(tokenNames[Tokens.T_RPAR]);
            expect(rPar.value).toBe(')');
            expect(rPar.lineno).toBe(1);
            expect(rPar.col_offset).toBe(9);
            expect(rPar.children).toBeNull();

            // Newline
            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(10);
            expect(nl.children).toBeNull();

            // End Marker
            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });


    describe('Parser', function () {
        const t0 = Date.now();
        const cst = parse(sourceLines.join('\n'), SourceKind.File) as PyNode;
        const t1 = Date.now();
        const decode = JSON.stringify(DECODE(cst), null, 2);
        let view = decode;
        view = view;
        // console.log(decode);
        const ns = TERMS(cst);

        it("performance should not degrade", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(247);
            // console.log(`Parser    performance parse          (${ns.length} terminals) took ${t1 - t0} ms`);
            // This has been benchmarked at around 20-40 ms.
            expect(t1 - t0 < 60).toBe(true);
        });

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        xit("should have the correct terminals", function () {
            expect(tokenNames[n0.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n0.value).toBe('a');
            expect(n0.lineno).toBe(1);
            expect(n0.col_offset).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_MINUS]);
            expect(n1.value).toBe('-');
            expect(n1.lineno).toBe(1);
            expect(n1.col_offset).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.lineno).toBe(1);
            expect(n2.col_offset).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.lineno).toBe(1);
            expect(nl.col_offset).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.lineno).toBe(2);
            expect(em.col_offset).toBe(0);
            expect(em.children).toBeNull();
        });
    });

});
