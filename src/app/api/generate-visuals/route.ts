import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Add it to your .env.local file.', type: 'error' },
        { status: 500 }
      );
    }

    const { type, description, designNotes, imageBase64, imageMediaType } = await req.json();

    // Use Gemini 2.0 Flash with image generation enabled
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp-image-generation',
      generationConfig: {
        // @ts-expect-error - responseModalities is supported but not yet in the type definitions
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const prompts: Record<string, string> = {
      'flat-front': `Generate a professional technical flat sketch (front view) of: ${description}.
Design details: ${designNotes}
Style: Clean black and white line drawing, no shading, no fill, white background.
The sketch should be a professional fashion technical flat suitable for a garment tech pack.
Show all construction details, stitching lines, and design features clearly.
Please generate the image.`,

      'flat-back': `Generate a professional technical flat sketch (back view) of: ${description}.
Design details: ${designNotes}
Style: Clean black and white line drawing, no shading, no fill, white background.
The sketch should be a professional fashion technical flat suitable for a garment tech pack.
Show all construction details, stitching lines, and design features from the rear view.
Please generate the image.`,

      'mockup-front': `Generate a photorealistic 3D mockup (front view) of: ${description}.
Design details: ${designNotes}
Style: Photorealistic fabric rendering on a dress form/mannequin. Show realistic fabric texture, drape, and color.
Professional product photography style, clean white background.
Please generate the image.`,

      'mockup-back': `Generate a photorealistic 3D mockup (back view) of: ${description}.
Design details: ${designNotes}
Style: Photorealistic fabric rendering on a dress form/mannequin from behind. Show realistic fabric texture, drape, and color.
Professional product photography style, clean white background.
Please generate the image.`,

      'detail-callout': `Generate a detailed close-up view of: ${description}.
This is a zoomed-in detail view for a garment tech pack showing construction clearly for factory reference.
Clean, well-lit, white background, showing material texture and construction detail.
Please generate the image.`,

      'remove-bg': `Remove the background from this garment image. Return the garment isolated on a clean white background. Preserve all garment details. Please generate the image.`,
    };

    const prompt = prompts[type] || prompts['flat-front'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: prompt }];

    if (imageBase64 && (type === 'remove-bg' || type === 'flat-front' || type === 'flat-back' || type === 'mockup-front' || type === 'mockup-back')) {
      parts.push({
        inlineData: {
          mimeType: imageMediaType || 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response;

    // Extract image data from the response
    const candidates = response.candidates;
    let imageData: string | null = null;
    let imageMimeType: string | null = null;
    let textDescription = '';

    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        // Check for inline image data in the response
        if (part.inlineData) {
          imageData = part.inlineData.data;
          imageMimeType = part.inlineData.mimeType;
        } else if (part.text) {
          textDescription += part.text;
        }
      }
    }

    if (imageData) {
      return NextResponse.json({
        success: true,
        type,
        imageData: `data:${imageMimeType};base64,${imageData}`,
        description: textDescription || 'Generated successfully',
        placeholder: false,
      });
    }

    // Fallback: no image was returned (model may not support image output)
    return NextResponse.json({
      success: true,
      type,
      description: textDescription || response.text(),
      placeholder: true,
    });
  } catch (error) {
    console.error('Visual generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate visual: ${message}`, type: 'error' },
      { status: 500 }
    );
  }
}
