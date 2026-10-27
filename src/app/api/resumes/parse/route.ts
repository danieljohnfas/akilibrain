import { NextRequest, NextResponse } from 'next/server';
import { parseResumeDocument } from '@/lib/services/resume-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/resumes/parse
 * Accepts either:
 * 1. multipart/form-data with a 'file' entry (PDF, DOCX, TXT, CSV)
 * 2. application/json with { "filename": string, "base64Data": string }
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer;
    let filename = 'document.pdf';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: 'Missing or invalid "file" in form data' },
          { status: 400 }
        );
      }

      filename = file instanceof File ? file.name : 'document.pdf';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.base64Data) {
        return NextResponse.json(
          { error: 'Missing "base64Data" in JSON payload' },
          { status: 400 }
        );
      }
      filename = body.filename || 'document.pdf';
      buffer = Buffer.from(body.base64Data, 'base64');
    } else {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Please use multipart/form-data or application/json' },
        { status: 415 }
      );
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 10MB limit' },
        { status: 413 }
      );
    }

    const result = await parseResumeDocument(buffer, filename);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Parsing failed' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      filename,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: `Internal parsing error: ${message}` },
      { status: 500 }
    );
  }
}
