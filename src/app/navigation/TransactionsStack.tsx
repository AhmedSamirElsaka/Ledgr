import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {
  AddTransactionScreen,
  TransactionsScreen,
} from '../../features/transactions';

import type {TransactionsStackParamList} from './types';

const TransactionsStack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsStackNavigator() {
  return (
    <TransactionsStack.Navigator
      screenOptions={{headerShown: false, freezeOnBlur: true, animation: 'fade'}}>
      <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TransactionsStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{presentation: 'modal', animation: 'slide_from_bottom'}}
      />
    </TransactionsStack.Navigator>
  );
}
