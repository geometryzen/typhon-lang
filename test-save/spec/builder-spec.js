define(['pytools/builder'], function(mod) {
    describe('builder', function() {
        it('should be available', function() {
            expect(typeof mod.astFromParse).toBe('function');
            expect(typeof mod.astDump).toBe('function');
        });
    });
});
