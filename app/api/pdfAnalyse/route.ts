import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

// POST function to handle PDF parsing
export async function POST(request: NextRequest) {
  try {
    // Get the file buffer from the request body
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the PDF file using pdf-parse
    const data = await pdfParse(buffer);

    // Return the parsed text from the PDF
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Failed to parse PDF:', error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
