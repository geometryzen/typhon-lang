import { Range } from './Range';
import { MutableRange } from './MutableRange';
export declare class MutableMapping {
    readonly source: Range;
    target: MutableRange;
    /**
     *
     */
    constructor(source: Range, target: MutableRange);
}
