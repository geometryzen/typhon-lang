define(["require", "exports"], function (require, exports) {
    "use strict";
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
