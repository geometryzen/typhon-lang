import { parse, PyNode } from './parser';
import { ParseError } from './syntaxError';
import { astFromParse, astDump } from './builder';
import { semanticsOfModule } from './symtable';
// import { dumpSymbolTable } from './symtable';
import { Module } from './types';

describe('AST', function () {

    it('123', function () {
        const cst: boolean | PyNode = parse('123');
        if (typeof cst === 'object') {
            const ast: Module = new Module(astFromParse(cst));
            const dump = astDump(ast);
            expect(dump).toBe('Module(body=[ExpressionStatement(value=Num(n=123))])');
            /* const st = */ semanticsOfModule(ast);
            // const dumpST = dumpSymbolTable(st);
            // console.log(dumpST);
        }
    });

    it('1.23', function () {
        const cst = parse('1.23') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Num(n=1.23))])');
    });

    it('123L', function () {
        const cst = parse('123L') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Num(n=123))])');
    });

    it('0xFFFFFF', function () {
        const cst = parse('0xFFFFFF') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Num(n=16777215))])');
    });

    it('0O0505L', function () {
        const cst = parse('0O0505L') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Num(n=0O0505))])');
    });

    it('"Hello"', function () {
        const cst = parse('"Hello"') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Str(s=Hello))])');
    });

    it('True', function () {
        const cst = parse('True') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Name(id=True,ctx=Load()))])');
    });

    it('False', function () {
        const cst = parse('False') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Name(id=False,ctx=Load()))])');
    });

    it('[]', function () {
        const cst = parse('[]') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=List(elts=[],ctx=Load()))])');
    });

    it('{}', function () {
        const cst = parse('{}') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Dict(keys=[],values=[]))])');
    });

    it('a', function () {
        const cst = parse('a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Name(id=a,ctx=Load()))])');
    });

    it('+a', function () {
        const cst = parse('+a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=UnaryOp(op=UAdd(),operand=Name(id=a,ctx=Load())))])');
    });

    it('-a', function () {
        const cst = parse('-a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=UnaryOp(op=USub(),operand=Name(id=a,ctx=Load())))])');
    });

    it('~a', function () {
        const cst = parse('~a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=UnaryOp(op=Invert(),operand=Name(id=a,ctx=Load())))])');
    });

    it('a + b', function () {
        const cst = parse('a + b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Add(),right=Name(id=b,ctx=Load())))])');
    });

    it('a - b', function () {
        const cst = parse('a - b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Sub(),right=Name(id=b,ctx=Load())))])');
    });

    it('a * b', function () {
        const cst = parse('a * b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Mult(),right=Name(id=b,ctx=Load())))])');
    });

    it('a / b', function () {
        const cst = parse('a / b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Div(),right=Name(id=b,ctx=Load())))])');
    });

    it('a % b', function () {
        const cst = parse('a % b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Mod(),right=Name(id=b,ctx=Load())))])');
    });

    it('a << b', function () {
        const cst = parse('a << b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=LShift(),right=Name(id=b,ctx=Load())))])');
    });

    it('a >> b', function () {
        const cst = parse('a >> b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=RShift(),right=Name(id=b,ctx=Load())))])');
    });

    it('a ^ b', function () {
        const cst = parse('a ^ b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=BitXor(),right=Name(id=b,ctx=Load())))])');
    });

    it('a & b', function () {
        const cst = parse('a & b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=BitAnd(),right=Name(id=b,ctx=Load())))])');
    });

    it('a | b', function () {
        const cst = parse('a | b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=BitOr(),right=Name(id=b,ctx=Load())))])');
    });

    it('a or b', function () {
        const cst = parse('a or b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BoolOp(op=Or(),values=[Name(id=a,ctx=Load()),Name(id=b,ctx=Load())]))])');
    });

    it('a and b', function () {
        const cst = parse('a and b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BoolOp(op=And(),values=[Name(id=a,ctx=Load()),Name(id=b,ctx=Load())]))])');
    });

    it('a + b * c', function () {
        const cst = parse('a + b * c') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Add(),right=BinOp(left=Name(id=b,ctx=Load()),op=Mult(),right=Name(id=c,ctx=Load()))))])');
    });

    it('a + b ^ c', function () {
        const cst = parse('a + b ^ c') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(left=Name(id=a,ctx=Load()),op=Add(),right=BinOp(left=Name(id=b,ctx=Load()),op=BitXor(),right=Name(id=c,ctx=Load()))))])');
    });

    it('not a', function () {
        const cst = parse('not a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=UnaryOp(op=Not(),operand=Name(id=a,ctx=Load())))])');
    });

    it('def foo():\n pass', function () {
        const cst = parse('def foo():\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[],vararg=None,kwarg=None,defaults=[]),body=[Pass()],decorator_list=[])])');
        /* const st = */ semanticsOfModule(ast);
        // const dumpST = dumpSymbolTable(st);
        // console.log(dumpST);
    });

    it('def foo():\n return a', function () {
        const cst = parse('def foo():\n return a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[],vararg=None,kwarg=None,defaults=[]),body=[ReturnStatement(value=Name(id=a,ctx=Load()))],decorator_list=[])])');
    });

    it('def foo(x):\n pass', function () {
        const cst = parse('def foo(x):\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],decorator_list=[])])');
    });

    it('def foo(x, y):\n pass', function () {
        const cst = parse('def foo(x, y):\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param()),Name(id=y,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],decorator_list=[])])');
    });

    it('if a:\n pass', function () {
        const cst = parse('if a:\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[IfStatement(test=Name(id=a,ctx=Load()),consequent=[Pass()],alternate=[])])');
    });

    it('if a:\n pass\nelse:\n pass', function () {
        const cst = parse('if a:\n pass\nelse:\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[IfStatement(test=Name(id=a,ctx=Load()),consequent=[Pass()],alternate=[Pass()])])');
    });

    it('while a:\n pass', function () {
        const cst = parse('while a:\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[WhileStatement(test=Name(id=a,ctx=Load()),body=[Pass()],orelse=[])])');
    });

    it('ParseError', function () {
        try {
            const cst = parse('print 1s') as PyNode;
            const ast = new Module(astFromParse(cst));
            const dump = astDump(ast);
            console.log(`ParseError??? ${dump}`);
        }
        catch (e) {
            expect(e instanceof SyntaxError).toBe(true);
            expect(e.name).toBe("ParseError");
            // FIXME: Why can't we do instanceof?
            // expect(e instanceof ParseError).toBe(true);
            // console.lg(JSON.stringify(e));
            const message = "Unexpected T_NAME at [1,8]";
            expect(e.message).toBe(message);
            const parseError: ParseError = e;
            //      console.log("expect: " + JSON.stringify(message));
            //      console.log("actual: " + JSON.stringify(e.message));
            expect(parseError.begin.row).toBe(0);
            expect(parseError.begin.column).toBe(7);
            expect(parseError.toString()).toBe(e.name + ": " + message);
        }
    });

    it('IndentationError', function () {
        try {
            const cst = parse('def f():\n    pass\n print') as PyNode;
            const ast = new Module(astFromParse(cst));
            const dump = astDump(ast);
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

    it('SyntaxError from builder', function () {
        try {
            const cst = parse('()=1') as PyNode;
            const ast = new Module(astFromParse(cst));
            const dump = astDump(ast);
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
});
