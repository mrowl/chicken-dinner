import {FETCH_ENTRIES} from '../actions/types';

export default (state = {}, action) => {
  switch(action.type) {
    case FETCH_ENTRIES:
      return action.payload;
    default:
      return state;
  }
};
