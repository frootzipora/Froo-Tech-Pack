import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const { type, garmentType, designNotes, baseFabricDescription } = await req.json();

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Anthropic API ${apiRes.status}: ${errText.slice(0, 200)}`);
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
    console.error('Suggestion error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get suggestions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
