import { assert } from '../pytools/asserts';
var MappingTree = (function () {
    function MappingTree(source, target, children) {
        this.source = source;
        this.target = target;
        this.children = children;
        assert(source, "source must be defined");
        assert(target, "target must be defined");
    }
    MappingTree.prototype.offset = function (rows, cols) {
        if (this.target) {
            this.target.offset(rows, cols);
        }
        if (this.children) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                child.offset(rows, cols);
            }
        }
    };
    return MappingTree;
}());
export { MappingTree };
