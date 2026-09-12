import {useNavigation, useRoute} from '@react-navigation/native';

import {useRepos} from '../../../db/DatabaseProvider';

import {SUBSCRIPTION_CYCLES} from './subscriptionFormUtils';
import {useSubscriptionFormActions} from './useSubscriptionFormActions';
import {useSubscriptionFormLoad} from './useSubscriptionFormLoad';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function useSubscriptionFormScreen() {
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'SubscriptionForm'>>();
  const editId = route.params?.id;

  const load = useSubscriptionFormLoad(repos, editId);
  const actions = useSubscriptionFormActions({
    repos,
    navigation,
    editId,
    name: load.name,
    amountText: load.amountText,
    currency: load.currency,
    cycle: load.cycle,
    customDays: load.customDays,
    reminderDays: load.reminderDays,
    nextDue: load.nextDue,
  });

  return {
    editId,
    name: load.name,
    setName: load.setName,
    amountText: load.amountText,
    setAmountText: load.setAmountText,
    cycle: load.cycle,
    setCycle: load.setCycle,
    customDays: load.customDays,
    setCustomDays: load.setCustomDays,
    reminderDays: load.reminderDays,
    setReminderDays: load.setReminderDays,
    nextDue: load.nextDue,
    setNextDue: load.setNextDue,
    onSave: actions.onSave,
    onCancel: actions.onCancel,
    cycles: SUBSCRIPTION_CYCLES,
  };
}
