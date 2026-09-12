import {useMemo, useState} from 'react';

import {endOfDay, format, isValid, parse, startOfDay} from 'date-fns';
import {useTranslation} from 'react-i18next';

import {periodLastDays, type SmsImportPeriod} from '../../../lib/smsAndroid';

export type PeriodChoice = {
  id: string;
  days: number;
};

export const SMS_INBOX_PERIOD_CHOICES: PeriodChoice[] = [
  {id: '7', days: 7},
  {id: '14', days: 14},
  {id: '30', days: 30},
  {id: '90', days: 90},
  {id: '180', days: 180},
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseYmd(value: string): Date | null {
  if (!DATE_RE.test(value.trim())) {
    return null;
  }
  const parsed = parse(value.trim(), 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
}

export function useSmsInboxPeriod() {
  const {t} = useTranslation();
  const [periodId, setPeriodId] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [fromError, setFromError] = useState<string | undefined>();
  const [toError, setToError] = useState<string | undefined>();

  const isCustom = periodId === 'custom';

  const selectedPeriod = useMemo((): SmsImportPeriod | null => {
    if (!isCustom) {
      const found = SMS_INBOX_PERIOD_CHOICES.find(option => option.id === periodId);
      return periodLastDays(found?.days ?? 30);
    }
    const fromDate = parseYmd(customFrom);
    const toDate = parseYmd(customTo);
    if (!fromDate || !toDate) {
      return null;
    }
    const minDateMs = startOfDay(fromDate).getTime();
    const maxDateMs = endOfDay(toDate).getTime();
    if (minDateMs > maxDateMs) {
      return null;
    }
    return {minDateMs, maxDateMs};
  }, [periodId, isCustom, customFrom, customTo]);

  const periodSummary = useMemo(() => {
    if (!selectedPeriod) {
      return isCustom ? t('smsInbox.enterValidDates') : '';
    }
    const start = new Date(selectedPeriod.minDateMs);
    const end = new Date(selectedPeriod.maxDateMs ?? Date.now());
    return `${format(start, 'd MMM yyyy')} → ${format(end, 'd MMM yyyy')}`;
  }, [selectedPeriod, isCustom, t]);

  const validateCustomDates = (): boolean => {
    if (!isCustom) {
      setFromError(undefined);
      setToError(undefined);
      return true;
    }
    let ok = true;
    const fromDate = parseYmd(customFrom);
    const toDate = parseYmd(customTo);
    if (!fromDate) {
      setFromError(t('smsInbox.dateFormatError'));
      ok = false;
    } else {
      setFromError(undefined);
    }
    if (!toDate) {
      setToError(t('smsInbox.dateFormatError'));
      ok = false;
    } else {
      setToError(undefined);
    }
    if (fromDate && toDate && startOfDay(fromDate).getTime() > endOfDay(toDate).getTime()) {
      setToError(t('smsInbox.dateOrderError'));
      ok = false;
    }
    return ok;
  };

  return {
    periodId,
    setPeriodId,
    isCustom,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    fromError,
    toError,
    selectedPeriod,
    periodSummary,
    validateCustomDates,
  };
}
