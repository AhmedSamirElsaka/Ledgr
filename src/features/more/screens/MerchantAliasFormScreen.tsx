import {useEffect, useState} from 'react';

import {Alert} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {Button} from '../../../design/primitives/Button';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {MoreStackChrome} from '../components/MoreStackChrome';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function MerchantAliasFormScreen() {
  const {t} = useTranslation();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'MerchantAliasForm'>>();
  const editId = route.params?.id;

  const [rawMerchant, setRawMerchant] = useState('');
  const [displayMerchant, setDisplayMerchant] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) {
      return;
    }
    repos.merchantAliases
      .getById(editId)
      .then(row => {
        if (!row) {
          return;
        }
        setRawMerchant(row.raw_merchant);
        setDisplayMerchant(row.display_merchant);
      })
      .catch(() => undefined);
  }, [editId, repos]);

  const onSave = async () => {
    if (!rawMerchant.trim() || !displayMerchant.trim()) {
      hapticWarning();
      Alert.alert(t('merchantAliasForm.bothRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await repos.merchantAliases.update(editId, {
          rawMerchant: rawMerchant.trim(),
          displayMerchant: displayMerchant.trim(),
        });
      } else {
        await repos.merchantAliases.create({
          rawMerchant: rawMerchant.trim(),
          displayMerchant: displayMerchant.trim(),
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
      <FormSection title={t('merchantAliasForm.rawLabel')}>
        <Input
          label={t('merchantAliasForm.rawLabel')}
          value={rawMerchant}
          onChangeText={setRawMerchant}
          autoCapitalize="characters"
          placeholder={t('merchantAliasForm.rawPlaceholder')}
        />
      </FormSection>
      <FormSection title={t('merchantAliasForm.displayLabel')}>
        <Input
          label={t('merchantAliasForm.displayLabel')}
          value={displayMerchant}
          onChangeText={setDisplayMerchant}
          autoCapitalize="words"
          placeholder={t('merchantAliasForm.displayPlaceholder')}
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
          label={t('common.delete')}
          variant="danger"
          fullWidth
          onPress={() => {
            Alert.alert(
              t('merchantAliasForm.deleteTitle'),
              t('merchantAliasForm.deleteBody'),
              [
                {text: t('common.cancel'), style: 'cancel'},
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () => {
                    repos.merchantAliases
                      .delete(editId)
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
