import { Range } from './Range';

export class RangeMapping {
    public readonly source: Range;
    public readonly target: Range;
    /**
     *
     */
    constructor(source: Range, target: Range) {
        this.source = source;
        this.target = target;
    }
}
