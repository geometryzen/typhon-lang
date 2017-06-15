import { IDXLAST } from '../common/tree';

/**
 * Prepare the source text into lines to feed to the `generateTokens` method of the tokenizer.
 */
export function splitSourceTextIntoLines(sourceText: string): string[] {
    const lines: string[] = [];
    // Why do we normalize the sourceText in this manner?
    if (sourceText.substr(IDXLAST(sourceText), 1) !== "\n") {
        sourceText += "\n";
    }
    // Splitting this way will create a final line that is the zero-length string.
    const pieces = sourceText.split("\n");
    const N = pieces.length;
    for (let i = 0; i < N; ++i) {
        // We're adding back newline characters for all but the last line.
        const line = pieces[i] + ((i === IDXLAST(pieces)) ? "" : "\n");
        lines.push(line);
    }
    return lines;
}
