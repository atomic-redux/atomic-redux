import { AtomicReduxDevtools } from 'atomic-redux-devtools';
import './App.css';
import CounterContainer from './features/counter/CounterContainer';
import logo from './logo.svg';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <CounterContainer />
        <AtomicReduxDevtools />
      </header>
    </div>
  );
}

export default App;
