import React, {Component} from 'react';

class Entry extends Component {
  render() {
    const {entry} = this.props;
    return (
      <div key="entry">
        <h4>
          {entry.name} - {entry.solveTime}
        </h4>
      </div>
    );
  }
}

export default Entry;
