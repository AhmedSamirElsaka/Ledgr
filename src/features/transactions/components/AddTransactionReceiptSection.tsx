import {Alert, Image, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {absoluteReceiptPath} from '../../../db/receipts/receiptStorage';
import {Button} from '../../../design/primitives/Button';
import {FormSection} from '../../../design/primitives/FormSection';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  isReceiptPickerAvailable,
  pickReceiptImage,
} from '../../../native/receiptPicker';

import type {ReceiptDraft} from '../hooks/useReceiptDraft';

type AddTransactionReceiptSectionProps = {
  draft: ReceiptDraft;
  onChange: (draft: ReceiptDraft) => void;
};

export function AddTransactionReceiptSection({
  draft,
  onChange,
}: AddTransactionReceiptSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const previewUri = (() => {
    if (draft.removed) {
      return null;
    }
    if (draft.pendingSourceUri) {
      return draft.pendingSourceUri;
    }
    if (draft.storedRelativePath) {
      return `file://${absoluteReceiptPath(draft.storedRelativePath)}`;
    }
    return null;
  })();

  const hasReceipt = previewUri != null;

  const onAttach = async () => {
    if (!isReceiptPickerAvailable()) {
      Alert.alert(t('add.receiptUnavailableTitle'), t('add.receiptUnavailableBody'));
      return;
    }
    try {
      const picked = await pickReceiptImage();
      if (!picked) {
        return;
      }
      onChange({
        ...draft,
        pendingSourceUri: picked.uri,
        pendingMimeType: picked.mimeType,
        removed: false,
      });
    } catch (error) {
      Alert.alert(
        t('add.receiptPickFailed'),
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const onRemove = () => {
    onChange({
      storedRelativePath: draft.storedRelativePath,
      pendingSourceUri: null,
      pendingMimeType: null,
      removed: true,
    });
  };

  return (
    <FormSection title={t('add.receiptTitle')} description={t('add.receiptDescription')}>
      {hasReceipt && previewUri ? (
        <View style={{gap: theme.space[3]}}>
          <Image
            source={{uri: previewUri}}
            accessibilityLabel={t('add.receiptPreviewA11y')}
            style={{
              width: '100%',
              height: theme.space[16] * 2 + theme.space[12],
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface.sunken,
            }}
            resizeMode="cover"
          />
          <View style={{flexDirection: 'row', gap: theme.space[2]}}>
            <View style={{flex: 1}}>
              <Button
                label={t('add.receiptReplace')}
                variant="secondary"
                onPress={() => {
                  onAttach().catch(() => undefined);
                }}
              />
            </View>
            <View style={{flex: 1}}>
              <Button label={t('add.receiptRemove')} variant="danger" onPress={onRemove} />
            </View>
          </View>
        </View>
      ) : (
        <View style={{gap: theme.space[2]}}>
          <Button
            label={t('add.receiptAttach')}
            variant="secondary"
            onPress={() => {
              onAttach().catch(() => undefined);
            }}
          />
          <Text variant="caption" color="tertiary">
            {t('add.receiptPrivateHint')}
          </Text>
        </View>
      )}
    </FormSection>
  );
}
