/**
 *
 */
define(['pytools'], function(mod) {

    var fileName = '<stdin>';

    describe('skCompiler', function() {

        it('should be available', function() {
            expect(typeof mod.skCompiler.compile).toBe('function');
            expect(typeof mod.skCompiler.resetCompiler).toBe('function');
        });

        describe('compile', function() {

            it('should be $scope0', function() {
                var result = mod.skCompiler.compile('123', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
                expect(result.funcname).toBe('$scope0');
            });

        });

    });

});
