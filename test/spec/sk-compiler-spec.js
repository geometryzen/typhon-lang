/**
 *
 */
define(['pytools'], function(m) {

    const pytools = m.default;

    var fileName = '<stdin>';

    describe('skCompiler', function() {

        it('should be available', function() {
            expect(typeof pytools.skCompiler.compile).toBe('function');
            expect(typeof pytools.skCompiler.resetCompiler).toBe('function');
        });

        describe('compile', function() {

            it('should be $scope0', function() {
                var result = pytools.skCompiler.compile('123', fileName);
                expect(typeof result).toBe('object');
                expect(typeof result.code).toBe('string');
            });

        });

    });

});
