import {create} from 'zustand';

export type SmsReviewAutoAction = 'track' | 'ignore' | 'review';

export type SmsReviewPayload = {
  /** When set, save/ignore updates this sms_messages row instead of inserting. */
  messageId?: string;
  sender: string;
  body: string;
  receivedAt: number;
  /** Optional action requested from notification shade. */
  autoAction?: SmsReviewAutoAction;
};

type SmsReviewState = {
  current: SmsReviewPayload | null;
  queue: SmsReviewPayload[];
  openReview: (payload: SmsReviewPayload) => void;
  dismissCurrent: () => void;
  clearAutoAction: () => void;
};

function reviewKey(payload: SmsReviewPayload): string {
  if (payload.messageId) {
    return `id:${payload.messageId}`;
  }
  return `${payload.sender}\0${payload.body}\0${payload.receivedAt}`;
}

export const useSmsReviewStore = create<SmsReviewState>((set, get) => ({
  current: null,
  queue: [],
  openReview: payload => {
    const {current, queue} = get();
    const key = reviewKey(payload);
    if (current && reviewKey(current) === key) {
      // Prefer a stronger auto-action if the same SMS arrives again.
      if (payload.autoAction && payload.autoAction !== current.autoAction) {
        set({current: {...current, autoAction: payload.autoAction}});
      }
      return;
    }
    if (queue.some(item => reviewKey(item) === key)) {
      return;
    }
    if (current) {
      set({queue: [...queue, payload]});
      return;
    }
    set({current: payload});
  },
  dismissCurrent: () => {
    const {queue} = get();
    const [next, ...rest] = queue;
    set({current: next ?? null, queue: rest});
  },
  clearAutoAction: () => {
    const {current} = get();
    if (!current?.autoAction) {
      return;
    }
    set({current: {...current, autoAction: undefined}});
  },
}));
