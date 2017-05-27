import { transpileModule as compile } from './transpiler';

const fileName = 'foo.ts';

describe('transpiler', function () {

    it('should be available', function () {
        expect(typeof compile).toBe('function');
    });

    describe('NumericLiteral', function () {
        it('Float', function () {
            const result = compile('0.01', fileName);
            expect(result.code).toBe("0.01");
        });
    });

    describe('StringLiteral', function () {
        it('with double quotes', function () {
            const result = compile('"Hello"', fileName);
            expect(result.code).toBe("'Hello'");
        });
    });

    describe('BooleanLiteral', function () {
        it('True should be converted', function () {
            const result = compile('True', fileName);
            expect(result.code).toBe("true");
        });
        it('False should be converted', function () {
            const result = compile('False', fileName);
            expect(result.code).toBe("false");
        });
    });

    describe('Assign', function () {
        it('should provide a declaration', function () {
            const result = compile('x = 0.01', fileName);
            expect(result.code).toBe("const x=0.01;");
        });
        it('should provide a declaration', function () {
            const sourceText = "the_world_is_flat = True";
            const result = compile(sourceText, fileName);
            expect(result.code).toBe("const the_world_is_flat=true;");
        });
    });

    xdescribe('ImportFrom', function () {
        it('everything from a module', function () {
            const result = compile('from visual import *', fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("import * from 'visual';");
        });
    });

    describe('Assign', function () {
        it('Integer', function () {
            const result = compile('x = 1', fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("const x=1;");
        });
    });

    describe('Assign', function () {
        it('String', function () {
            const result = compile("name = 'David'", fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("const name='David';");
        });
    });

    describe('FunctionCall', function () {
        it('should work with no arguments', function () {
            const result = compile('f()', fileName);
            expect(result.code).toBe("f()");
        });
        it('should work with 1 argument', function () {
            const result = compile('f(1)', fileName);
            expect(result.code).toBe("f(1)");
        });
        it('should work with 2 arguments', function () {
            const result = compile('f(1,2)', fileName);
            expect(result.code).toBe("f(1,2)");
        });
    });

    describe('IfStatement', function () {
        it('TODO', function () {
            const sourceText = "if the_world_is_flat:\n    print('Be careful not to fall off!')";
            const result = compile(sourceText, fileName);
            expect(result.code).toBe("if(the_world_is_flat){console.log('Be careful not to fall off!')}");
        });
        xit('TODO', function () {
            const result = compile('x = 7\nif x < 1:\n  x = 3', fileName);
            expect(result.code).toBe("if(x<1){x=3;}");
        });
    });

    describe('Print', function () {
        it('should provide a declaration', function () {
            const result = compile('print("Hello, World!")', fileName);
            expect(result.code).toBe("console.log('Hello, World!')");
        });
    });

});
