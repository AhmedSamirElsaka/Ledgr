import {useCallback, useMemo, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {
  cancelDailyReminder,
  getNotificationSettings,
  scheduleDailyReminder,
  setLockScreenDetailsEnabled,
  setQuietHoursEnabled,
  setQuietHoursRange,
  setSubscriptionRemindersEnabled,
  syncDailyReminderFromPrefs,
  type ClockTime,
} from '../../../lib/notifications';

function clockFromFields(hourText: string, minuteText: string, fallback: ClockTime): ClockTime {
  const hour = Number(hourText);
  const minute = Number(minuteText);
  return {
    hour: Number.isFinite(hour) ? hour : fallback.hour,
    minute: Number.isFinite(minute) ? minute : fallback.minute,
  };
}

export function useNotificationsSettingsScreen() {
  const {t} = useTranslation();
  const initial = useMemo(() => getNotificationSettings(), []);
  const [dailyEnabled, setDailyEnabled] = useState(initial.dailyEnabled);
  const [hour, setHour] = useState(String(initial.dailyTime.hour));
  const [minute, setMinute] = useState(String(initial.dailyTime.minute));
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(
    initial.subscriptionRemindersEnabled,
  );
  const [quietEnabled, setQuietEnabled] = useState(initial.quietHoursEnabled);
  const [quietStartHour, setQuietStartHour] = useState(
    String(initial.quietHoursStart.hour),
  );
  const [quietStartMinute, setQuietStartMinute] = useState(
    String(initial.quietHoursStart.minute),
  );
  const [quietEndHour, setQuietEndHour] = useState(
    String(initial.quietHoursEnd.hour),
  );
  const [quietEndMinute, setQuietEndMinute] = useState(
    String(initial.quietHoursEnd.minute),
  );
  const [lockScreenDetailsEnabled, setLockScreenDetails] = useState(
    initial.lockScreenDetailsEnabled,
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onToggleDaily = useCallback(() => {
    const next = !dailyEnabled;
    setBusy(true);
    setFeedback(null);
    const run = async () => {
      if (next) {
        const time = clockFromFields(hour, minute, initial.dailyTime);
        await scheduleDailyReminder(time.hour, time.minute);
        setDailyEnabled(true);
        setFeedback(t('notifications.dailyOn'));
        hapticSuccess();
      } else {
        await cancelDailyReminder();
        setDailyEnabled(false);
        setFeedback(t('notifications.dailyOff'));
        hapticSuccess();
      }
    };
    run()
      .catch(() => {
        hapticWarning();
        setFeedback(t('notifications.saveFailed'));
      })
      .finally(() => setBusy(false));
  }, [dailyEnabled, hour, minute, initial.dailyTime, t]);

  const onSaveDailyTime = useCallback(() => {
    if (!dailyEnabled) {
      Alert.alert(t('notifications.enableDailyFirst'));
      return;
    }
    setBusy(true);
    setFeedback(null);
    const time = clockFromFields(hour, minute, initial.dailyTime);
    scheduleDailyReminder(time.hour, time.minute)
      .then(() => {
        setFeedback(t('notifications.dailySaved'));
        hapticSuccess();
      })
      .catch(() => {
        hapticWarning();
        setFeedback(t('notifications.saveFailed'));
      })
      .finally(() => setBusy(false));
  }, [dailyEnabled, hour, minute, initial.dailyTime, t]);

  const onToggleSubscriptions = useCallback(() => {
    const next = !subscriptionEnabled;
    setSubscriptionRemindersEnabled(next);
    setSubscriptionEnabled(next);
    setFeedback(
      next
        ? t('notifications.subscriptionsOn')
        : t('notifications.subscriptionsOff'),
    );
    hapticSuccess();
  }, [subscriptionEnabled, t]);

  const onToggleQuiet = useCallback(() => {
    const next = !quietEnabled;
    setQuietHoursEnabled(next);
    setQuietEnabled(next);
    setBusy(true);
    syncDailyReminderFromPrefs()
      .then(() => {
        setFeedback(
          next ? t('notifications.quietOn') : t('notifications.quietOff'),
        );
        hapticSuccess();
      })
      .catch(() => {
        hapticWarning();
        setFeedback(t('notifications.saveFailed'));
      })
      .finally(() => setBusy(false));
  }, [quietEnabled, t]);

  const onSaveQuietHours = useCallback(() => {
    const start = clockFromFields(
      quietStartHour,
      quietStartMinute,
      initial.quietHoursStart,
    );
    const end = clockFromFields(
      quietEndHour,
      quietEndMinute,
      initial.quietHoursEnd,
    );
    setQuietHoursRange(start, end);
    setBusy(true);
    syncDailyReminderFromPrefs()
      .then(() => {
        setFeedback(t('notifications.quietSaved'));
        hapticSuccess();
      })
      .catch(() => {
        hapticWarning();
        setFeedback(t('notifications.saveFailed'));
      })
      .finally(() => setBusy(false));
  }, [
    quietStartHour,
    quietStartMinute,
    quietEndHour,
    quietEndMinute,
    initial.quietHoursStart,
    initial.quietHoursEnd,
    t,
  ]);

  const onToggleLockScreenDetails = useCallback(() => {
    const next = !lockScreenDetailsEnabled;
    setBusy(true);
    setFeedback(null);
    setLockScreenDetailsEnabled(next)
      .then(async () => {
        setLockScreenDetails(next);
        if (dailyEnabled) {
          await syncDailyReminderFromPrefs();
        }
        setFeedback(
          next
            ? t('notifications.lockScreenDetailsOn')
            : t('notifications.lockScreenDetailsOff'),
        );
        hapticSuccess();
      })
      .catch(() => {
        hapticWarning();
        setFeedback(t('notifications.saveFailed'));
      })
      .finally(() => setBusy(false));
  }, [lockScreenDetailsEnabled, dailyEnabled, t]);

  return {
    dailyEnabled,
    hour,
    setHour,
    minute,
    setMinute,
    subscriptionEnabled,
    quietEnabled,
    quietStartHour,
    setQuietStartHour,
    quietStartMinute,
    setQuietStartMinute,
    quietEndHour,
    setQuietEndHour,
    quietEndMinute,
    setQuietEndMinute,
    lockScreenDetailsEnabled,
    busy,
    feedback,
    dismissFeedback: () => setFeedback(null),
    onToggleDaily,
    onSaveDailyTime,
    onToggleSubscriptions,
    onToggleQuiet,
    onSaveQuietHours,
    onToggleLockScreenDetails,
  };
}
