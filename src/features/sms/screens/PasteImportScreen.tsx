import {useState} from 'react';

import {ScrollView} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRepos} from '../../../db/DatabaseProvider';
import {processSmsMessage} from '../../../db/sms/processSms';
import {Button} from '../../../design/primitives/Button';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {hapticSuccess, hapticWarning} from '../../../lib/haptics';
import {useSmsReviewStore} from '../../../store/smsReviewStore';

/** iOS + Android paste fallback using the same SMS engine. */
export function PasteImportScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepos();
  const openReview = useSmsReviewStore(s => s.openReview);
  const [sender, setSender] = useState('PASTED');
  const [body, setBody] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onImport = async () => {
    if (!body.trim()) {
      hapticWarning();
      setFeedback(t('smsInbox.pasteEmpty'));
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const result = await processSmsMessage(repos, {
        sender: sender.trim() || 'PASTED',
        body: body.trim(),
        receivedAt: new Date().toISOString(),
        deferTransaction: true,
      });
      hapticSuccess();
      if (result.messageId) {
        openReview({
          messageId: result.messageId,
          sender: sender.trim() || 'PASTED',
          body: body.trim(),
          receivedAt: Date.now(),
        });
        setBody('');
        setFeedback(t('smsInbox.pasteQueued'));
      } else {
        setFeedback(
          result.reason
            ? `${result.status}: ${result.reason}`
            : result.status,
        );
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : t('smsInbox.importFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBackdrop>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: theme.space[4],
          paddingHorizontal: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[4],
        }}
        keyboardShouldPersistTaps="handled">
        <Text variant="body" color="secondary">
          {t('smsInbox.pasteBody')}
        </Text>
        {feedback ? (
          <FeedbackBanner
            message={feedback}
            tone="info"
            actionLabel={t('common.close')}
            onAction={() => setFeedback(null)}
          />
        ) : null}
        <Text variant="caption" color="secondary">
          {t('smsInbox.pasteReviewHint')}
        </Text>
        <Input
          label={t('smsInbox.pasteSender')}
          value={sender}
          onChangeText={setSender}
        />
        <Input
          label={t('smsInbox.pasteMessageLabel')}
          value={body}
          onChangeText={setBody}
          multiline
          style={{minHeight: 160}}
        />
        <Button
          label={saving ? t('common.saving') : t('smsInbox.pasteImport')}
          onPress={() => {
            onImport().catch(() => undefined);
          }}
          disabled={saving}
          fullWidth
        />
      </ScrollView>
    </ScreenBackdrop>
  );
}
