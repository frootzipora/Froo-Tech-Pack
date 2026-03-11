import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { type, description, designNotes, imageBase64 } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompts: Record<string, string> = {
      'flat-front': `Generate a professional technical flat sketch (front view) of: ${description}.
Design details: ${designNotes}
Style: Clean black and white line drawing, no shading, no fill, white background.
The sketch should be a professional fashion technical flat suitable for a garment tech pack.
Show all construction details, stitching lines, and design features clearly.`,

      'flat-back': `Generate a professional technical flat sketch (back view) of: ${description}.
Design details: ${designNotes}
Style: Clean black and white line drawing, no shading, no fill, white background.
The sketch should be a professional fashion technical flat suitable for a garment tech pack.
Show all construction details, stitching lines, and design features from the rear view.`,

      'mockup-front': `Generate a photorealistic 3D mockup (front view) of: ${description}.
Design details: ${designNotes}
Style: Photorealistic fabric rendering on a dress form/mannequin. Show realistic fabric texture, drape, and color.
Professional product photography style, clean white background.`,

      'mockup-back': `Generate a photorealistic 3D mockup (back view) of: ${description}.
Design details: ${designNotes}
Style: Photorealistic fabric rendering on a dress form/mannequin from behind. Show realistic fabric texture, drape, and color.
Professional product photography style, clean white background.`,

      'detail-callout': `Generate a detailed close-up view of: ${description}.
This is a zoomed-in detail view for a garment tech pack showing construction clearly for factory reference.
Clean, well-lit, white background, showing material texture and construction detail.`,

      'remove-bg': `Remove the background from this garment image. Return the garment isolated on a clean white background. Preserve all garment details.`,
    };

    const prompt = prompts[type] || prompts['flat-front'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: prompt }];

    if (imageBase64 && (type === 'remove-bg' || type === 'flat-front' || type === 'flat-back' || type === 'mockup-front' || type === 'mockup-back')) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    // For image generation models, we'd get image data back
    // With the text model, we get a description - in production use Imagen API
    return NextResponse.json({
      success: true,
      type,
      description: text,
      // In production, this would return actual generated image data
      placeholder: true,
    });
  } catch (error) {
    console.error('Visual generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate ${req.url}. Continuing to next asset.`, type: 'error' },
      { status: 500 }
    );
  }
}
