import { parse, PyNode, cstDump, SourceKind } from './parser';
import { IDXLAST, TERMS } from '../common/tree';
import { sourceLines } from '../data/eight';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
// import { astFromParse, astDump } from './builder';
// import { symbolTable } from './symtable';
// import { dumpSymbolTable } from './symtable';
// import { Module } from './types';

// Helper function to compute the terminals of a node and convert the type(s) to human-readable strings.

function DECODE(n: PyNode) {
    return TERMS(n).map(function (term) {
        return {
            type: tokenNames[term.type],
            value: term.value,
            range: term.range,
            children: term.children,
            used_names: term.used_names
        };
    });
}

describe('parse', function () {

    it('1.23', function () {
        const cst = parse('1.23') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("1.23");
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);
        expect(n0.range.end.line).toBe(1);
        expect(n0.range.end.column).toBe(4);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(4);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('1.23', function () {
        const cst = parse('1.23') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("1.23");
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);
        expect(n0.range.end.line).toBe(1);
        expect(n0.range.end.column).toBe(4);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(4);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('123L', function () {
        const cst = parse('123L') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("123L");
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);
        expect(n0.range.end.line).toBe(1);
        expect(n0.range.end.column).toBe(4);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(4);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('0xFFFFFF', function () {
        const cst = parse('0xFFFFFF') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("0xFFFFFF");
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);
        expect(n0.range.end.line).toBe(1);
        expect(n0.range.end.column).toBe(8);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(8);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('0O0505L', function () {
        const cst = parse('0O0505L') as PyNode;
        const ns = TERMS(cst);
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NUMBER);
        expect(n0.value).toBe("0O0505L");
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);
        expect(n0.range.end.line).toBe(1);
        expect(n0.range.end.column).toBe(7);
        expect(n0.children).toBeNull();

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(7);
        expect(n1.children).toBeNull();

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
        expect(n2.children).toBeNull();
    });

    it('"Hello"', function () {
        const cst = parse('"Hello"') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_STRING);
        expect(n0.value).toBe('"Hello"');
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(7);

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
    });


    it('True', function () {
        const cst = parse('True') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NAME);
        expect(n0.value).toBe('True');
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(4);

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
    });

    it('False', function () {
        const cst = parse('False') as PyNode;
        const ns = TERMS(cst);
        // console.lg(JSON.stringify(ns, null, 2));
        expect(Array.isArray(ns)).toBeTruthy();
        expect(ns.length).toBe(3);

        const n0 = ns[0];
        const n1 = ns[1];
        const n2 = ns[2];

        expect(n0.type).toBe(Tokens.T_NAME);
        expect(n0.value).toBe('False');
        expect(n0.range.begin.line).toBe(1);
        expect(n0.range.begin.column).toBe(0);

        expect(n1.type).toBe(Tokens.T_NEWLINE);
        expect(n1.value).toBe("\n");
        expect(n1.range.begin.line).toBe(1);
        expect(n1.range.begin.column).toBe(5);

        expect(n2.type).toBe(Tokens.T_ENDMARKER);
        expect(n2.value).toBe("");
        expect(n2.range.begin.line).toBe(2);
        expect(n2.range.begin.column).toBe(0);
    });

    describe('[]', function () {
        const cst = parse('[]') as PyNode;

        // console.lg(JSON.stringify(DECODE(cst), null, 2));

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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);

            expect(n1.type).toBe(Tokens.T_RSQB);
            expect(n1.value).toBe("]");
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(1);

            expect(n2.type).toBe(Tokens.T_NEWLINE);
            expect(n2.value).toBe("\n");
            expect(n2.range.begin.line).toBe(1);
            expect(n2.range.begin.column).toBe(2);
            expect(n2.children).toBeNull();

            expect(n3.type).toBe(Tokens.T_ENDMARKER);
            expect(n3.value).toBe("");
            expect(n3.range.begin.line).toBe(2);
            expect(n3.range.begin.column).toBe(0);
            expect(n3.children).toBeNull();

        });
    });

    describe('{}', function () {
        const cst = parse('{}') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);

            expect(n1.type).toBe(Tokens.T_RBRACE);
            expect(n1.value).toBe("}");
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(1);

            expect(n2.type).toBe(Tokens.T_NEWLINE);
            expect(n2.value).toBe("\n");
            expect(n2.range.begin.line).toBe(1);
            expect(n2.range.begin.column).toBe(2);

            expect(n3.type).toBe(Tokens.T_ENDMARKER);
            expect(n3.value).toBe("");
            expect(n3.range.begin.line).toBe(2);
            expect(n3.range.begin.column).toBe(0);
            expect(n3.children).toBeNull();

        });
    });

    describe('a', function () {
        const cst = parse('a') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(nl.type).toBe(Tokens.T_NEWLINE);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(1);
            expect(nl.children).toBeNull();

            expect(em.type).toBe(Tokens.T_ENDMARKER);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();

        });
    });

    describe('funcDef', function () {
        const sourceText = [
            "def foo() -> GG: xyz"
        ].join('\n');
        const cst = parse(sourceText) as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(10);
        });

        const n0 = ns[0];
        const nl = ns[1];
        const em = ns[2];

        xit("should have the correct terminals", function () {
            expect(n0.type).toBe(Tokens.T_NAME);
            expect(n0.value).toBe('a');
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(nl.type).toBe(Tokens.T_NEWLINE);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(1);
            expect(nl.children).toBeNull();

            expect(em.type).toBe(Tokens.T_ENDMARKER);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();

        });
    });

    describe('Unary Plus', function () {
        const cst = parse('+a') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n1.value).toBe('a');
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(1);
            expect(n1.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(2);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();

        });
    });

    describe('Unary Minus', function () {
        const cst = parse('-a') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n1.value).toBe('a');
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(1);
            expect(n1.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(2);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('Unary Tilde', function () {
        const cst = parse('~a') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n1.value).toBe('a');
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(1);
            expect(n1.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(2);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('Binary Addition', function () {
        const cst = parse('a + b') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_PLUS]);
            expect(n1.value).toBe('+');
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.range.begin.line).toBe(1);
            expect(n2.range.begin.column).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('Binary Subtraction', function () {
        const cst = parse('a - b') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_MINUS]);
            expect(n1.value).toBe('-');
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.range.begin.line).toBe(1);
            expect(n2.range.begin.column).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    it("ImportFrom", function () {
        const cst = parse("from 'x' import a, b") as PyNode;
        const dump = cstDump(cst);
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
            expect(n0.range.begin.line).toBe(1);
            expect(n0.range.begin.column).toBe(0);
            expect(n0.children).toBeNull();

            expect(tokenNames[n1.type]).toBe(tokenNames[Tokens.T_STAR]);
            expect(n1.value).toBe('*');
            expect(n1.range.begin.line).toBe(1);
            expect(n1.range.begin.column).toBe(2);
            expect(n1.children).toBeNull();

            expect(tokenNames[n2.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(n2.value).toBe('b');
            expect(n2.range.begin.line).toBe(1);
            expect(n2.range.begin.column).toBe(4);
            expect(n2.children).toBeNull();

            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(5);
            expect(nl.children).toBeNull();

            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
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
            expect(a.range.begin.line).toBe(1);
            expect(a.range.begin.column).toBe(0);
            expect(a.children).toBeNull();

            expect(tokenNames[eq.type]).toBe(tokenNames[Tokens.T_EQUAL]);
            expect(eq.value).toBe('=');
            expect(eq.range.begin.line).toBe(1);
            expect(eq.range.begin.column).toBe(2);
            expect(eq.children).toBeNull();

            expect(tokenNames[b.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(b.value).toBe('b');
            expect(b.range.begin.line).toBe(1);
            expect(b.range.begin.column).toBe(4);
            expect(b.children).toBeNull();

            expect(tokenNames[dot.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot.value).toBe('.');
            expect(dot.range.begin.line).toBe(1);
            expect(dot.range.begin.column).toBe(5);
            expect(dot.children).toBeNull();

            expect(tokenNames[c.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(c.value).toBe('c');
            expect(c.range.begin.line).toBe(1);
            expect(c.range.begin.column).toBe(6);
            expect(c.children).toBeNull();

            expect(tokenNames[lPar.type]).toBe(tokenNames[Tokens.T_LPAR]);
            expect(lPar.value).toBe('(');
            expect(lPar.range.begin.line).toBe(1);
            expect(lPar.range.begin.column).toBe(7);
            expect(lPar.children).toBeNull();

            expect(tokenNames[t.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(t.value).toBe('t');
            expect(t.range.begin.line).toBe(1);
            expect(t.range.begin.column).toBe(8);
            expect(t.children).toBeNull();

            expect(tokenNames[rPar.type]).toBe(tokenNames[Tokens.T_RPAR]);
            expect(rPar.value).toBe(')');
            expect(rPar.range.begin.line).toBe(1);
            expect(rPar.range.begin.column).toBe(9);
            expect(rPar.children).toBeNull();

            // Newline
            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(10);
            expect(nl.children).toBeNull();

            // End Marker
            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('a().b()', function () {
        const cst = parse('a().b()') as PyNode;
        // console.lg(JSON.stringify(DECODE(cst), null, 2));
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(9);
        });

        const a = ns[0];
        const lPar1 = ns[1];
        const rPar1 = ns[2];
        const dot = ns[3];
        const b = ns[4];
        const lPar2 = ns[5];
        const rPar2 = ns[6];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        it("should have the correct terminals", function () {
            expect(tokenNames[a.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(a.value).toBe('a');
            expect(a.range.begin.line).toBe(1);
            expect(a.range.begin.column).toBe(0);
            expect(a.children).toBeNull();

            expect(tokenNames[lPar1.type]).toBe(tokenNames[Tokens.T_LPAR]);
            expect(lPar1.value).toBe('(');
            expect(lPar1.range.begin.line).toBe(1);
            expect(lPar1.range.begin.column).toBe(1);
            expect(lPar1.children).toBeNull();

            expect(tokenNames[rPar1.type]).toBe(tokenNames[Tokens.T_RPAR]);
            expect(rPar1.value).toBe(')');
            expect(rPar1.range.begin.line).toBe(1);
            expect(rPar1.range.begin.column).toBe(2);
            expect(rPar1.children).toBeNull();

            expect(tokenNames[dot.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot.value).toBe('.');
            expect(dot.range.begin.line).toBe(1);
            expect(dot.range.begin.column).toBe(3);
            expect(dot.children).toBeNull();

            expect(tokenNames[b.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(b.value).toBe('b');
            expect(b.range.begin.line).toBe(1);
            expect(b.range.begin.column).toBe(4);
            expect(b.children).toBeNull();

            expect(tokenNames[lPar2.type]).toBe(tokenNames[Tokens.T_LPAR]);
            expect(lPar2.value).toBe('(');
            expect(lPar2.range.begin.line).toBe(1);
            expect(lPar2.range.begin.column).toBe(5);
            expect(lPar2.children).toBeNull();

            expect(tokenNames[rPar2.type]).toBe(tokenNames[Tokens.T_RPAR]);
            expect(rPar2.value).toBe(')');
            expect(rPar2.range.begin.line).toBe(1);
            expect(rPar2.range.begin.column).toBe(6);
            expect(rPar2.children).toBeNull();

            // Newline
            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(7);
            expect(nl.children).toBeNull();

            // End Marker
            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
            expect(em.children).toBeNull();
        });
    });

    describe('a.b.c(d.e).f(g.h)', function () {
        const cst = parse('a.b.c(d.e).f(g.h)') as PyNode;
        const ns = TERMS(cst);

        it("should have correct number of terminals", function () {
            expect(Array.isArray(ns)).toBeTruthy();
            expect(ns.length).toBe(19);
        });

        const a = ns[0];
        const dot1 = ns[1];
        const b = ns[2];
        const dot2 = ns[3];
        const c = ns[4];
        const lPar1 = ns[5];
        const d = ns[6];
        const dot3 = ns[7];
        const e = ns[8];
        const rPar1 = ns[9];
        const dot4 = ns[10];
        const f = ns[11];
        const lPar2 = ns[12];
        const g = ns[13];
        const dot5 = ns[14];
        const h = ns[15];
        const rPar2 = ns[16];

        const nl = ns[IDXLAST(ns) - 1];
        const em = ns[IDXLAST(ns)];

        it("should have the correct terminals", function () {
            expect(tokenNames[a.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(a.value).toBe('a');
            expect(a.range.begin.line).toBe(1);
            expect(a.range.begin.column).toBe(0);
            expect(a.children).toBeNull();

            expect(tokenNames[dot1.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot1.value).toBe('.');
            expect(dot1.range.begin.line).toBe(1);
            expect(dot1.range.begin.column).toBe(1);
            expect(dot1.children).toBeNull();

            expect(tokenNames[b.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(b.value).toBe('b');
            expect(b.range.begin.line).toBe(1);
            expect(b.range.begin.column).toBe(2);
            expect(b.children).toBeNull();

            expect(tokenNames[dot2.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot2.value).toBe('.');
            expect(dot2.range.begin.line).toBe(1);
            expect(dot2.range.begin.column).toBe(3);
            expect(dot2.children).toBeNull();

            expect(tokenNames[c.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(c.value).toBe('c');
            expect(c.range.begin.line).toBe(1);
            expect(c.range.begin.column).toBe(4);
            expect(c.children).toBeNull();

            expect(tokenNames[lPar1.type]).toBe(tokenNames[Tokens.T_LPAR]);
            expect(lPar1.value).toBe('(');
            expect(lPar1.range.begin.line).toBe(1);
            expect(lPar1.range.begin.column).toBe(5);
            expect(lPar1.children).toBeNull();

            expect(tokenNames[d.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(d.value).toBe('d');
            expect(d.range.begin.line).toBe(1);
            expect(d.range.begin.column).toBe(6);
            expect(d.children).toBeNull();

            expect(tokenNames[dot3.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot3.value).toBe('.');
            expect(dot3.range.begin.line).toBe(1);
            expect(dot3.range.begin.column).toBe(7);
            expect(dot3.children).toBeNull();

            expect(tokenNames[e.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(e.value).toBe('e');
            expect(e.range.begin.line).toBe(1);
            expect(e.range.begin.column).toBe(8);
            expect(e.children).toBeNull();

            expect(tokenNames[rPar1.type]).toBe(tokenNames[Tokens.T_RPAR]);
            expect(rPar1.value).toBe(')');
            expect(rPar1.range.begin.line).toBe(1);
            expect(rPar1.range.begin.column).toBe(9);
            expect(rPar1.children).toBeNull();

            expect(tokenNames[dot4.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot4.value).toBe('.');
            expect(dot4.range.begin.line).toBe(1);
            expect(dot4.range.begin.column).toBe(10);
            expect(dot4.children).toBeNull();

            expect(tokenNames[f.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(f.value).toBe('f');
            expect(f.range.begin.line).toBe(1);
            expect(f.range.begin.column).toBe(11);
            expect(f.children).toBeNull();

            expect(tokenNames[lPar2.type]).toBe(tokenNames[Tokens.T_LPAR]);
            expect(lPar2.value).toBe('(');
            expect(lPar2.range.begin.line).toBe(1);
            expect(lPar2.range.begin.column).toBe(12);
            expect(lPar2.children).toBeNull();

            expect(tokenNames[g.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(g.value).toBe('g');
            expect(g.range.begin.line).toBe(1);
            expect(g.range.begin.column).toBe(13);
            expect(g.children).toBeNull();

            expect(tokenNames[dot5.type]).toBe(tokenNames[Tokens.T_DOT]);
            expect(dot5.value).toBe('.');
            expect(dot5.range.begin.line).toBe(1);
            expect(dot5.range.begin.column).toBe(14);
            expect(dot5.children).toBeNull();

            expect(tokenNames[h.type]).toBe(tokenNames[Tokens.T_NAME]);
            expect(h.value).toBe('h');
            expect(h.range.begin.line).toBe(1);
            expect(h.range.begin.column).toBe(15);
            expect(h.children).toBeNull();

            expect(tokenNames[rPar2.type]).toBe(tokenNames[Tokens.T_RPAR]);
            expect(rPar2.value).toBe(')');
            expect(rPar2.range.begin.line).toBe(1);
            expect(rPar2.range.begin.column).toBe(16);
            expect(rPar2.children).toBeNull();

            // Newline
            expect(tokenNames[nl.type]).toBe(tokenNames[Tokens.T_NEWLINE]);
            expect(nl.value).toBe("\n");
            expect(nl.range.begin.line).toBe(1);
            expect(nl.range.begin.column).toBe(17);
            expect(nl.children).toBeNull();

            // End Marker
            expect(tokenNames[em.type]).toBe(tokenNames[Tokens.T_ENDMARKER]);
            expect(em.value).toBe("");
            expect(em.range.begin.line).toBe(2);
            expect(em.range.begin.column).toBe(0);
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
        // console.lg(decode);
        const ns = TERMS(cst);

        it("performance should not degrade", function () {
            expect(Array.isArray(ns)).toBeTruthy("ns should be an array.");
            expect(ns.length).toBe(247, "number of terms changed");
            // console.lg(`Parser    performance parse          (${ns.length} terminals) took ${t1 - t0} ms`);
            // This has been benchmarked at around 20-40 ms.
            const benchmark = 42;
            expect(t1 - t0 < 2 * benchmark).toBe(true, `Took ${t1 - t0} ms, Expecting ${benchmark}`);
        });
    });

});
