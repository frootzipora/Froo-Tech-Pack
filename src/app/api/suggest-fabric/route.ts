import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
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
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 });
  }
}
