import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack-verify';

const SIZE_CHART_TEMPLATES: Record<string, { name: string; headers: string[]; rows: string[][] }> = {
  'baby-dress': {
    name: 'Baby Dress',
    headers: ['Measurement', '0-3M', '3-6M', '6-12M', '12-18M', '18-24M'],
    rows: [
      ['Chest', '17"', '18"', '19"', '20"', '21"'],
      ['Length (HPS)', '14"', '15"', '16.5"', '18"', '19.5"'],
      ['Sleeve Length', '3"', '3.5"', '4"', '4.5"', '5"'],
      ['Hem Width', '20"', '21"', '22"', '23"', '24"'],
    ],
  },
  'girls-dress': {
    name: 'Girls Dress',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Chest', '21"', '22"', '23"', '25"', '27"', '29"'],
      ['Waist', '20"', '21"', '22"', '23"', '24"', '25"'],
      ['Length (HPS)', '20"', '22"', '24"', '27"', '30"', '33"'],
      ['Sleeve Length', '4"', '5"', '6"', '7"', '8"', '9"'],
      ['Hem Width', '26"', '28"', '30"', '32"', '34"', '36"'],
    ],
  },
  'girls-top': {
    name: 'Girls Top',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Chest', '21"', '22"', '23"', '25"', '27"', '29"'],
      ['Length (HPS)', '13"', '14"', '15.5"', '17"', '18.5"', '20"'],
      ['Sleeve Length', '4"', '5"', '6"', '7"', '8"', '9"'],
      ['Hem Width', '22"', '23"', '24"', '26"', '28"', '30"'],
    ],
  },
  'girls-skirt': {
    name: 'Girls Skirt',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Waist (relaxed)', '19"', '20"', '21"', '22"', '23"', '24"'],
      ['Waist (stretched)', '22"', '23"', '24"', '25"', '26"', '27"'],
      ['Length', '9"', '10"', '11.5"', '13"', '14.5"', '16"'],
      ['Hem Width', '24"', '26"', '28"', '30"', '32"', '34"'],
    ],
  },
  'teen-dress': {
    name: 'Teen / Preteen Dress',
    headers: ['Measurement', '12', '14', '16', '18'],
    rows: [
      ['Chest', '29"', '31"', '33"', '35"'],
      ['Waist', '25"', '26"', '27"', '28"'],
      ['Hip', '31"', '33"', '35"', '37"'],
      ['Length (HPS)', '33"', '35"', '37"', '39"'],
      ['Sleeve Length', '9"', '10"', '11"', '12"'],
    ],
  },
  'boys-shirt': {
    name: 'Boys Shirt',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Chest', '22"', '23"', '24"', '26"', '28"', '30"'],
      ['Length (HPS)', '14"', '15"', '16.5"', '18"', '19.5"', '21"'],
      ['Sleeve Length', '5"', '6"', '7"', '8"', '9"', '10"'],
      ['Neck Width', '4.5"', '5"', '5.5"', '6"', '6.5"', '7"'],
    ],
  },
};

function formatSizeChartTable(template: { name: string; headers: string[]; rows: string[][] }): string {
  const { headers, rows } = template;

  // Calculate column widths
  const allRows = [headers, ...rows];
  const colWidths = headers.map((_, colIdx) =>
    Math.max(...allRows.map((row) => (row[colIdx] || '').length))
  );

  const separator = colWidths.map((w) => '-'.repeat(w + 2)).join('+');
  const formatRow = (row: string[]) =>
    row.map((cell, i) => ` ${cell.padEnd(colWidths[i])} `).join('|');

  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}

function buildListResponse() {
  const templateList = Object.entries(SIZE_CHART_TEMPLATES)
    .map(([key, t]) => `  *${key}* — ${t.name} (sizes: ${t.headers.slice(1).join(', ')})`)
    .join('\n');

  return {
    response_type: 'ephemeral' as const,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Available Size Charts*\nType `/sizechart [name]` to view one:\n\n' + templateList,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'Example: `/sizechart girls-dress`',
          },
        ],
      },
    ],
  };
}

function buildChartResponse(key: string, template: { name: string; headers: string[]; rows: string[][] }) {
  const table = formatSizeChartTable(template);

  return {
    response_type: 'in_channel' as const,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📐 ${template.name} Size Chart`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```\n' + table + '\n```',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Template: *${key}* | Sizes: ${template.headers.slice(1).join(', ')} | All measurements in inches`,
          },
        ],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    // Read the raw body for signature verification
    const rawBody = await request.text();

    // Verify the request is from Slack (skip if no signing secret configured — dev mode)
    if (signingSecret) {
      const timestamp = request.headers.get('x-slack-request-timestamp') || '';
      const signature = request.headers.get('x-slack-signature') || '';

      if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse the URL-encoded form body
    const params = new URLSearchParams(rawBody);
    const text = (params.get('text') || '').trim().toLowerCase();

    // No argument — list available charts
    if (!text) {
      return NextResponse.json(buildListResponse());
    }

    // Look up the requested template
    const template = SIZE_CHART_TEMPLATES[text];

    if (!template) {
      // Fuzzy match: try to find a partial match
      const match = Object.entries(SIZE_CHART_TEMPLATES).find(
        ([key, t]) =>
          key.includes(text) ||
          t.name.toLowerCase().includes(text)
      );

      if (match) {
        return NextResponse.json(buildChartResponse(match[0], match[1]));
      }

      const validKeys = Object.keys(SIZE_CHART_TEMPLATES).join(', ');
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Size chart "${text}" not found. Available charts: ${validKeys}\nTry \`/sizechart\` to see the full list.`,
      });
    }

    return NextResponse.json(buildChartResponse(text, template));
  } catch (error) {
    console.error('Slack sizechart command error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Something went wrong processing your request. Please try again.',
    });
  }
}
