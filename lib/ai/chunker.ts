// Intelligent Text Chunker
// Recursive character splitting with heading hierarchy preservation

export interface TextChunk {
    content: string;
    index: number;
    tokenCount: number;
    metadata: {
        docType: string;
        authorityLevel: number;
        internId: string | null;
        heading: string | null;
        startChar: number;
        endChar: number;
    };
}

interface ChunkOptions {
    maxTokens?: number;       // Max tokens per chunk (default: 512)
    overlapTokens?: number;   // Overlap between chunks (default: 50)
    docType: string;
    authorityLevel: number;
    internId?: string | null;
}

/**
 * Approximate token count (1 token ≈ 4 chars for English)
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Split text into semantically meaningful chunks
 */
export function chunkText(text: string, options: ChunkOptions): TextChunk[] {
    const maxTokens = options.maxTokens || 512;
    const overlapTokens = options.overlapTokens || 50;
    const maxChars = maxTokens * 4;
    const overlapChars = overlapTokens * 4;

    if (!text || text.trim().length === 0) return [];

    // First, split by major headings to preserve document structure
    const sections = splitByHeadings(text);
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
        const sectionChunks = splitSection(
            section.content,
            section.heading,
            maxChars,
            overlapChars,
        );

        for (const chunk of sectionChunks) {
            chunks.push({
                content: chunk.content,
                index: chunkIndex,
                tokenCount: estimateTokens(chunk.content),
                metadata: {
                    docType: options.docType,
                    authorityLevel: options.authorityLevel,
                    internId: options.internId || null,
                    heading: chunk.heading,
                    startChar: chunk.startChar,
                    endChar: chunk.endChar,
                },
            });
            chunkIndex++;
        }
    }

    return chunks;
}

interface Section {
    heading: string | null;
    content: string;
    startChar: number;
}

/**
 * Split text by markdown-style headings
 */
function splitByHeadings(text: string): Section[] {
    const lines = text.split('\n');
    const sections: Section[] = [];
    let currentHeading: string | null = null;
    let currentContent: string[] = [];
    let charOffset = 0;
    let sectionStart = 0;

    for (const line of lines) {
        const headingMatch = line.match(/^#{1,4}\s+(.+)/);

        if (headingMatch) {
            // Save previous section if it has content
            if (currentContent.length > 0) {
                const content = currentContent.join('\n').trim();
                if (content.length > 0) {
                    sections.push({
                        heading: currentHeading,
                        content,
                        startChar: sectionStart,
                    });
                }
            }
            currentHeading = headingMatch[1].trim();
            currentContent = [];
            sectionStart = charOffset;
        } else {
            currentContent.push(line);
        }

        charOffset += line.length + 1; // +1 for newline
    }

    // Don't forget the last section
    if (currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content.length > 0) {
            sections.push({
                heading: currentHeading,
                content,
                startChar: sectionStart,
            });
        }
    }

    // If no headings found, return the whole text as one section
    if (sections.length === 0 && text.trim().length > 0) {
        sections.push({
            heading: null,
            content: text.trim(),
            startChar: 0,
        });
    }

    return sections;
}

interface ChunkPart {
    content: string;
    heading: string | null;
    startChar: number;
    endChar: number;
}

/**
 * Split a section into smaller chunks if needed, with overlap
 */
function splitSection(
    text: string,
    heading: string | null,
    maxChars: number,
    overlapChars: number,
): ChunkPart[] {
    if (text.length <= maxChars) {
        return [{
            content: heading ? `## ${heading}\n\n${text}` : text,
            heading,
            startChar: 0,
            endChar: text.length,
        }];
    }

    const parts: ChunkPart[] = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = heading ? `## ${heading}\n\n` : '';
    let chunkStart = 0;

    for (const para of paragraphs) {
        if ((currentChunk + para).length > maxChars && currentChunk.length > 0) {
            // Save current chunk
            parts.push({
                content: currentChunk.trim(),
                heading,
                startChar: chunkStart,
                endChar: chunkStart + currentChunk.length,
            });

            // Start new chunk with overlap
            const overlapText = currentChunk.slice(-overlapChars);
            currentChunk = (heading ? `## ${heading} (cont.)\n\n` : '') + overlapText + '\n\n';
            chunkStart += currentChunk.length - overlapChars;
        }

        currentChunk += para + '\n\n';
    }

    // Save remaining content
    if (currentChunk.trim().length > 0) {
        parts.push({
            content: currentChunk.trim(),
            heading,
            startChar: chunkStart,
            endChar: chunkStart + currentChunk.length,
        });
    }

    return parts;
}
