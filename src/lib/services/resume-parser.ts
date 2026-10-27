import { toMarkdownBytes, formatFromExtension } from '@firecrawl/anydoc';

export interface ParsedResume {
  success: boolean;
  markdown: string;
  format: string;
  charCount: number;
  extractedMeta: {
    emails: string[];
    phones: string[];
    suggestedSkills: string[];
  };
  error?: string;
}

const COMMON_SKILLS = [
  'typescript', 'javascript', 'python', 'react', 'next.js', 'node.js',
  'sql', 'postgresql', 'supabase', 'aws', 'docker', 'graphql',
  'tailwind', 'git', 'ci/cd', 'rest api', 'flutter', 'fastapi',
  'project management', 'agile', 'scrum', 'sales', 'marketing'
];

/**
 * Parses uploaded candidate documents (PDF, DOCX, ODT, RTF, TXT, CSV)
 * into clean GitHub-Flavored Markdown for AI career matching using open-source AnyDoc.
 */
export async function parseResumeDocument(
  buffer: Buffer,
  filename: string
): Promise<ParsedResume> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  try {
    let markdown = '';
    let detectedFormat = ext;

    if (ext === 'txt' || ext === 'text') {
      markdown = buffer.toString('utf-8');
      detectedFormat = 'txt';
    } else if (ext === 'md' || ext === 'markdown') {
      markdown = buffer.toString('utf-8');
      detectedFormat = 'markdown';
    } else {
      const anydocFormat = formatFromExtension(ext);
      if (!anydocFormat) {
        // Fallback to text if unknown
        markdown = buffer.toString('utf-8');
        detectedFormat = 'plain-fallback';
      } else {
        markdown = await toMarkdownBytes(buffer, anydocFormat);
        detectedFormat = anydocFormat;
      }
    }

    // Extract quick contact info and skills
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    const emails = Array.from(new Set(markdown.match(emailRegex) || []));
    const phones = Array.from(new Set(markdown.match(phoneRegex) || []));

    const lowerMd = markdown.toLowerCase();
    const suggestedSkills = COMMON_SKILLS.filter(skill => 
      lowerMd.includes(skill.toLowerCase())
    );

    return {
      success: true,
      markdown: markdown.trim(),
      format: detectedFormat,
      charCount: markdown.length,
      extractedMeta: {
        emails,
        phones,
        suggestedSkills
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      markdown: '',
      format: ext,
      charCount: 0,
      extractedMeta: {
        emails: [],
        phones: [],
        suggestedSkills: []
      },
      error: `Failed to parse document: ${message}`
    };
  }
}
