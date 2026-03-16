import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify Slack signature
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (signingSecret) {
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';
    if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody);

  // Handle Slack URL verification challenge
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle events
  if (payload.type === 'event_callback') {
    // Acknowledge immediately — process events as needed
    // Currently no event handlers required
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse(null, { status: 200 });
}
