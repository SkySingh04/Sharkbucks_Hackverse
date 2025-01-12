import { GoogleGenerativeAI } from "@google/generative-ai";
import dynamic from 'next/dynamic';
import Tesseract from 'tesseract.js'; // Import Tesseract.js

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

const extractTextFromImage = async (file: File) => {
  try {
    // Use Tesseract.js for OCR on the uploaded image
    const text = await new Promise<string>((resolve, reject) => {
      Tesseract.recognize(
        file,
        'eng', // You can add other languages if needed
        {
          logger: (m) => console.log(m), // Optional: to log the progress
        }
      )
        .then(({ data: { text } }) => {
          resolve(text); // Extracted text from the image
        })
        .catch((error) => {
          reject('OCR failed: ' + error);
        });
    });
    return text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("OCR extraction failed");
  }
};

// Document type-specific prompts for Gemini
const VERIFICATION_PROMPTS = {
  identityProof: `Analyze this identity document and verify:
  1. Is it a valid government-issued ID?
  2. Are all required fields present (name, ID number, date of birth)?
  3. Check for any signs of tampering or inconsistencies.
  4. Is the document currently valid (not expired)?
  Provide a detailed analysis and list any concerns.`,

  incomeTax: `Analyze this income tax return and verify:
  1. Is it a complete tax return document?
  2. Identify the assessment year and filing date
  3. Verify if income details are present and consistent
  4. Check for any red flags or inconsistencies
  Provide a detailed analysis focusing on financial credibility.`,

  addressProof: `Analyze this address proof document and verify:
  1. Is it an acceptable form of address proof?
  2. Are address details complete and properly formatted?
  3. Is the document recent (within last 3 months if applicable)?
  4. Check for any inconsistencies or red flags
  Provide a detailed analysis of the document's validity.`,

  bankStatement: `Analyze this bank statement and verify:
  1. Is it a complete bank statement?
  2. Identify the statement period and bank details
  3. Check for regular cash flows and transaction patterns
  4. Identify any suspicious transactions or irregularities
  Provide a detailed analysis focusing on financial health.

  Don't use words like invalid, reject or fake unless you find it necessary. If it's not a valid document, please use three words : 'invalid', 'reject' and 'fake' to make the code understand the invalidity.
  
  Output format !! :
      (this is used to calculate validity btw so keep it in mind :
      const confidence = isValid && warnings.length === 0 ? 0.95 :
      isValid && warnings.length < 3 ? 0.8 :
      isValid ? 0.6 : 0.2;)
`
};

// Gemini-powered document verification
const verifyWithGemini = async (
  extractedText: string,
  documentType: keyof typeof VERIFICATION_PROMPTS
): Promise<{
  isValid: boolean;
  analysis: string;
  confidence: number;
  warnings: string[];
}> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = VERIFICATION_PROMPTS[documentType];
    const result = await model.generateContent([
      "You are a document verification expert. " +
      "Analyze the following document text and provide a detailed verification report. " +
      prompt + "\n\nDocument text:\n" + extractedText
    ]);
    const response = await result.response;
    const analysis = await response.text();  // Ensure you await the text

    // Parse the analysis to determine validity and extract warnings
    const isValid = !analysis.toLowerCase().includes("invalid") &&
      !analysis.toLowerCase().includes("reject") &&
      !analysis.toLowerCase().includes("fake");

    const warnings = analysis
      .split(/[.!?]/)
      .filter(sentence =>
        sentence.toLowerCase().includes("warning") ||
        sentence.toLowerCase().includes("concern") ||
        sentence.toLowerCase().includes("issue")
      )
      .map(warning => warning.trim())
      .filter(warning => warning.length > 0);

    // Calculate a basic confidence score
    const confidence = isValid && warnings.length === 0 ? 0.95 :
      isValid && warnings.length < 3 ? 0.8 :
      isValid ? 0.6 : 0.2;

    return {
      isValid,
      analysis,
      confidence,
      warnings
    };
  } catch (error) {
    console.error("Gemini verification failed:", error);
    throw new Error("Document verification failed");
  }
};

const verifyDocument = async (file: File, documentType: keyof typeof VERIFICATION_PROMPTS) => {
    try {
      // Extract text from image using Tesseract OCR
      const fullText = await extractTextFromImage(file);
  
      // If the text extracted is too short or empty, mark it as invalid
      if (!fullText || fullText.length < 100) {
        return {
          isValid: false,
          analysis: "The extracted text is too short or irrelevant to be verified.",
          confidence: 0.1,
          warnings: ["Text extraction failed, or the document is too irrelevant for verification."]
        };
      }
  
      // Verify with Gemini AI (document verification)
      const verificationResult = await verifyWithGemini(fullText, documentType);
  
      // Further refine the result: If no significant content or analysis found, set it to invalid
      if (verificationResult.isValid && verificationResult.analysis.toLowerCase().includes("not a complete document")) {
        return {
          isValid: false,
          analysis: "The document is incomplete or cannot be verified properly.",
          confidence: 0.3,
          warnings: ["Document content is incomplete."]
        };
      }
  
      // If no relevant fields or structure for the document type are found
      if (documentType === 'incomeTax' && !fullText.includes('income') && !fullText.includes('tax return')) {
        return {
          isValid: false,
          analysis: "The document does not appear to be a valid income tax return.",
          confidence: 0.2,
          warnings: ["Missing key terms like 'income' or 'tax return'."]
        };
      }
  
      return verificationResult;
  
    } catch (error) {
      console.error("Document verification failed:", error);
      throw error;
    }
  };
  

export { verifyDocument, extractTextFromImage, verifyWithGemini };
