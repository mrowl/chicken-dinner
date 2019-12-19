import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import { ResponsiveLine } from '@nivo/line';

class LineChart extends Component {

  constructor(props) {
    super(props);
    props.fetchEntries();
  }

  renderLineChart() {
    console.log('renderLineChart');
    const {data} = this.props;
    console.log(data.lines);
    let hort = Array.from(data);
    console.log(hort);
    hort.map(d => console.log(d));

    return (
      <ResponsiveLine
        data={data.lines}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          orient: 'bottom',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'transportation',
          legendOffset: 36,
          legendPosition: 'middle'
        }}
        axisLeft={{
          orient: 'left',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'count',
          legendOffset: -40,
          legendPosition: 'middle'
        }}
        colors={{ scheme: 'nivo' }}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabel="y"
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1
                }
              }
            ]
          }
        ]}
      />
    );
  }

  componentDidMount() {
    this.render();
  }

  render() {
    const divStyle = {
      display: "block",
      height: "600px",
      width: "1200px",
    }
    const {data} = this.props;
    if (data.lines && data.lines.length > 0) {
      return (
        <div>
          <div style={divStyle}>
            {this.renderLineChart()}
          </div>
        </div>
      );
    } else {
      return (
        <div><span>loading...</span></div>
      );
    }
  }
};

const mapStateToProps = ({data}) => {
  return {
    data
  }
}

export default connect(mapStateToProps, actions)(LineChart);
