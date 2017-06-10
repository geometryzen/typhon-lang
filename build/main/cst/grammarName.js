"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tables_1 = require("./tables");
var tokenNames_1 = require("./tokenNames");
function grammarName(type) {
    var tokenName = tokenNames_1.tokenNames[type];
    if (tokenName) {
        return tokenName;
    }
    else {
        return tables_1.ParseTables.number2symbol[type];
    }
}
exports.grammarName = grammarName;
