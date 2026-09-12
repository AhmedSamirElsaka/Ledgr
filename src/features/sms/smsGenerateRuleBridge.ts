type GenerateRulePayload = {
  messageId?: string;
  body: string;
  sender: string;
};

type GenerateRuleHandler = (payload: GenerateRulePayload) => void;

let handler: GenerateRuleHandler | null = null;

/** Inbox screen registers while mounted so the review modal can open rule generation. */
export function registerSmsGenerateRuleHandler(
  next: GenerateRuleHandler | null,
): void {
  handler = next;
}

export function requestSmsGenerateRule(payload: GenerateRulePayload): boolean {
  if (!handler) {
    return false;
  }
  handler(payload);
  return true;
}
