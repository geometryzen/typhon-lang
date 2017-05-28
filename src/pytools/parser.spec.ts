import { parse, PyNode, parseTreeDump } from './parser';
import { ParseTables } from './tables';
import { IDXLAST, TERMS } from './tree';
import { Tokens } from './Tokens';
import { tokenNames } from './tokenNames';
// import { astFromParse, astDump } from './builder';
// import { symbolTable } from './symtable';
// import { dumpSymbolTable } from './symtable';
// import { Module } from './types';

const sym = ParseTables.sym;

// Helper function to compute the terminals of a node and convert the type(s) to human-readable strings.
/*
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
*/

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

    xit('a * b', function () {
        const cst = parse('a * b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=Mult(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a / b', function () {
        const cst = parse('a / b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=Div(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a % b', function () {
        const cst = parse('a % b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=Mod(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a << b', function () {
        const cst = parse('a << b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=LShift(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a >> b', function () {
        const cst = parse('a >> b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=RShift(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a ^ b', function () {
        const cst = parse('a ^ b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=BitXor(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a & b', function () {
        const cst = parse('a & b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=BitAnd(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a | b', function () {
        const cst = parse('a | b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=BitOr(),right=Name(id=b,ctx=Load())))])');
    });

    xit('a or b', function () {
        const cst = parse('a or b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BoolOp(op=Or(),values=[Name(id=a,ctx=Load()),Name(id=b,ctx=Load())]))])');
    });

    xit('a and b', function () {
        const cst = parse('a and b') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BoolOp(op=And(),values=[Name(id=a,ctx=Load()),Name(id=b,ctx=Load())]))])');
    });

    xit('a + b * c', function () {
        const cst = parse('a + b * c') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=Add(),right=BinOp(left=Name(id=b,ctx=Load()),op=Mult(),right=Name(id=c,ctx=Load()))))])');
    });

    xit('a + b ^ c', function () {
        const cst = parse('a + b ^ c') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=BinOp(left=Name(id=a,ctx=Load()),op=Add(),right=BinOp(left=Name(id=b,ctx=Load()),op=BitXor(),right=Name(id=c,ctx=Load()))))])');
    });

    xit('not a', function () {
        const cst = parse('not a') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[Expr(value=UnaryOp(op=Not(),operand=Name(id=a,ctx=Load())))])');
    });

    xit('def foo():\n pass', function () {
        const cst = parse('def foo():\n pass') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[],vararg=None,kwarg=None,defaults=[]),body=[Pass()],decorator_list=[])])');
    });

    xit('def foo():\n return a', function () {
        const cst = parse('def foo():\n return a') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[],vararg=None,kwarg=None,defaults=[]),body=[ReturnStatement(value=Name(id=a,ctx=Load()))],decorator_list=[])])');
    });

    xit('def foo(x):\n pass', function () {
        const cst = parse('def foo(x):\n pass') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],decorator_list=[])])');
    });

    xit('def foo(x, y):\n pass', function () {
        const cst = parse('def foo(x, y):\n pass') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param()),Name(id=y,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],decorator_list=[])])');
    });

    xit('if a:\n pass', function () {
        const cst = parse('if a:\n pass') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[IfStatement(test=Name(id=a,ctx=Load()),consequent=[Pass()],alternate=[])])');
    });

    xit('if a:\n pass\nelse:\n pass', function () {
        const cst = parse('if a:\n pass\nelse:\n pass') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[IfStatement(test=Name(id=a,ctx=Load()),consequent=[Pass()],alternate=[Pass()])])');
    });

    xit('while a:\n pass', function () {
        const cst = parse('while a:\n pass') as PyNode;
        const dump = parseTreeDump(cst);
        expect(dump).toBe('Module(body=[WhileStatement(test=Name(id=a,ctx=Load()),body=[Pass()],orelse=[])])');
    });

    xit('ParseError', function () {
        try {
            const cst = parse('print 1s') as PyNode;
            const dump = parseTreeDump(cst);
            console.log(`ParseError??? ${dump}`);
        }
        catch (e) {
            expect(e.name).toBe('ParseError');
            const message = 'Unexpected T_NAME at [1,7]';
            expect(e.message).toBe(message);
            //      console.log("expect: " + JSON.stringify(message));
            //      console.log("actual: " + JSON.stringify(e.message));
            expect(e.lineNumber).toBe(1);
            expect(e.columnNumber).toBe(7);
            expect(e.toString()).toBe(e.name + ": " + message);
        }
    });

    xit('IndentationError', function () {
        try {
            const cst = parse('def f():\n    pass\n print') as PyNode;
            const dump = parseTreeDump(cst);
            console.log(`IndentationError??? ${dump}`);
        }
        catch (e) {
            expect(e.name).toBe('IndentationError');
            const message = 'unindent does not match any outer indentation level';
            expect(e.message).toBe(message);
            //      console.log("expect: " + JSON.stringify(message));
            //      console.log("actual: " + JSON.stringify(e.message));
            expect(e.lineNumber).toBe(3);
            expect(e.columnNumber).toBe(0);
            expect(e.toString()).toBe(e.name + ": " + message);
        }
    });

    xit('SyntaxError from builder', function () {
        try {
            const cst = parse('()=1') as PyNode;
            const dump = parseTreeDump(cst);
            console.log(`SyntaxError from builder??? ${dump}`);
        }
        catch (e) {
            expect(e.name).toBe('SyntaxError');
            const message = "can't assign to ()";
            expect(e.message).toBe(message);
            //      console.log("expect: " + JSON.stringify(message));
            //      console.log("actual: " + JSON.stringify(e.message));
            expect(e.lineNumber).toBe(1);
            expect(e.columnNumber).toBe(undefined);
            expect(e.toString()).toBe(e.name + ": " + message);
        }
    });

    // FIXME
    xit('SyntaxError from symtable', function () {
        try {
            const cst = parse('def f(x,x):\n  pass') as PyNode;
            /*const dump =*/ parseTreeDump(cst);
        }
        catch (e) {
            console.log(e);
            // expect(e.name).toBe('SyntaxError');
            // var message = "duplicate argument 'x' in function definition";
            // expect(e.message).toBe(message);
            //      console.log("expect: " + JSON.stringify(message));
            //      console.log("actual: " + JSON.stringify(e.message));
            // expect(e.fileName).toBe(fileName);
            // expect(e.lineNumber).toBe(1);
            // expect(e.columnNumber).toBe(undefined);
            // expect(e.toString()).toBe(e.name + ": " + message);
        }
    });

    xit('TokenError', function () {
        try {
            const cst = parse('"""') as PyNode;
            /*const dump =*/ parseTreeDump(cst);
            console.log("SyntaxError from symtable???");
        }
        catch (e) {
            expect(e.name).toBe('TokenError');
            const message = "EOF in multi-line string";
            // expect(e.message).toBe(message);
            //      console.log("expect: " + JSON.stringify(message));
            //      console.log("actual: " + JSON.stringify(e.message));
            expect(e.lineNumber).toBe(1);
            expect(e.columnNumber).toBe(0);
            expect(e.toString()).toBe(e.name + ": " + message);
        }
    });
});
