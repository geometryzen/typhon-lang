/**
 * @param {string} source the code
 * @param {string} fileName where it came from
 *
 * @return {{funcname: string, code: string}}
 */
export declare function compile(sourceText: string, fileName: string): {
    'funcname': string;
    'code': string;
};
export declare function resetCompiler(): void;
