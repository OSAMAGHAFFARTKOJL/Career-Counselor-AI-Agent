export async function extractResumeText(file: File, buffer: ArrayBuffer) {
  const fileName = file.name.toLowerCase();

  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: Buffer.from(buffer) });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    const mammothModule = (await import('mammoth')) as unknown as {
      extractRawText?: (input: { buffer: Buffer }) => Promise<{ value: string }>;
      default?: {
        extractRawText?: (input: { buffer: Buffer }) => Promise<{ value: string }>;
      };
    };
    const extractRawText =
      mammothModule.extractRawText ??
      mammothModule.default?.extractRawText;

    if (!extractRawText) {
      throw new Error('DOCX parser is not available in this runtime.');
    }

    const result = await extractRawText({ buffer: Buffer.from(buffer) });
    return result.value;
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX resume.');
}
