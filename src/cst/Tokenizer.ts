import { assert } from '../common/asserts';
import { TokenError } from '../common/TokenError';
import { Tokens } from './Tokens';

// Cache a few tokens for performance.
const T_COMMENT = Tokens.T_COMMENT;
const T_DEDENT = Tokens.T_DEDENT;
const T_ENDMARKER = Tokens.T_ENDMARKER;
const T_ERRORTOKEN = Tokens.T_ERRORTOKEN;
const T_INDENT = Tokens.T_INDENT;
const T_NAME = Tokens.T_NAME;
const T_NEWLINE = Tokens.T_NEWLINE;
const T_NL = Tokens.T_NL;
const T_NUMBER = Tokens.T_NUMBER;
const T_OP = Tokens.T_OP;
const T_STRING = Tokens.T_STRING;

/* we have to use string and ctor to be able to build patterns up. + on /.../
    * does something strange. */
// const Whitespace = "[ \\f\\t]*";
const Comment_ = "#[^\\r\\n]*";
const MultiComment_ = "'{3}[^]*'{3}";
const Ident = "[a-zA-Z_]\\w*";

const Binnumber = '0[bB][01]*';
const Hexnumber = '0[xX][\\da-fA-F]*[lL]?';
const Octnumber = '0[oO]?[0-7]*[lL]?';
const Decnumber = '[1-9]\\d*[lL]?';
const Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);

const Exponent = "[eE][-+]?\\d+";
const Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
const Expfloat = '\\d+' + Exponent;
const Floatnumber = group(Pointfloat, Expfloat);
const Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
const Number_ = group(Imagnumber, Floatnumber, Intnumber);

// tail end of ' string
const Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// tail end of " string
const Double_ = '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// tail end of ''' string
const Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// tail end of """ string
const Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
const Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
// const String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'", '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Because of leftmost-then-longest match semantics, be sure to put the
// longest operators first (e.g., if = came before ==, == would get
// recognized as two instances of =).
const Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=",
    "//=?", "->",
    "[+\\-*/%&|^=<>]=?",
    "~");

const Bracket = '[\\][(){}]';
const Special = group('\\r?\\n', '[:;.,`@]');
const Funny = group(Operator, Bracket, Special);

const ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
    group("'", '\\\\\\r?\\n'),
    '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
    group('"', '\\\\\\r?\\n'));
const PseudoExtras = group('\\\\\\r?\\n', Comment_, Triple, MultiComment_);
// Need to prefix with "^" as we only want to match what's next
const PseudoToken = "^" + group(PseudoExtras, Number_, Funny, ContStr, Ident);

const pseudoprog = new RegExp(PseudoToken);
const single3prog = new RegExp(Single3, "g");
const double3prog = new RegExp(Double3, "g");

const endprogs: { [code: string]: RegExp | null } = {
    "'": new RegExp(Single, "g"), '"': new RegExp(Double_, "g"),
    "'''": single3prog, '"""': double3prog,
    "r'''": single3prog, 'r"""': double3prog,
    "u'''": single3prog, 'u"""': double3prog,
    "b'''": single3prog, 'b"""': double3prog,
    "ur'''": single3prog, 'ur"""': double3prog,
    "br'''": single3prog, 'br"""': double3prog,
    "R'''": single3prog, 'R"""': double3prog,
    "U'''": single3prog, 'U"""': double3prog,
    "B'''": single3prog, 'B"""': double3prog,
    "uR'''": single3prog, 'uR"""': double3prog,
    "Ur'''": single3prog, 'Ur"""': double3prog,
    "UR'''": single3prog, 'UR"""': double3prog,
    "bR'''": single3prog, 'bR"""': double3prog,
    "Br'''": single3prog, 'Br"""': double3prog,
    "BR'''": single3prog, 'BR"""': double3prog,
    'r': null, 'R': null,
    'u': null, 'U': null,
    'b': null, 'B': null
};

const triple_quoted = {
    "'''": true, '"""': true,
    "r'''": true, 'r"""': true, "R'''": true, 'R"""': true,
    "u'''": true, 'u"""': true, "U'''": true, 'U"""': true,
    "b'''": true, 'b"""': true, "B'''": true, 'B"""': true,
    "ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
    "uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
    "br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
    "bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
};

