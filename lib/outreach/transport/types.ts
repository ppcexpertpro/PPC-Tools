export interface OutboundMessage {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string[];
}

export interface SendResult {
  rfcMessageId: string;
}

export interface Transport {
  verify(): Promise<void>;
  send(message: OutboundMessage): Promise<SendResult>;
}
