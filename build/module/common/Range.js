import { assert } from './asserts';
var Range = (function () {
    /**
     *
     */
    function Range(begin, end) {
        assert(begin, "begin must be defined");
        assert(end, "end must be defined");
        this.begin = begin;
        this.end = end;
    }
    Range.prototype.toString = function () {
        return this.begin + " to " + this.end;
    };
    return Range;
}());
export { Range };
