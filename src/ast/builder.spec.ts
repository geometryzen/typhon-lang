import { parse, PyNode, cstDump } from '../cst/parser';
import { ParseError } from '../common/syntaxError';
import { astFromParse, astDump } from './builder';
import { semanticsOfModule } from '../sym/symtable';
// import { dumpSymbolTable } from './symtable';
import { Module, FunctionDef, Name } from './types';

describe('AST', function () {

    it('123', function () {
        const cst: boolean | PyNode = parse('123');
        if (typeof cst === 'object') {
            const ast: Module = new Module(astFromParse(cst));
            // console.lg(JSON.stringify(ast, null, 2));
            const dump = astDump(ast);
            expect(dump).toBe('Module(body=[ExpressionStatement(value=Num(n=123))])');
            /* const st = */ semanticsOfModule(ast);
            // const dumpST = dumpSymbolTable(st);
            // console.lg(dumpST);
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
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Add(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a - b', function () {
        const cst = parse('a - b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Sub(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a * b', function () {
        const cst = parse('a * b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Mult(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a / b', function () {
        const cst = parse('a / b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Div(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a % b', function () {
        const cst = parse('a % b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Mod(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a << b', function () {
        const cst = parse('a << b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=LShift(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a >> b', function () {
        const cst = parse('a >> b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=RShift(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a ^ b', function () {
        const cst = parse('a ^ b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=BitXor(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a & b', function () {
        const cst = parse('a & b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=BitAnd(),rhs=Name(id=b,ctx=Load())))])');
    });

    it('a | b', function () {
        const cst = parse('a | b') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=BitOr(),rhs=Name(id=b,ctx=Load())))])');
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
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Add(),rhs=BinOp(lhs=Name(id=b,ctx=Load()),op=Mult(),rhs=Name(id=c,ctx=Load()))))])');
    });

    it('a + b ^ c', function () {
        const cst = parse('a + b ^ c') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=BinOp(lhs=Name(id=a,ctx=Load()),op=Add(),rhs=BinOp(lhs=Name(id=b,ctx=Load()),op=BitXor(),rhs=Name(id=c,ctx=Load()))))])');
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
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[],vararg=None,kwarg=None,defaults=[]),body=[Pass()],returnType=None,decorator_list=[])])');
        /* const st = */ semanticsOfModule(ast);
        // const dumpST = dumpSymbolTable(st);
        // console.lg(dumpST);
    });

    it('def foo():\n return a', function () {
        const cst = parse('def foo():\n return a') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[],vararg=None,kwarg=None,defaults=[]),body=[ReturnStatement(value=Name(id=a,ctx=Load()))],returnType=None,decorator_list=[])])');
    });

    it('def foo(x):\n pass', function () {
        const cst = parse('def foo(x):\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],returnType=None,decorator_list=[])])');
    });

    it('def foo(x) -> GG:\n pass', function () {
        const sourceText = [
            "def foo(x) -> GG:",
            "   pass"
        ].join("\n");
        const cst = parse(sourceText) as PyNode;
        console.log(cstDump(cst));
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        if (ast instanceof Module) {
            const body = ast.body;
            if (body instanceof FunctionDef) {
                const returnType = body.returnType;
                if (returnType instanceof Name) {
                    const id = returnType.id;
                    expect(id.value).toBe("GG");
                }
            }
        }
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],returnType=Name(id=GG,ctx=Load()),decorator_list=[])])');
    });

    it('def foo(x, y):\n pass', function () {
        const cst = parse('def foo(x, y):\n pass') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[FunctionDef(name=foo,args=Arguments(args=[Name(id=x,ctx=Param()),Name(id=y,ctx=Param())],vararg=None,kwarg=None,defaults=[]),body=[Pass()],returnType=None,decorator_list=[])])');
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

    it('a().b()', function () {
        const cst = parse('a().b()') as PyNode;
        const ast = new Module(astFromParse(cst));
        const dump = astDump(ast);
        expect(dump).toBe('Module(body=[ExpressionStatement(value=Call(func=Attribute(value=Call(func=Name(id=a,ctx=Load()),args=[],keywords=[],starargs=None,kwargs=None),attr=b,ctx=Load()),args=[],keywords=[],starargs=None,kwargs=None))])');
    });

    it('ParseError', function () {
        try {
            parse('print 1s');
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
            //      console.lg("expect: " + JSON.stringify(message));
            //      console.lg("actual: " + JSON.stringify(e.message));
            expect(parseError.begin.row).toBe(0);
            expect(parseError.begin.column).toBe(7);
            expect(parseError.toString()).toBe(e.name + ": " + message);
        }
    });

    it('IndentationError', function () {
        try {
            parse('def f():\n    pass\n print');
        }
        catch (e) {
            expect(e.name).toBe('IndentationError');
            const message = 'unindent does not match any outer indentation level';
            expect(e.message).toBe(message);
            //      console.lg("expect: " + JSON.stringify(message));
            //      console.lg("actual: " + JSON.stringify(e.message));
            expect(e.lineNumber).toBe(3);
            expect(e.columnNumber).toBe(0);
            expect(e.toString()).toBe(e.name + ": " + message);
        }
    });

    it('SyntaxError from builder', function () {
        try {
            parse('()=1');
        }
        catch (e) {
            expect(e.name).toBe('SyntaxError');
            const message = "can't assign to ()";
            expect(e.message).toBe(message);
            //      console.lg("expect: " + JSON.stringify(message));
            //      console.lg("actual: " + JSON.stringify(e.message));
            expect(e.lineNumber).toBe(1);
            expect(e.columnNumber).toBe(undefined);
            expect(e.toString()).toBe(e.name + ": " + message);
        }
    });
});
