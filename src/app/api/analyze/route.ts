import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ValidMediaType = typeof VALID_MEDIA_TYPES[number];

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const { imageBase64, imageMediaType, description } = await req.json();

    const contentBlocks: Anthropic.ContentBlockParam[] = [];

    if (imageBase64) {
      // Validate and coerce media type
      const mediaType: ValidMediaType = VALID_MEDIA_TYPES.includes(imageMediaType as ValidMediaType)
        ? (imageMediaType as ValidMediaType)
        : 'image/jpeg';

      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: imageBase64,
        },
      });
    }

    contentBlocks.push({
      type: 'text',
      text: `You are a senior garment technician preparing a tech pack for factory production. Analyze the provided garment ${imageBase64 ? 'image' : ''} ${description ? `and description: "${description}"` : ''}.

Return a JSON object with these exact keys:
{
  "silhouette": "Silhouette and overall style description",
  "construction": "Construction details — seams, lining, interfacing",
  "closures": "Closures — type and placement",
  "neckline": "Neckline, collar, and sleeve details",
  "hemFinish": "Hem finish description",
  "trims": "Trims and embellishments — embroidery, lace, smocking, pleats, piping, ruffles, buttons, etc.",
  "overall": "Complete design summary for factory reference",
  "detectedTrims": ["list", "of", "individual", "trim", "types", "found"],
  "garmentType": "single word garment type e.g. dress, blouse, skirt, pants",
  "suggestedCategory": "Baby | Girls | Boys | Preteen | Teen or null",
  "clarifyingQuestions": ["Question 1?", "Question 2?"]
}

The clarifying questions should be targeted follow-ups needed for factory clarity — only ask about what is ambiguous or not visible. Examples: button functionality, closure type/placement, elastic vs flat waist, fit type (slim, relaxed, oversized).

Return ONLY the JSON object, no other text.`,
    });

    let response;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: contentBlocks }],
      });
    } catch (apiError) {
      console.error('Anthropic API error:', apiError);
      const msg = apiError instanceof Error ? apiError.message : 'API call failed';
      throw new Error(`Anthropic API error: ${msg}`);
    }

    if (!response || !response.content || !Array.isArray(response.content)) {
      console.error('Unexpected API response:', JSON.stringify(response));
      throw new Error('Unexpected response format from Anthropic API');
    }

    const textBlock = response.content.find((b: { type: string }) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
