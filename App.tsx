import {AppBootstrap} from './src/app/AppBootstrap';
import {AppProviders} from './src/app/AppProviders';

function App() {
  return (
    <AppProviders>
      <AppBootstrap />
    </AppProviders>
  );
}

export default App;
