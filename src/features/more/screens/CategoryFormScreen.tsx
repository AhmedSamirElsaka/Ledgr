import {useEffect, useState} from 'react';

import {Alert, View} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {Button} from '../../../design/primitives/Button';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {MoreStackChrome} from '../components/MoreStackChrome';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {CategoryKind} from '../../../db/repositories/categoriesRepository';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function CategoryFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'CategoryForm'>>();
  const editId = route.params?.id;

  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) {
      return;
    }
    repos.categories
      .getById(editId)
      .then(row => {
        if (!row) {
          return;
        }
        setName(row.name);
        setKind(row.kind);
      })
      .catch(() => undefined);
  }, [editId, repos]);

  const onSave = async () => {
    if (!name.trim()) {
      hapticWarning();
      Alert.alert(t('common.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await repos.categories.update(editId, {name: name.trim(), kind});
      } else {
        await repos.categories.create({
          name: name.trim(),
          kind,
          icon: 'Ellipsis',
          color: theme.colors.accent.primary,
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
        <Input label={t('common.name')} value={name} onChangeText={setName} />
      </FormSection>
      <FormSection title={t('categoryForm.kind')}>
        <View style={{flexDirection: 'row', gap: theme.space[2]}}>
          {([
            {key: 'expense' as const, label: t('categoriesScreen.kindExpense')},
            {key: 'income' as const, label: t('categoriesScreen.kindIncome')},
          ]).map(option => (
            <Button
              key={option.key}
              label={option.label}
              variant={kind === option.key ? 'primary' : 'secondary'}
              onPress={() => setKind(option.key)}
            />
          ))}
        </View>
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
              t('categoriesScreen.archiveTitle'),
              t('categoriesScreen.archiveBody', {
                name: name || t('nav.category'),
              }),
              [
                {text: t('common.cancel'), style: 'cancel'},
                {
                  text: t('common.archive'),
                  style: 'destructive',
                  onPress: () => {
                    repos.categories
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
