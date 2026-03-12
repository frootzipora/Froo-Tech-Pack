import { NextRequest, NextResponse } from 'next/server';

// Fallback suggestions when API is unreachable
function getFallbackSuggestions(type: string, garmentType: string) {
  if (type === 'fabric') {
    return [
      { name: '100% Cotton Poplin', composition: '100% Cotton', weight: '120 GSM', color: 'White / Custom dye', reason: `Versatile, breathable fabric suitable for ${garmentType || 'garments'}. Good drape and easy to sew.`, vendor: 'Contact factory for sourcing' },
      { name: 'Cotton/Poly Blend', composition: '65% Cotton, 35% Polyester', weight: '140 GSM', color: 'White / Custom dye', reason: 'Durable with less wrinkling. Good for everyday wear.', vendor: 'Contact factory for sourcing' },
      { name: '100% Cotton Lawn', composition: '100% Cotton', weight: '90 GSM', color: 'White / Custom print', reason: 'Lightweight and soft. Ideal for warm weather and delicate designs.', vendor: 'Contact factory for sourcing' },
    ];
  } else if (type === 'lining') {
    return [
      { name: 'Polyester Lining', composition: '100% Polyester', weight: '60 GSM', color: 'Match shell or white', reason: 'Standard lining — smooth, lightweight, affordable.', vendor: 'Contact factory for sourcing' },
      { name: 'Cotton Voile Lining', composition: '100% Cotton', weight: '70 GSM', color: 'White or nude', reason: 'Breathable natural lining, comfortable against skin.', vendor: 'Contact factory for sourcing' },
      { name: 'Poly/Cotton Lining', composition: '65% Poly, 35% Cotton', weight: '65 GSM', color: 'Match shell', reason: 'Blend of smooth finish and breathability.', vendor: 'Contact factory for sourcing' },
    ];
  } else {
    return [
      { description: 'Standard option — confirm with factory', material: 'TBD', color: 'Match garment', size: 'Standard', vendor: 'Factory to source', cost: 'TBD' },
      { description: 'Premium option — confirm with factory', material: 'TBD', color: 'Match garment', size: 'Standard', vendor: 'Factory to source', cost: 'TBD' },
      { description: 'Economy option — confirm with factory', material: 'TBD', color: 'Match garment', size: 'Standard', vendor: 'Factory to source', cost: 'TBD' },
    ];
  }
}

export async function POST(req: NextRequest) {
  const { type, garmentType, designNotes, baseFabricDescription } = await req.json();

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('No API key');
    }

    let prompt = '';

    if (type === 'fabric') {
      prompt = `You are a senior fabric sourcer for children's and women's apparel. Based on this garment:
Type: ${garmentType}
Design notes: ${designNotes}

Suggest 3 fabric options suitable for this garment. For each option, provide:
- Fabric name and composition (e.g., "100% Cotton Poplin")
- Weight (GSM)
- Recommended color/finish
- Why it works for this garment
- A typical vendor/mill name

Return as JSON array: [{"name": "...", "composition": "...", "weight": "...", "color": "...", "reason": "...", "vendor": "..."}]
Return ONLY the JSON array.`;
    } else if (type === 'lining') {
      prompt = `You are a senior fabric sourcer. Suggest 3 lining fabric options for:
Garment: ${garmentType}
Base fabric: ${baseFabricDescription || 'Not specified'}
Design: ${designNotes}

For each, provide fabric name, composition, weight, color suggestion, reasoning, and vendor.
Return as JSON array: [{"name": "...", "composition": "...", "weight": "...", "color": "...", "reason": "...", "vendor": "..."}]
Return ONLY the JSON array.`;
    } else if (type === 'trim') {
      prompt = `You are a senior trims sourcer for garment production. Suggest 3 options for this trim:
Trim type: ${garmentType}
Garment design: ${designNotes}

For each, provide: trim description, material, color/finish, size/dimensions, vendor name, and approximate cost.
Return as JSON array: [{"description": "...", "material": "...", "color": "...", "size": "...", "vendor": "...", "cost": "..."}]
Return ONLY the JSON array.`;
    }

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const contentType = apiRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Network proxy blocking API');
    }

    if (!apiRes.ok) {
      throw new Error(`API ${apiRes.status}`);
    }

    const response = await apiRes.json();
    const textBlock = response.content?.find((b: { type: string }) => b.type === 'text');
    if (!textBlock?.text) {
      throw new Error('No text response');
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestion API failed, using fallback:', error);
    const suggestions = getFallbackSuggestions(type, garmentType);
    return NextResponse.json({ suggestions, _fallback: true });
  }
}