const single_quoted = {
    "'": true, '"': true,
    "r'": true, 'r"': true, "R'": true, 'R"': true,
    "u'": true, 'u"': true, "U'": true, 'U"': true,
    "b'": true, 'b"': true, "B'": true, 'B"': true,
    "ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
    "uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
    "br'": true, 'br"': true, "Br'": true, 'Br"': true,
    "bR'": true, 'bR"': true, "BR'": true, 'BR"': true
};

const tabsize = 8;

const NAMECHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const NUMCHARS = '0123456789';

/**
 * The index of the line in the LineColumn array.
 */
const LINE = 0;
/**
 * The index of the column in the LineColumn array.
 */
const COLUMN = 1;
/**
 * The first element is the line number.
 * The line number is 1-based. This is intuitive because it maps to the way we think about line numbers.
 * The second element is the column.
 * The column is 0-based. This works well because it is the standard index for accessing strings.
 */
export type LineColumn = [line: number, column: number];

/**
 * The function called by the tokenizer for each token in a line.
 * If the callback returns `true`, the tokenizer declares that it is 'done' with that line.
 */
export type TokenizerCallback = (token: Tokens, text: string, start: number[], end: number[], line: string) => boolean | undefined;

export type DoneOrFailed = 'done' | 'failed';
export const Done = 'done';
export const Failed = 'failed';

/**
 * This is a port of tokenize.py by Ka-Ping Yee.
 *
 * each call to readline should return one line of input as a string, or
 * undefined if it's finished.
 *
 * callback is called for each token with 5 args:
 * 1. the token type
 * 2. the token string
 * 3. [ start_row, start_col ]
 * 4. [ end_row, end_col ]
 * 5. logical line where the token was found, including continuation lines
 *
 * callback can return true to abort.
 */
export class Tokenizer {
    /**
     * Cache of the beginning of a token.
     * This will change by token so consumers must copy the values out.
     */
    private readonly begin: LineColumn = [-1, -1];
    /**
     * Cache of the end of a token.
     * This will change by token so consumers must copy the values out.
     */
    private readonly end: LineColumn = [-1, -1];
    /**
     * The line number. This must be copied into the begin[LINE] and end[LINE] properties.
     */
    private lnum = 0;
    private parenlev = 0;
    private continued: boolean;
    private contstr: string;
    private needcont: boolean;
    private contline: string | undefined;
    private readonly indents: number[];
    private endprog: RegExp;
    private readonly strstart: LineColumn = [-1, -1];
    /**
     * Probably used for REPL support.
     */
    interactive: boolean;
    private readonly doneFunc: () => DoneOrFailed;

    /**
     *
     */
    constructor(interactive: boolean, private readonly callback: TokenizerCallback) {
        this.callback = callback;
        this.continued = false;
        this.contstr = '';
        this.needcont = false;
        this.contline = undefined;
        this.indents = [0];
        this.endprog = /.*/;
        this.interactive = interactive;
        this.doneFunc = function doneOrFailed(): DoneOrFailed {
            const begin = this.begin;
            const end = this.end;
            begin[LINE] = end[LINE] = this.lnum;
            begin[COLUMN] = end[COLUMN] = 0;
            const N = this.indents.length;
            for (let i = 1; i < N; ++i) {
                if (callback(T_DEDENT, '', begin, end, '')) {
                    return Done;
                }
            }
            if (callback(T_ENDMARKER, '', begin, end, '')) {
                return Done;
            }
            return Failed;
        };
    }

