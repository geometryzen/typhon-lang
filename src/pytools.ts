import {parse, parseTreeDump} from './pytools/parser';
import {astFromParse, astDump} from './pytools/builder';
import {compile as skCompile, resetCompiler as skReset} from './py-to-sk/sk-compiler';
import {compile as tsCompile, resetCompiler as tsReset} from './py-to-es/transpiler';
import {parse as msParse, transpile as msTranspile} from './mstools/mathscript';
import {add as msAdd, sub as msSub, mul as msMul, div as msDiv} from './mstools/mathscript';
import {eq as msEq, ne as msNe, neg as msNeg, pos as msPos, tilde as msTilde} from './mstools/mathscript';

const pytools = {
    parser: { parse, parseTreeDump },
    builder: { astFromParse, astDump },
    skCompiler: { compile: skCompile, resetCompiler: skReset },
    tsCompiler: { compile: tsCompile, resetCompiler: tsReset },
    MathScript: {
        parse: msParse,
        transpile: msTranspile,
        add: msAdd,
        sub: msSub,
        mul: msMul,
        div: msDiv,
        eq: msEq,
        ne: msNe,
        neg: msNeg,
        pos: msPos,
        tilde: msTilde
    }
};
export default pytools;
