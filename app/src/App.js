import React, {Component} from 'react';
import LineChart from './components/LineChart';

class App extends Component {
  render() {
    const divStyle = {
      display: "block",
      height: "600px",
      width: "800px",
    }
    return (
      <LineChart/>
    );
  }
}
export default App;
