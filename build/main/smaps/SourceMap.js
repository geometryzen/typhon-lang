"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var btree_1 = require("../btree/btree");
var Position_1 = require("../pytools/Position");
var Range_1 = require("../pytools/Range");
function rangeComparator(a, b) {
    return 0;
}
var SourceMap = (function () {
    function SourceMap() {
        this.sourceToTarget = new btree_1.Tree(rangeComparator);
        this.targetToSource = new btree_1.Tree(rangeComparator);
        // Do nothing yet.
    }
    SourceMap.prototype.getTargetPosition = function (sourcePos) {
        var sourceRange = new Range_1.Range(sourcePos, new Position_1.Position(sourcePos.line, sourcePos.column + 1));
        var targetRange = this.sourceToTarget.get(sourceRange);
        // TODO: Interpolate.
        return sourcePos = targetRange.begin;
    };
    SourceMap.prototype.put = function (source, target) {
        this.sourceToTarget.put(source, target);
        this.targetToSource.put(target, source);
    };
    return SourceMap;
}());
exports.SourceMap = SourceMap;
