// Ensure DOM globals expected by pdfjs-dist / pdf-parse exist in Node.js server environments
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2];
        this.d = init[3]; this.e = init[4]; this.f = init[5];
        this.m11 = init[0]; this.m12 = init[1];
        this.m21 = init[2]; this.m22 = init[3];
        this.m41 = init[4]; this.m42 = init[5];
      }
    }
    multiply(_other: any) { return this; }
    translate(_tx = 0, _ty = 0) { return this; }
    scale(_sx = 1, _sy = _sx) { return this; }
    rotate(_angle = 0) { return this; }
    inverse() { return this; }
    transformPoint(p: any) { return p; }
  };
}

if (typeof (globalThis as any).DOMPoint === 'undefined') {
  (globalThis as any).DOMPoint = class DOMPoint {
    x = 0; y = 0; z = 0; w = 1;
    constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
  };
}

if (typeof (globalThis as any).DOMRect === 'undefined') {
  (globalThis as any).DOMRect = class DOMRect {
    x = 0; y = 0; width = 0; height = 0;
    top = 0; right = 0; bottom = 0; left = 0;
    constructor(x = 0, y = 0, w = 0, h = 0) { this.x = x; this.y = y; this.width = w; this.height = h; }
  };
}

/**
 * Extracts plain text from a PDF using pdf-parse v2 (class-based API — v1's default-export
 * function no longer exists, which silently broke CV uploads and the tender summarizer).
 */
export async function extractPdfText(buffer: Buffer, opts: { maxPages?: number } = {}): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText(opts.maxPages ? { first: opts.maxPages } : undefined);
    return result.text ?? '';
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
