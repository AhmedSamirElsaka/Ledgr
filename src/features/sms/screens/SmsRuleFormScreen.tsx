import {useEffect, useState} from 'react';

import {Alert, ScrollView} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {parseCaptureMapJson, type SmsCaptureMap} from '../../../domain/sms/ruleEngine';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function SmsRuleFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'SmsRuleForm'>>();
  const editId = route.params?.id;

  const [name, setName] = useState('');
  const [senderPattern, setSenderPattern] = useState('/.*/i');
  const [bodyRegex, setBodyRegex] = useState('');
  const [captureJson, setCaptureJson] = useState('{"amount":"amount","merchant":"merchant"}');
  const [priority, setPriority] = useState('100');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!editId) {
      return;
    }
    repos.smsRules
      .getById(editId)
      .then(row => {
        if (!row) {
          return;
        }
        setName(row.name);
        setSenderPattern(row.sender_pattern);
        setBodyRegex(row.body_regex);
        setCaptureJson(row.capture_map_json);
        setPriority(String(row.priority));
        setEnabled(row.enabled === 1);
      })
      .catch(() => undefined);
  }, [editId, repos]);

  const onSave = async () => {
    if (!name.trim() || !bodyRegex.trim()) {
      hapticWarning();
      Alert.alert(t('smsRuleForm.validationRequired'));
      return;
    }
    let captureMap: SmsCaptureMap;
    try {
      captureMap = parseCaptureMapJson(captureJson);
    } catch {
      hapticWarning();
      Alert.alert(t('smsRuleForm.invalidCaptureMap'));
      return;
    }
    const pri = Number(priority) || 100;
    if (editId) {
      await repos.smsRules.update(editId, {
        name: name.trim(),
        senderPattern,
        bodyRegex,
        captureMap,
        priority: pri,
        enabled,
      });
    } else {
      await repos.smsRules.create({
        name: name.trim(),
        senderPattern,
        bodyRegex,
        captureMap,
        priority: pri,
        enabled,
      });
    }
    hapticSuccess();
    navigation.goBack();
  };

  return (
    <ScreenBackdrop washHeight={220}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[3],
        }}
        keyboardShouldPersistTaps="handled">
        <Input label={t('smsRuleForm.name')} value={name} onChangeText={setName} />
        <Input
          label={t('smsRuleForm.senderPattern')}
          value={senderPattern}
          onChangeText={setSenderPattern}
        />
        <Input
          label={t('smsRuleForm.bodyRegex')}
          value={bodyRegex}
          onChangeText={setBodyRegex}
          multiline
          style={{minHeight: theme.space[16] + theme.space[10]}}
        />
        <Input
          label={t('smsRuleForm.captureMap')}
          value={captureJson}
          onChangeText={setCaptureJson}
          multiline
        />
        <Input
          label={t('smsRuleForm.priority')}
          value={priority}
          onChangeText={setPriority}
          keyboardType="number-pad"
        />
        <Button
          label={enabled ? t('smsRuleForm.enabled') : t('smsRuleForm.disabled')}
          variant={enabled ? 'primary' : 'secondary'}
          onPress={() => setEnabled(v => !v)}
          fullWidth
        />
        <Button
          label={t('common.save')}
          onPress={() => {
            onSave().catch(() => undefined);
          }}
          fullWidth
        />
        {editId ? (
          <Button
            label={t('common.delete')}
            variant="secondary"
            onPress={() => {
              Alert.alert(t('smsRuleForm.deleteTitle'), undefined, [
                {text: t('common.cancel'), style: 'cancel'},
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () => {
                    repos.smsRules
                      .remove(editId)
                      .then(() => navigation.goBack())
                      .catch(() => undefined);
                  },
                },
              ]);
            }}
            fullWidth
          />
        ) : null}
        <Text variant="caption" color="tertiary">
          {t('smsRuleForm.hint')}
        </Text>
      </ScrollView>
    </ScreenBackdrop>
  );
}
