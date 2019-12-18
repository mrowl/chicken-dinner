import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import { LineChart as RLineChart, Line, XAxis, YAxis } from 'recharts';

class LineChart extends Component {
  getter = (entry) => {
    if (entry.name === 'scotts') {
      return entry.solveTime;
    }
    return null;
  }

  renderLineChart() {
    const {data} = this.props;
    return (
      <RLineChart width={400} height={400} data={data}>
        <XAxis dataKey="date" />
        <YAxis dataKey="solveTime" />
        <Line type="monotone" dataKey={this.getter} stroke="#8884d8" />
      </RLineChart>
    );
  }

  render() {
    return (
      <div>
        <div>
          {this.renderLineChart()}
        </div>
      </div>
    );
  }
};

const mapStateToProps = ({data}) => {
  return {
    data
  }
}

export default connect(mapStateToProps, actions)(LineChart);
