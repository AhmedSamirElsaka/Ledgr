import {trigger} from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/** Light confirmation — use on successful commits only. */
export function hapticSuccess(): void {
  try {
    trigger('notificationSuccess', options);
  } catch {
    // Haptics unavailable on some hosts / Jest.
  }
}

export function hapticImpact(): void {
  try {
    trigger('impactMedium', options);
  } catch {
    // no-op
  }
}

export function hapticWarning(): void {
  try {
    trigger('notificationWarning', options);
  } catch {
    // no-op
  }
}
