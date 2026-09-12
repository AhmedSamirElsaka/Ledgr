import {useCallback, useState} from 'react';

import {Alert} from 'react-native';

import {useTheme} from '../../../design/theme/ThemeProvider';
import {hapticWarning} from '../../../lib/haptics';

import type {DatabaseRepos} from '../../../db/createRepos';
import type {TagRow} from '../../../db/repositories/tagsRepository';

export function useAddTransactionTags(repos: DatabaseRepos) {
  const {theme} = useTheme();
  const [tags, setTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  const refreshTags = useCallback(async () => {
    setTags(await repos.tags.list());
  }, [repos]);

  const nextTagColor = useCallback(() => {
    const palette = [
      theme.colors.chart.series1,
      theme.colors.chart.series2,
      theme.colors.chart.series3,
      theme.colors.chart.series4,
      theme.colors.chart.series5,
      theme.colors.chart.series6,
    ];
    return palette[tags.length % palette.length] ?? theme.colors.accent.primary;
  }, [tags.length, theme.colors.accent.primary, theme.colors.chart]);

  const onToggleTag = useCallback((id: string) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  }, []);

  const onCreateTag = useCallback(() => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      return;
    }
    repos.tags
      .create({name: trimmed, color: nextTagColor()})
      .then(created => {
        setNewTagName('');
        setSelectedTagIds(prev =>
          prev.includes(created.id) ? prev : [...prev, created.id],
        );
        return refreshTags();
      })
      .catch(err => {
        hapticWarning();
        Alert.alert(
          'Could not create tag',
          err instanceof Error ? err.message : String(err),
        );
      });
  }, [newTagName, nextTagColor, refreshTags, repos.tags]);

  return {
    tags,
    selectedTagIds,
    newTagName,
    setNewTagName,
    setSelectedTagIds,
    refreshTags,
    onToggleTag,
    onCreateTag,
  };
}
