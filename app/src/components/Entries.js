import React, {Component} from 'react';
import {connect} from 'react-redux';
import _ from 'lodash';
import * as actions from '../actions';
import Entry from './Entry';

class Entries extends Component {
  renderEntry() {
    const {data} = this.props;
    const entries = _.map(data.entries, (value, key) => {
      return <Entry key={key} entryId={key} entry={value} />;
    });
    if (!_.isEmpty(entries)) {
      return entries;
    }
    return (
      <div>
        <h4>no things!</h4>
      </div>
    );
  }
  constructor(props) {
    super(props);
    props.fetchEntries();
  }
  render() {
    return (
      <div>
        <div>
          {this.renderEntry()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({data}) => {
  return {
    data
  }
}

export default connect(mapStateToProps, actions)(Entries);
