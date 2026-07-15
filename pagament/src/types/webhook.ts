export interface CreateWebhookRequest {
  name: string;
  endpoint: string;
  secret: string;
  events: string[];
}

export interface WebhookResponse {
  id: string;
  name: string;
  endpoint: string;
  events: string[];
  devMode: boolean;
  v2: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEventPayload {
  id: string;
  event: string;
  apiVersion: number;
  devMode: boolean;
  data: Record<string, unknown>;
}
