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

        describe('ImportFrom', function() {
            it('everything from a module', function() {
                var result = tsCompiler.compile('from visual import *', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.code).toBe("import * from 'visual';");
                expect(result.funcname).toBe('$scope0');
            });
        });
    });
});
