"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(a, b) {
    for (var kb in b) {
        if (b.hasOwnProperty(kb)) {
            a[kb] = b[kb];
        }
    }
}
exports.default = default_1;
