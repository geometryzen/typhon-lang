define(['pytools/parser'], function(mod) {
    describe('parser', function() {
        it('should be available', function() {
            expect(typeof mod.parse).toBe('function');
            expect(typeof mod.parseTreeDump).toBe('function');
        });
    });
});
