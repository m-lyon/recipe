export interface KeyPhraseMatch {
    text: string;
    keyPhrase?: { value: string; description: string };
}

/**
 * Splits `instruction` text into segments, tagging segments that match
 * a key phrase. Uses longest-match-first strategy for overlapping phrases.
 * Matching is case-insensitive and word-boundary aware.
 */
export function splitByKeyPhrases(
    instruction: string,
    keyPhrases: Array<{ value: string; description: string }>
): KeyPhraseMatch[] {
    if (!keyPhrases.length) return [{ text: instruction }];

    // Filter out empty values and sort descending by value length so longest match wins
    const sorted = [...keyPhrases]
        .filter((kp) => kp.value.trim().length > 0)
        .sort((a, b) => b.value.length - a.value.length);
    if (!sorted.length) return [{ text: instruction }];

    // Build a combined regex with alternation for each phrase
    // Use word boundary anchors
    const pattern = sorted
        .map((kp) => kp.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .map((escaped) => `\\b${escaped}\\b`)
        .join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    const segments: KeyPhraseMatch[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(instruction)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: instruction.slice(lastIndex, match.index) });
        }
        const matchedText = match[0];
        const keyPhrase = sorted.find(
            (kp) => kp.value.toLowerCase() === matchedText.toLowerCase()
        );
        segments.push({ text: matchedText, keyPhrase });
        lastIndex = match.index + matchedText.length;
    }

    if (lastIndex < instruction.length) {
        segments.push({ text: instruction.slice(lastIndex) });
    }

    return segments;
}
