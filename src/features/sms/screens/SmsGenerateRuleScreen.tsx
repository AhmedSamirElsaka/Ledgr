import {useMemo, useState} from 'react';

import {Alert, ScrollView} from 'react-native';

import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {suggestRuleFromBody} from '../../../domain/sms/ruleEngine';
import {hapticSuccess} from '../../../lib/haptics';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function SmsGenerateRuleScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'SmsGenerateRule'>>();
  const body = route.params?.body ?? '';
  const sender = route.params?.sender ?? '/.*/i';

  const suggestion = useMemo(() => suggestRuleFromBody(body), [body]);
  const [name, setName] = useState(suggestion.name);
  const [senderPattern, setSenderPattern] = useState(
    sender.length > 0 && sender !== '/.*/i' ? sender : '/.*/i',
  );

  const onCreate = async () => {
    await repos.smsRules.create({
      name,
      senderPattern,
      bodyRegex: suggestion.bodyRegex,
      captureMap: suggestion.captureMap,
      priority: 50,
      enabled: true,
    });
    if (route.params?.messageId) {
      await repos.smsMessages.updateStatus(route.params.messageId, 'ignored');
    }
    hapticSuccess();
    Alert.alert(t('smsGenerateRule.created'));
    navigation.navigate('SmsRules');
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
        <Card>
          <Text variant="label" color="tertiary">
            {t('smsGenerateRule.messageLabel')}
          </Text>
          <Text variant="body" style={{marginTop: theme.space[2]}}>
            {body}
          </Text>
        </Card>
        <Input
          label={t('smsGenerateRule.ruleName')}
          value={name}
          onChangeText={setName}
        />
        <Input
          label={t('smsGenerateRule.senderPattern')}
          value={senderPattern}
          onChangeText={setSenderPattern}
        />
        <Card>
          <Text variant="label" color="tertiary">
            {t('smsGenerateRule.generatedRegex')}
          </Text>
          <Text variant="caption" style={{marginTop: theme.space[2]}}>
            {suggestion.bodyRegex}
          </Text>
          <Text variant="caption" color="secondary" style={{marginTop: theme.space[2]}}>
            {JSON.stringify(suggestion.captureMap)}
          </Text>
        </Card>
        <Button
          label={t('smsGenerateRule.create')}
          onPress={() => {
            onCreate().catch(() => undefined);
          }}
          fullWidth
        />
      </ScrollView>
    </ScreenBackdrop>
  );
}
