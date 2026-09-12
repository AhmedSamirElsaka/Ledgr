import {useMemo, useState} from 'react';

import {ScrollView} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {smsRuleRowToEngine} from '../../../db/repositories/smsRulesRepository';
import {processSmsMessage} from '../../../db/sms/processSms';
import {Button} from '../../../design/primitives/Button';
import {Card} from '../../../design/primitives/Card';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {classifySms} from '../../../domain/sms/classification';
import {matchSmsCandidates} from '../../../domain/sms/ruleEngine';
import {hapticSuccess} from '../../../lib/haptics';

export function SmsRuleTesterScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const [sender, setSender] = useState('BANK-ALERT');
  const [body, setBody] = useState(
    'Purchase of 150.00 EGP at COFFEE HOUSE on 10-Sep.',
  );
  const [preview, setPreview] = useState<string>(() => t('smsRuleTester.pasteToPreview'));
  const [rulesVersion, setRulesVersion] = useState(0);
  const [confirmImport, setConfirmImport] = useState(false);

  const runPreview = useMemo(
    () => async () => {
      const rows = await repos.smsRules.listEnabled();
      const rules = rows.map(smsRuleRowToEngine);
      const sms = {sender, body, receivedAt: new Date().toISOString()};
      const decision = classifySms(sms, rules);
      const candidates = matchSmsCandidates(sms, rules).slice(0, 5);
      const dash = '—';
      const lines = [
        t('smsRuleTester.classification', {value: decision.classification}),
        t('smsRuleTester.confidence', {
          value: decision.confidence,
          high: decision.highConfidence ? t('smsRuleTester.confidenceHigh') : '',
        }),
        t('smsRuleTester.source', {value: decision.parseSource}),
        t('smsRuleTester.reasons', {
          value: decision.reasons.join(', ') || dash,
        }),
        t('smsRuleTester.amount', {
          value: decision.match?.fields.amountMinor ?? dash,
        }),
        t('smsRuleTester.currency', {
          value: decision.match?.fields.currency ?? dash,
        }),
        t('smsRuleTester.merchant', {
          value: decision.match?.fields.merchant ?? dash,
        }),
        t('smsRuleTester.type', {value: decision.match?.fields.type ?? dash}),
        t('smsRuleTester.reference', {value: decision.reference ?? dash}),
        '',
        t('smsRuleTester.topCandidates'),
        ...(candidates.length === 0
          ? [t('smsRuleTester.none')]
          : candidates.map(c =>
              t('smsRuleTester.candidateLine', {
                name: c.rule.name,
                priority: c.rule.priority,
                score: c.fields.matchScore ?? 0,
                amount: c.fields.amountMinor ?? dash,
              }),
            )),
      ];
      setPreview(lines.join('\n'));
      setRulesVersion(v => v + 1);
      setConfirmImport(false);
    },
    [body, repos, sender, t],
  );

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
        <Input
          label={t('smsRuleTester.sender')}
          value={sender}
          onChangeText={setSender}
        />
        <Input
          label={t('smsRuleTester.body')}
          value={body}
          onChangeText={setBody}
          multiline
          style={{minHeight: theme.space[16] + theme.space[12]}}
        />
        <Button
          label={t('smsRuleTester.livePreview')}
          onPress={() => {
            runPreview().catch(() => undefined);
          }}
          fullWidth
        />
        <Card>
          <Text variant="label" color="tertiary">
            {t('smsRuleTester.previewLabel')}
            {rulesVersion > 0
              ? ` ${t('smsRuleTester.previewVersion', {version: rulesVersion})}`
              : ''}
          </Text>
          <Text variant="body" style={{marginTop: theme.space[2]}}>
            {preview}
          </Text>
        </Card>
        {!confirmImport ? (
          <Button
            label={t('smsRuleTester.queueSafe')}
            variant="secondary"
            onPress={() => {
              processSmsMessage(repos, {
                sender,
                body,
                receivedAt: new Date().toISOString(),
                deferTransaction: true,
              })
                .then(result => {
                  hapticSuccess();
                  setPreview(
                    t('smsRuleTester.queuedAs', {
                      status: result.status,
                      suffix: result.messageId
                        ? t('smsRuleTester.messageSuffix', {id: result.messageId})
                        : '',
                    }),
                  );
                })
                .catch(() => undefined);
            }}
            fullWidth
          />
        ) : null}
        <Button
          label={
            confirmImport
              ? t('smsRuleTester.confirmCreate')
              : t('smsRuleTester.advancedCreate')
          }
          variant={confirmImport ? 'primary' : 'ghost'}
          onPress={() => {
            if (!confirmImport) {
              setConfirmImport(true);
              setPreview(t('smsRuleTester.confirmHint'));
              return;
            }
            processSmsMessage(repos, {
              sender,
              body,
              receivedAt: new Date().toISOString(),
            })
              .then(result => {
                hapticSuccess();
                setPreview(
                  t('smsRuleTester.importedAs', {
                    status: result.status,
                    suffix: result.transactionId
                      ? t('smsRuleTester.txSuffix', {id: result.transactionId})
                      : '',
                  }),
                );
                setConfirmImport(false);
              })
              .catch(() => undefined);
          }}
          fullWidth
        />
        <Text variant="caption" color="tertiary">
          {t('smsRuleTester.footer')}
        </Text>
      </ScrollView>
    </ScreenBackdrop>
  );
}
