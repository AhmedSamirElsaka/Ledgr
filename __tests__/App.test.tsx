/**
 * @format
 */

import React from 'react';

import {render} from '@testing-library/react-native';

import App from '../App';

test('renders the template app without crashing', async () => {
  const screen = await render(<App />);
  expect(screen.toJSON()).toBeTruthy();
});
