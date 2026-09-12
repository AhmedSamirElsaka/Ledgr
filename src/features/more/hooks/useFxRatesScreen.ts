import {useCallback, useState} from 'react';

import {Alert} from 'react-native';

import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {CURRENCIES, isCurrencyCode, type CurrencyCode} from '../../../domain/money/Money';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import {useMoreRepoList} from './useMoreRepoList';

import type {FxRateRow} from '../../../db/repositories/fxRatesRepository';

const TABLES = ['fx_rates', 'settings'] as const;
const CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function useFxRatesScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const [base, setBase] = useState<CurrencyCode>('EGP');
  const [quote, setQuote] = useState<CurrencyCode>('USD');
  const [rateText, setRateText] = useState('1');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const baseCur = (await repos.settings.get('base_currency')) ?? 'EGP';
    setBase(isCurrencyCode(baseCur) ? baseCur : 'EGP');
    return repos.fxRates.listAll();
  }, [repos]);

  const list = useMoreRepoList<FxRateRow>({load, tables: TABLES});

  const onSave = async () => {
    const rate = Number(rateText);
    if (!Number.isFinite(rate) || rate <= 0) {
      hapticWarning();
      Alert.alert(t('fxRatesScreen.positiveRate'));
      return;
    }
    if (quote === base) {
      hapticWarning();
      Alert.alert(t('fxRatesScreen.quoteMustDiffer'));
      return;
    }
    setSaving(true);
    try {
      await repos.fxRates.upsert({
        baseCurrency: base,
        quoteCurrency: quote,
        rate,
      });
      hapticSuccess();
      setRateText('1');
    } catch {
      hapticWarning();
      Alert.alert(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onRemove = (id: string) => {
    repos.fxRates
      .remove(id)
      .then(() => hapticSuccess())
      .catch(() => hapticWarning());
  };

  return {
    ...list,
    rates: list.items,
    base,
    quote,
    setQuote,
    rateText,
    setRateText,
    saving,
    codes: CODES,
    onSave,
    onRemove,
  };
}