    /**
     * @param line
     * @return 'done' or 'failed' or true?
     */
    generateTokens(line: string): boolean | DoneOrFailed/**/ {
        let endmatch: boolean;
        let column: number;
        let endIndex: number;

        if (!line) {
            line = '';
        }

        this.lnum += 1;
        let pos = 0;
        let max = line.length;

        /**
         * Local variable for performance and brevity.
         */
        const callback = this.callback;
        const begin = this.begin;
        begin[LINE] = this.lnum;
        const end = this.end;
        end[LINE] = this.lnum;

        if (this.contstr.length > 0) {
            if (!line) {
                throw new TokenError("EOF in multi-line string", this.strstart[LINE], this.strstart[COLUMN]);
            }
            this.endprog.lastIndex = 0;
            endmatch = this.endprog.test(line);
            if (endmatch) {
                pos = endIndex = this.endprog.lastIndex;
                end[COLUMN] = endIndex;
                if (callback(T_STRING, this.contstr + line.substring(0, endIndex), this.strstart, end, this.contline + line)) {
                    return Done;
                }
                this.contstr = '';
                this.needcont = false;
                this.contline = undefined;
            }
            else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
                // Either contline is a string or the callback must allow undefined.
                assert(typeof this.contline === 'string');
                end[COLUMN] = line.length;
                if (callback(T_ERRORTOKEN, this.contstr + line, this.strstart, end, this.contline as string)) {
                    return Done;
                }
                this.contstr = '';
                this.contline = undefined;
                return false;
            }
            else {
                this.contstr += line;
                this.contline = this.contline + line;
                return false;
            }
        }
        else if (this.parenlev === 0 && !this.continued) {
            if (!line) return this.doneFunc();
            column = 0;
            while (pos < max) {
                const ch = line.charAt(pos);
                if (ch === ' ') {
                    column += 1;
                }
                else if (ch === '\t') {
                    column = (column / tabsize + 1) * tabsize;
                }
                else if (ch === '\f') {
                    column = 0;
                }
                else {
                    break;
                }
                pos = pos + 1;
            }
            if (pos === max) return this.doneFunc();

            if ("#\r\n".indexOf(line.charAt(pos)) !== -1) {
                if (line.charAt(pos) === '#') {
                    const comment_token = rstrip(line.substring(pos), '\r\n');
                    const nl_pos = pos + comment_token.length;
                    begin[COLUMN] = pos;
                    end[COLUMN] = nl_pos;
                    if (callback(T_COMMENT, comment_token, begin, end, line)) {
                        return Done;
                    }
                    begin[COLUMN] = nl_pos;
                    end[COLUMN] = line.length;
                    if (callback(T_NL, line.substring(nl_pos), begin, end, line)) {
                        return Done;
                    }
                    return false;
                }
                else {
                    begin[COLUMN] = pos;
                    end[COLUMN] = line.length;
                    if (callback(T_NL, line.substring(pos), begin, end, line)) {
                        return Done;
                    }
                    if (!this.interactive) return false;
                }
            }

            if ("'''".indexOf(line.charAt(pos)) !== -1) {
                if (line.charAt(pos) === "'") {
                    const comment_token = line.substring(pos);
                    const nl_pos = pos + comment_token.length;
                    begin[COLUMN] = pos;
                    end[COLUMN] = nl_pos;
                    if (callback(T_COMMENT, comment_token, begin, end, line)) {
                        return Done;
                    }
                    begin[COLUMN] = nl_pos;
                    end[COLUMN] = line.length;
                    if (callback(T_NL, line.substring(nl_pos), begin, end, line)) {
                        return Done;
                    }
                    return false;
                }
                else {
                    begin[COLUMN] = pos;
                    end[COLUMN] = line.length;
                    if (callback(T_NL, line.substring(pos), begin, end, line)) {
                        return Done;
                    }
                    if (!this.interactive) return false;
                }
            }

            if (column > this.indents[this.indents.length - 1]) {
                this.indents.push(column);
                begin[COLUMN] = 0;
                end[COLUMN] = pos;
                if (callback(T_INDENT, line.substring(0, pos), begin, end, line)) {
                    return Done;
                }
            }
            while (column < this.indents[this.indents.length - 1]) {
                if (!contains(this.indents, column)) {
                    begin[COLUMN] = 0;
                    end[COLUMN] = pos;
                    throw indentationError("unindent does not match any outer indentation level", begin, end, line);
                }
                this.indents.splice(this.indents.length - 1, 1);
                begin[COLUMN] = pos;
                end[COLUMN] = pos;
                if (callback(T_DEDENT, '', begin, end, line)) {
                    return Done;
                }
            }
        }
        else {
            if (!line) {
                throw new TokenError("EOF in multi-line statement", this.lnum, 0);
            }
            this.continued = false;
        }

