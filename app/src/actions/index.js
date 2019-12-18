import {entriesRef} from '../firebase';
import {FETCH_ENTRIES} from './types';

export const fetchEntries = () => async dispatch => {
  console.log('fetching');
  entriesRef.onSnapshot(querySnapshot => {
    console.log(querySnapshot.docs[0].data());
    dispatch({
      type: FETCH_ENTRIES,
      payload: querySnapshot.docs.map(doc => doc.data()),
    });
  });
};
