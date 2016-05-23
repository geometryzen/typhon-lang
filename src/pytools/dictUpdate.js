define(["require", "exports"], function (require, exports) {
    "use strict";
    function default_1(a, b) {
        for (var kb in b) {
            if (b.hasOwnProperty(kb)) {
                a[kb] = b[kb];
            }
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
});
