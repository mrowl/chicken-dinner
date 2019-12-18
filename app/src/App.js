import React, {Component} from 'react';
import Entries from './components/Entries';
import LineChart from './components/LineChart';

class App extends Component {
  render() {
    return (
      <div>
        <LineChart/>
        <Entries/>
      </div>
    );
  }
}
export default App;
