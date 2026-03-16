import { WebClient } from '@slack/web-api';

let _client: WebClient | null = null;

export function getSlackClient(): WebClient {
  if (!_client) {
    _client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }
  return _client;
}