        while (pos < max) {
            // js regexes don't return any info about matches, other than the
            // content. we'd like to put a \w+ before pseudomatch, but then we
            // can't get any data
            let capos = line.charAt(pos);
            while (capos === ' ' || capos === '\f' || capos === '\t') {
                pos += 1;
                capos = line.charAt(pos);
            }
            pseudoprog.lastIndex = 0;
            const pseudomatch = pseudoprog.exec(line.substring(pos));
            if (pseudomatch) {
                const startIndex = pos;
                endIndex = startIndex + pseudomatch[1].length;
                begin[COLUMN] = startIndex;
                end[COLUMN] = endIndex;
                pos = endIndex;
                const token = line.substring(startIndex, endIndex);
                const initial = line.charAt(startIndex);
                if (NUMCHARS.indexOf(initial) !== -1 || (initial === '.' && token !== '.')) {
                    if (callback(T_NUMBER, token, begin, end, line)) {
                        return Done;
                    }
                }
                else if (initial === '\r' || initial === '\n') {
                    let newl = T_NEWLINE;
                    if (this.parenlev > 0) newl = T_NL;
                    if (callback(newl, token, begin, end, line)) {
                        return Done;
                    }
                }
                else if (initial === '#' || initial === "'''") {
                    if (callback(T_COMMENT, token, begin, end, line)) {
                        return Done;
                    }
                }
                else if (triple_quoted.hasOwnProperty(token)) {
                    this.endprog = endprogs[token] as RegExp;
                    this.endprog.lastIndex = 0;
                    endmatch = this.endprog.test(line.substring(pos));
                    if (endmatch) {
                        pos = this.endprog.lastIndex + pos;
                        const token = line.substring(startIndex, pos);
                        end[COLUMN] = pos;
                        if (callback(T_STRING, token, begin, end, line)) {
                            return Done;
                        }
                    }
                    else {
                        this.strstart[LINE] = this.lnum;
                        this.strstart[COLUMN] = startIndex;
                        this.contstr = line.substring(startIndex);
                        this.contline = line;
                        return false;
                    }
                }
                else if (single_quoted.hasOwnProperty(initial) ||
                    single_quoted.hasOwnProperty(token.substring(0, 2)) ||
                    single_quoted.hasOwnProperty(token.substring(0, 3))) {
                    if (token[token.length - 1] === '\n') {
                        this.endprog = endprogs[initial] as RegExp || endprogs[token[1]] || endprogs[token[2]];
                        assert(this.endprog instanceof RegExp);
                        this.contstr = line.substring(startIndex);
                        this.needcont = true;
                        this.contline = line;
                        return false;
                    }
                    else {
                        if (callback(T_STRING, token, begin, end, line)) {
                            return Done;
                        }
                    }
                }
                else if (NAMECHARS.indexOf(initial) !== -1) {
                    if (callback(T_NAME, token, begin, end, line)) {
                        return Done;
                    }
                }
                else if (initial === '\\') {
                    end[COLUMN] = pos;
                    if (callback(T_NL, token, begin, end, line)) {
                        return Done;
                    }
                    this.continued = true;
                }
                else {
                    if ('([{'.indexOf(initial) !== -1) {
                        this.parenlev += 1;
                    }
                    else if (')]}'.indexOf(initial) !== -1) {
                        this.parenlev -= 1;
                    }
                    if (callback(T_OP, token, begin, end, line)) {
                        return Done;
                    }
                }
            }
            else {
                begin[COLUMN] = pos;
                end[COLUMN] = pos + 1;
                if (callback(T_ERRORTOKEN, line.charAt(pos), begin, end, line)) {
                    return Done;
                }
                pos += 1;
            }
        }
        return false;
    }
}

function group(x: string, arg1?: string, arg2?: string, arg3?: string, arg4?: string, arg5?: string, arg6?: string, arg7?: string, arg8?: string, arg9?: string) {
    const args = Array.prototype.slice.call(arguments);
    return '(' + args.join('|') + ')';
}

function maybe(x: string) { return group.apply(null, arguments) + "?"; }

function contains<T>(a: T[], obj: T): boolean {
    let i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function rstrip(input: string, what: string): string {
    let i: number;
    for (i = input.length; i > 0; --i) {
        if (what.indexOf(input.charAt(i - 1)) === -1) break;
    }
    return input.substring(0, i);
}

/**
 * @param message
 * @param begin
 * @param end
 * @param {string|undefined} text
 */
function indentationError(message: string, begin: number[], end: number[], text: string) {

    assert(Array.isArray(begin), "begin must be an Array");
    assert(Array.isArray(end), "end must be an Array");

    const e = new SyntaxError(message/*, fileName*/);
    e.name = "IndentationError";
    if (begin) {
        e['lineNumber'] = begin[LINE];
        e['columnNumber'] = begin[COLUMN];
    }
    return e;
}
