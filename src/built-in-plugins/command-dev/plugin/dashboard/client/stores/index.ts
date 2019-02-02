import { combineStores } from 'dob';

import { ApplciationStore, ApplicationAction } from './application';

export default combineStores({
  ApplicationAction,
  ApplciationStore
});
