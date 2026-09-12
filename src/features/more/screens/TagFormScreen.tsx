import {useEffect, useState} from 'react';

import {Alert, View} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {useRepos} from '../../../db/DatabaseProvider';
import {Button} from '../../../design/primitives/Button';
import {FormSection} from '../../../design/primitives/FormSection';
import {Input} from '../../../design/primitives/Input';
import {Pressable} from '../../../design/primitives/Pressable';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {MoreStackChrome} from '../components/MoreStackChrome';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function TagFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'TagForm'>>();
  const editId = route.params?.id;

  const palette = [
    theme.colors.chart.series1,
    theme.colors.chart.series2,
    theme.colors.chart.series3,
    theme.colors.chart.series4,
    theme.colors.chart.series5,
    theme.colors.chart.series6,
    theme.colors.accent.primary,
    theme.colors.semantic.info,
  ];

  const [name, setName] = useState('');
  const [color, setColor] = useState(theme.colors.chart.series1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) {
      return;
    }
    repos.tags
      .getById(editId)
      .then(row => {
        if (!row) {
          return;
        }
        setName(row.name);
        setColor(row.color);
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
        await repos.tags.update(editId, {name: name.trim(), color});
      } else {
        await repos.tags.create({name: name.trim(), color});
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
      <FormSection title={t('tagForm.color')}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {palette.map(swatch => (
            <Pressable
              key={swatch}
              accessibilityLabel={t('tagForm.colorA11y', {color: swatch})}
              onPress={() => setColor(swatch)}
              style={{
                width: theme.touchTarget,
                height: theme.touchTarget,
                borderRadius: theme.radius.full,
                backgroundColor: swatch,
                borderWidth: color === swatch ? 3 : 1,
                borderColor:
                  color === swatch
                    ? theme.colors.border.focus
                    : theme.colors.border.subtle,
              }}>
              <View />
            </Pressable>
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
          label={t('common.delete')}
          variant="danger"
          fullWidth
          onPress={() => {
            Alert.alert(t('tagForm.deleteTitle'), t('tagForm.deleteBody'), [
              {text: t('common.cancel'), style: 'cancel'},
              {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                  repos.tags
                    .delete(editId)
                    .then(() => {
                      hapticSuccess();
                      navigation.goBack();
                    })
                    .catch(() => hapticWarning());
                },
              },
            ]);
          }}
        />
      ) : null}
    </MoreStackChrome>
  );
}
