import {useEffect, useState} from 'react';

import {Alert, View} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {Button} from '../../../design/primitives/Button';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  CURRENCIES,
  isCurrencyCode,
  majorToMinor,
  minorToMajor,
  type CurrencyCode,
} from '../../../domain/money/Money';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {MoreStackChrome} from '../components/MoreStackChrome';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {AccountType} from '../../../db/repositories/accountsRepository';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {TFunction} from 'i18next';

const TYPES: AccountType[] = ['cash', 'bank', 'card', 'wallet'];
const CODES = Object.keys(CURRENCIES) as CurrencyCode[];

function typeLabel(type: AccountType, t: TFunction): string {
  switch (type) {
    case 'cash':
      return t('accountsScreen.typeCash');
    case 'bank':
      return t('accountsScreen.typeBank');
    case 'card':
      return t('accountsScreen.typeCard');
    case 'wallet':
      return t('accountsScreen.typeWallet');
  }
}

export function AccountFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'AccountForm'>>();
  const editId = route.params?.id;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [opening, setOpening] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const base = (await repos.settings.get('base_currency')) ?? 'EGP';
      if (!editId) {
        setCurrency(isCurrencyCode(base) ? base : 'EGP');
        return;
      }
      const row = await repos.accounts.getById(editId);
      if (!row) {
        return;
      }
      const rowCurrency = isCurrencyCode(row.currency) ? row.currency : 'EGP';
      setName(row.name);
      setType(row.type);
      setCurrency(rowCurrency);
      setOpening(String(minorToMajor(row.opening_balance_minor, rowCurrency)));
    })().catch(() => undefined);
  }, [editId, repos]);

  const onSave = async () => {
    if (!name.trim()) {
      hapticWarning();
      Alert.alert(t('common.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const openingMinor = majorToMinor(Number(opening || '0'), currency);
      if (editId) {
        await repos.accounts.update(editId, {
          name: name.trim(),
          type,
          currency,
          openingBalanceMinor: openingMinor,
        });
      } else {
        await repos.accounts.create({
          name: name.trim(),
          type,
          currency,
          openingBalanceMinor: openingMinor,
          color: theme.colors.accent.primary,
          icon: type === 'cash' ? 'Wallet' : type === 'bank' ? 'Landmark' : 'CreditCard',
        });
      }
      hapticSuccess();
      navigation.goBack();
    } catch (err) {
      hapticWarning();
      Alert.alert(
        t('common.saveFailed'),
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MoreStackChrome>
      <FormSection title={t('common.name')}>
        <Input
          label={t('common.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('accountForm.namePlaceholder')}
        />
      </FormSection>
      <FormSection title={t('accountForm.type')}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {TYPES.map(accountType => (
            <Button
              key={accountType}
              label={typeLabel(accountType, t)}
              variant={type === accountType ? 'primary' : 'secondary'}
              onPress={() => setType(accountType)}
            />
          ))}
        </View>
      </FormSection>
      <FormSection title={t('accountForm.currency')}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {CODES.map(code => (
            <Button
              key={code}
              label={code}
              variant={currency === code ? 'primary' : 'secondary'}
              onPress={() => setCurrency(code)}
            />
          ))}
        </View>
      </FormSection>
      <FormSection title={t('accountForm.openingBalance')}>
        <Input
          label={t('accountForm.openingBalance')}
          value={opening}
          onChangeText={setOpening}
          keyboardType="decimal-pad"
        />
      </FormSection>
      <Button
        label={t('common.save')}
        fullWidth
        loading={saving}
        onPress={() => {
          onSave().catch(() => undefined);
        }}
      />
      {editId ? (
        <Button
          label={t('common.archive')}
          variant="danger"
          fullWidth
          onPress={() => {
            Alert.alert(
              t('accountsScreen.archiveTitle'),
              t('accountsScreen.archiveBody', {name: name || t('nav.account')}),
              [
                {text: t('common.cancel'), style: 'cancel'},
                {
                  text: t('common.archive'),
                  style: 'destructive',
                  onPress: () => {
                    repos.accounts
                      .archive(editId)
                      .then(() => {
                        hapticSuccess();
                        navigation.goBack();
                      })
                      .catch(() => hapticWarning());
                  },
                },
              ],
            );
          }}
        />
      ) : null}
    </MoreStackChrome>
  );
}
