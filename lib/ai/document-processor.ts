// Document Processing Engine
// Extracts text from uploaded documents (PDF, TXT, MD, DOCX)

/**
 * Extract text from a file buffer based on MIME type
 */
export async function extractText(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
): Promise<string> {
    switch (mimeType) {
        case 'application/pdf':
            return extractFromPdf(buffer);
        case 'text/plain':
        case 'text/markdown':
            return buffer.toString('utf-8');
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return extractFromDocx(buffer);
        default:
            // Try as plain text
            const text = buffer.toString('utf-8');
            if (isValidText(text)) return text;
            throw new Error(`Unsupported file type: ${mimeType} (${fileName})`);
    }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractFromPdf(buffer: Buffer): Promise<string> {
    try {
        // Use require to bypass ESM static resolution issues during build
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return cleanText(data.text);
    } catch (e: any) {
        console.error('[DocProcessor] PDF extraction failed:', e.message);
        throw new Error(`PDF extraction failed: ${e.message}`);
    }
}

/**
 * Extract text from DOCX using raw XML parsing (no heavy deps)
 */
async function extractFromDocx(buffer: Buffer): Promise<string> {
    try {
        // Use require to bypass ESM static resolution issues during build
        const JSZip = require('jszip');
        const zip = await JSZip.loadAsync(buffer);
        const docXml = await zip.file('word/document.xml')?.async('text');

        if (!docXml) {
            throw new Error('Could not find document.xml in DOCX file');
        }

        // Strip XML tags to get plain text
        const text = docXml
            .replace(/<w:p[^>]*>/g, '\n') // paragraph breaks
            .replace(/<w:br[^>]*>/g, '\n') // line breaks
            .replace(/<w:tab[^>]*>/g, '\t') // tabs
            .replace(/<[^>]+>/g, '') // remove all XML tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");

        return cleanText(text);
    } catch (e: any) {
        console.error('[DocProcessor] DOCX extraction failed:', e.message);
        throw new Error(`DOCX extraction failed: ${e.message}`);
    }
}

/**
 * Clean extracted text: normalize whitespace, remove artifacts
 */
function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')           // normalize line endings
        .replace(/\t/g, '  ')             // tabs to spaces
        .replace(/[^\S\n]+/g, ' ')        // collapse horizontal whitespace
        .replace(/\n{3,}/g, '\n\n')       // max 2 consecutive newlines
        .replace(/^\s+|\s+$/g, '')         // trim
        .trim();
}

/**
 * Check if a string is valid (mostly printable) text
 */
function isValidText(text: string): boolean {
    if (!text || text.length === 0) return false;
    // Check if at least 80% of characters are printable
    const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
    return printable.length / text.length > 0.8;
}

/**
 * Detect MIME type from file extension
 */
export function detectMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'txt': return 'text/plain';
        case 'md': return 'text/markdown';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        default: return 'text/plain';
    }
}
