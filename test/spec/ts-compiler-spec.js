/**
 *
 */
define(['pytools'], function(m) {

    const pytools = m.default;
    const tsCompiler = pytools.tsCompiler;

    var fileName = '<stdin>';

    describe('tsCompiler', function() {

        it('should be available', function() {
            expect(typeof tsCompiler.compile).toBe('function');
            expect(typeof tsCompiler.resetCompiler).toBe('function');
        });

        xdescribe('ImportFrom', function() {
            it('everything from a module', function() {
                var result = tsCompiler.compile('from visual import *', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.code).toBe("import * from 'visual';");
            });
        });

        xdescribe('Assign', function() {
            it('Float', function() {
                var result = tsCompiler.compile('x = 0.01', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.code).toBe("x = 0.01;");
            });
        });

        xdescribe('Assign', function() {
            it('Integer', function() {
                var result = tsCompiler.compile('x = 1', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.code).toBe("x = 1;");
            });
        });

        xdescribe('Assign', function() {
            it('String', function() {
                var result = tsCompiler.compile("name = 'David'", fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.code).toBe("name = 'David';");
            });
        });

        xdescribe('Num', function() {
            it('Float', function() {
                var result = tsCompiler.compile('0.01', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.code).toBe("0.01");
            });
        });

        xdescribe('FunctionCall', function() {
            it('TODO', function() {
                const result = tsCompiler.compile('rate(100)', fileName);
                expect(result.code).toBe("rate(100)");
            });
        });

        xdescribe('IfStatement', function() {
            it('TODO', function() {
                const result = tsCompiler.compile('if x < 1:\n  x = 3', fileName);
                expect(result.code).toBe("if (x < 1) { x = 3 }");
            });
        });

    });
});
