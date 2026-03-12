import { NextRequest, NextResponse } from 'next/server';

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const maxDuration = 60;

// Local fallback when API is unreachable (proxy, no key, network issues)
function generateFallbackAnalysis(description: string) {
  const desc = (description || '').toLowerCase();

  // Try to detect garment type from description
  const garmentTypes: Record<string, string> = {
    dress: 'dress', blouse: 'blouse', top: 'top', shirt: 'shirt',
    skirt: 'skirt', pants: 'pants', shorts: 'shorts', jumpsuit: 'jumpsuit',
    jacket: 'jacket', coat: 'coat', romper: 'romper', gown: 'gown',
  };
  let garmentType = 'dress';
  for (const [keyword, type] of Object.entries(garmentTypes)) {
    if (desc.includes(keyword)) { garmentType = type; break; }
  }

  // Detect category hints
  let suggestedCategory = null;
  if (desc.includes('baby') || desc.includes('infant') || desc.includes('newborn')) suggestedCategory = 'Baby';
  else if (desc.includes('girl')) suggestedCategory = 'Girls';
  else if (desc.includes('boy')) suggestedCategory = 'Boys';
  else if (desc.includes('teen')) suggestedCategory = 'Teen';
  else if (desc.includes('preteen')) suggestedCategory = 'Preteen';

  // Detect trims from description
  const trimKeywords = ['lace', 'embroidery', 'smocking', 'ruffle', 'button', 'bow', 'ribbon',
    'piping', 'applique', 'sequin', 'bead', 'pearl', 'pleats', 'fringe', 'tassel', 'trim'];
  const detectedTrims = trimKeywords.filter(t => desc.includes(t));
  if (detectedTrims.length === 0) detectedTrims.push('self-fabric trim');

  return {
    silhouette: description || 'See inspiration image for silhouette reference',
    construction: 'Standard construction — review image for specific details. Add seam allowances and construction notes during review.',
    closures: desc.includes('zipper') ? 'Back zipper closure' :
              desc.includes('button') ? 'Button closure — confirm placement' :
              'Confirm closure type and placement',
    neckline: desc.includes('collar') ? 'Collared neckline — see image for details' :
              desc.includes('v-neck') ? 'V-neckline' :
              desc.includes('crew') ? 'Crew neckline' :
              'Review image for neckline details',
    hemFinish: desc.includes('ruffle') ? 'Ruffled hem finish' :
               desc.includes('raw') ? 'Raw edge hem' :
               'Clean finish hem — confirm during review',
    trims: detectedTrims.join(', '),
    overall: `${garmentType.charAt(0).toUpperCase() + garmentType.slice(1)} — ${description || 'See inspiration image'}. Review all details and update notes as needed.`,
    detectedTrims,
    garmentType,
    suggestedCategory,
    clarifyingQuestions: [
      'What is the closure type and placement (zipper, buttons, etc.)?',
      'Is this garment lined or unlined?',
      'What is the desired fit — slim, regular, or relaxed?',
    ],
    _fallback: true,
  };
}

export async function POST(req: NextRequest) {
  const { imageBase64, imageMediaType, description } = await req.json();

  // Try the API first, fall back to local analysis if it fails
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API key');
    }

    // Build content blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlocks: any[] = [];

    if (imageBase64) {
      const mediaType = VALID_MEDIA_TYPES.includes(imageMediaType)
        ? imageMediaType
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

    // Use fetch directly instead of SDK to avoid proxy/SSL issues
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: contentBlocks }],
      }),
    });

    const contentType = apiRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Network proxy blocking API');
    }

    if (!apiRes.ok) {
      const errData = await apiRes.json();
      throw new Error(`API ${apiRes.status}: ${errData.error?.message || 'Unknown'}`);
    }

    const response = await apiRes.json();

    if (!response?.content || !Array.isArray(response.content)) {
      throw new Error('Unexpected response format');
    }

    const textBlock = response.content.find((b: { type: string }) => b.type === 'text');
    if (!textBlock?.text) {
      throw new Error('No text in response');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('API analysis failed, using local fallback:', error);
    // Return fallback analysis so the app keeps working
    const fallback = generateFallbackAnalysis(description);
    return NextResponse.json(fallback);
  }
}
