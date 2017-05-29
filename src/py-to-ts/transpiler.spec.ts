import { transpileModule as compile } from './transpiler';
// import { parseTreeDump } from '../pytools/parser';
// import { dumpSymbolTable } from '../pytools/symtable';

describe('transpiler', function () {

    it('should be available', function () {
        expect(typeof compile).toBe('function');
    });

    describe('NumericLiteral', function () {
        it('Float', function () {
            const result = compile('0.01');
            expect(result.code).toBe("0.01");
        });
    });

    describe('STRING', function () {
        it('with double quotes', function () {
            const result = compile('"Hello"');
            expect(result.code).toBe("'Hello'");
        });
    });

    describe('BooleanLiteral', function () {
        it('True should be converted', function () {
            const result = compile('True');
            expect(result.code).toBe("true");
        });
        it('False should be converted', function () {
            const result = compile('False');
            expect(result.code).toBe("false");
        });
    });

    describe('Assign', function () {
        it('should provide a declaration', function () {
            const result = compile('x = 0.01');
            expect(result.code).toBe("let x=0.01;");
        });
        it('should provide a declaration', function () {
            const sourceText = "the_world_is_flat = True";
            const result = compile(sourceText);
            expect(result.code).toBe("let the_world_is_flat=true;");
        });
    });

    xdescribe('ImportFrom', function () {
        it('everything from a module', function () {
            const result = compile('from visual import *');
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("import * from 'visual';");
        });
    });

    describe('Assign', function () {
        it('Integer', function () {
            const result = compile('x = 1');
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("let x=1;");
        });
    });

    describe('Assign', function () {
        it('String', function () {
            const result = compile("name = 'David'");
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("let name='David';");
        });
    });

    describe('Attribute', function () {
        it('should allow access to child attributes', function () {
            const result = compile('box = Box(engine, {color: Color.blue})');
            expect(result.code).toBe("let box=new Box(engine,{color:Color.blue});");
        });
    });

    describe('BinOp', function () {
        it('Add', function () {
            const result = compile("a + b");
            expect(result.code).toBe("a+b");
        });
        it('Sub', function () {
            const result = compile("a - b");
            expect(result.code).toBe("a-b");
        });
        it('Mult', function () {
            const result = compile("a * b");
            expect(result.code).toBe("a*b");
        });
        it('Div', function () {
            const result = compile("a / b");
            expect(result.code).toBe("a/b");
        });
        it('BitOr', function () {
            const result = compile("a | b");
            expect(result.code).toBe("a|b");
        });
        it('BitXor', function () {
            const result = compile("a ^ b");
            expect(result.code).toBe("a^b");
        });
        it('BitAnd', function () {
            const result = compile("a & b");
            expect(result.code).toBe("a&b");
        });
        it('LShift', function () {
            const result = compile("a << b");
            expect(result.code).toBe("a<<b");
        });
        it('RShift', function () {
            const result = compile("a >> b");
            expect(result.code).toBe("a>>b");
        });
        it('Mod', function () {
            const result = compile("a % b");
            expect(result.code).toBe("a%b");
        });
        it('FloorDiv', function () {
            const result = compile("a // b");
            expect(result.code).toBe("a//b");
        });
    });

    describe('Compare', function () {
        it('Eq', function () {
            const result = compile("a == b");
            expect(result.code).toBe("a===b");
        });
        it('NotEq', function () {
            const result = compile("a != b");
            expect(result.code).toBe("a!==b");
        });
        it('Lt', function () {
            const result = compile("a < b");
            expect(result.code).toBe("a<b");
        });
        it('LtE', function () {
            const result = compile("a <= b");
            expect(result.code).toBe("a<=b");
        });
        it('Gt', function () {
            const result = compile("a > b");
            expect(result.code).toBe("a>b");
        });
        it('GtE', function () {
            const result = compile("a >= b");
            expect(result.code).toBe("a>=b");
        });
        it('Is', function () {
            const result = compile("a is b");
            expect(result.code).toBe("a===b");
        });
        it('IsNot', function () {
            const result = compile("a is not b");
            expect(result.code).toBe("a!==b");
        });
        it('In', function () {
            const result = compile("a in b");
            expect(result.code).toBe("a in b");
        });
        it('NotIn', function () {
            const result = compile("a not in b");
            expect(result.code).toBe("a not in b");
        });
        it('FloorDiv', function () {
            const result = compile("a // b");
            expect(result.code).toBe("a//b");
        });
    });

    describe('Call', function () {
        it('should work with no arguments', function () {
            const result = compile('f()');
            expect(result.code).toBe("f()");
        });
        it('should work with 1 argument', function () {
            const result = compile('f(1)');
            expect(result.code).toBe("f(1)");
        });
        it('should work with 2 arguments', function () {
            const result = compile('f(1,2)');
            expect(result.code).toBe("f(1,2)");
        });
        it('should assume Upper case function name is a constructor function', function () {
            const result = compile('Engine()');
            expect(result.code).toBe("new Engine()");
        });
    });

    describe('ClassDef', function () {
        it('should make the self parameter implicit in the method', function () {
            const sourceText = [
                "class MyClass:",
                "    def f(self, name):",
                "        return 'Hello' + name"
            ].join("\n");
            const result = compile(sourceText);
            /*
            const resultText = [
                "class MyClass {",
                "    f(name) {",
                "        return 'Hello' + name;",
                "    }",
                "}"
            ].join("\n");
            */
            // console.log(dumpSymbolTable(result.symbolTable));
            expect(result.code).toBe("class MyClass{f(name){return 'Hello'+name;}}");
        });
    });

    describe('Dict', function () {
        it('should allow the empty dictionary', function () {
            const result = compile('{}');
            expect(result.code).toBe("{}");
        });
        it('should allow a dictionary of many items', function () {
            const result = compile("{'a': 1, 'b': 23, 'c': 'eggs'}");
            expect(result.code).toBe("{'a':1,'b':23,'c':'eggs'}");
        });
    });

    describe('FunctionDef', function () {
        it('should work with no arguments', function () {
            const sourceText = [
                "def greeting(name):",
                "    return 'Hello' + name"
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("function greeting(name){return 'Hello'+name;}");
        });
    });

    describe('IfStatement', function () {
        it('should basically work', function () {
            const sourceText = "if the_world_is_flat:\n    print('Be careful not to fall off!')";
            const result = compile(sourceText);
            expect(result.code).toBe("if(the_world_is_flat){console.log('Be careful not to fall off!')}");
        });
        it('should work with assignments', function () {
            const result = compile('x = 7\nx=4\nif x < 1:\n  x = 3');
            expect(result.code).toBe("let x=7;x=4;if(x<1){x=3;}");
        });
    });

    describe('ImportFrom', function () {
        it('Experiment', function () {
            const sourceText = [
                "from eight import Engine",
                ""
            ].join("\n");
            try {
                compile(sourceText);
                fail(`ECMAScript 2015 modules require the ModuleSpecifier to be a STRING.`);
            }
            catch (e) {
                expect(`${e}`).toBe("ParseError: Unexpected T_NAME at [1,5]");
            }
        });
        it('should allow a single named import', function () {
            const sourceText = [
                "from 'eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            // console.log(parseTreeDump(result.cst));
            expect(result.code).toBe("import {Engine} from 'eight';");
        });
        it('should allow a multiple named imports', function () {
            const sourceText = [
                "from 'eight' import Engine, Scene",
                ""
            ].join("\n");
            const result = compile(sourceText);
            // console.log(parseTreeDump(result.cst));
            expect(result.code).toBe("import {Engine,Scene} from 'eight';");
        });
        it('should allow a single alias named import', function () {
            const sourceText = [
                "from 'eight' import Engine as Context",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine as Context} from 'eight';");
        });
        it('should allow a multiple alias named imports', function () {
            const sourceText = [
                "from 'eight' import Engine as Context, Scene as Model",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine as Context,Scene as Model} from 'eight';");
        });
        it('should allow hyphens in module name', function () {
            const sourceText = [
                "from 'davinci-eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine} from 'davinci-eight';");
        });
        it('should allow slashes in module name', function () {
            const sourceText = [
                "from 'davinci/eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine} from 'davinci/eight';");
        });
        it('should allow commercial @ module name', function () {
            const sourceText = [
                "from '@eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine} from '@eight';");
        });
    });

    describe('List', function () {
        it('should allow the empty list', function () {
            const result = compile('[]');
            expect(result.code).toBe("[]");
        });
        it('should allow the singleton list', function () {
            const result = compile('[1]');
            expect(result.code).toBe("[1]");
        });
        it('should allow a list of many items', function () {
            const result = compile('[1, 2, 3, 4, 5]');
            expect(result.code).toBe("[1,2,3,4,5]");
        });
    });

    describe('Print', function () {
        it('should provide a declaration', function () {
            const result = compile('print("Hello, World!")');
            expect(result.code).toBe("console.log('Hello, World!')");
        });
    });

    describe('Comments', function () {
        it('should allow single line comments', function () {
            const result = compile('# This is a single-line comment.');
            expect(result.code).toBe("");
        });
        xit('should allow multi-line comments', function () {
            const sourceText = [
                "'''",
                " This is a multi-line comment.",
                "'''"
            ].join("\n");
            const result = compile(sourceText);
            const resultText = [
                "/**",
                " * This is a multi-line comment.",
                " *\/"
            ].join("\n");
            expect(result.code).toBe(resultText);
        });
    });

    // Trying out things. Break down into simpler tests.
    describe('Misc', function () {
        it('...', function () {
            const sourceText = "a = b.c(t)";
            const result = compile(sourceText);
            expect(result.code).toBe("let a=b.c(t);");
        });
    });
});
