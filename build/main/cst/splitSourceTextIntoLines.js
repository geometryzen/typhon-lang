"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitSourceTextIntoLines = void 0;
var tree_1 = require("../common/tree");
/**
 * Prepare the source text into lines to feed to the `generateTokens` method of the tokenizer.
 */
function splitSourceTextIntoLines(sourceText) {
    var lines = [];
    // Why do we normalize the sourceText in this manner?
    if (sourceText.substr(tree_1.IDXLAST(sourceText), 1) !== "\n") {
        sourceText += "\n";
    }
    // Splitting this way will create a final line that is the zero-length string.
    var pieces = sourceText.split("\n");
    var N = pieces.length;
    for (var i = 0; i < N; ++i) {
        // We're adding back newline characters for all but the last line.
        var line = pieces[i] + ((i === tree_1.IDXLAST(pieces)) ? "" : "\n");
        lines.push(line);
    }
    return lines;
}
exports.splitSourceTextIntoLines = splitSourceTextIntoLines;
