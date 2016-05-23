define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * We're looking for something that is truthy, not just true.
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    exports.assert = assert;
    function fail(message) {
        assert(false, message);
    }
    exports.fail = fail;
});
