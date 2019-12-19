import {entriesRef} from '../firebase';
import {FETCH_ENTRIES} from './types';

export const fetchEntries = () => async dispatch => {
  console.log('fetching');
  entriesRef.onSnapshot(querySnapshot => {
    let entries = querySnapshot.docs.map(doc => doc.data());
    console.log('entries:');
    console.log(entries);
    entries.sort(function(a, b) {
      if (a.date < b.date) {
        return -1;
      } else if (a.date === b.date) {
        return 0;
      } else {
        return 1;
      }
    });
    let dataMap = {};
    entries.forEach(function (entry, i) {
      console.log(entry);
      if (dataMap[entry.name] === undefined) {
        dataMap[entry.name] = [];
      }
      dataMap[entry.name].push({ x: entry.date, y: entry.solveTime });
    });
    let lines = [];
    for (let key in dataMap) {
      lines.push({ id: key, color: "hsl(191, 70%, 50%)", data: dataMap[key] })
    }
    console.log('lines:');
    console.log(lines);
    const data = {
      entries: entries,
      lines: lines 
    };
    dispatch({
      type: FETCH_ENTRIES,
      payload: data
    });
  });
};
