import test from 'ava';
import { getDefault } from '../../utils/es-module';

test('getDefault', t => {
  t.true(getDefault({ default: 5 }) === 5);
  t.true(getDefault(5) === 5);

  const obj = { x: 1, y: 2 };
  t.true(getDefault({ default: obj }) === obj);
  t.true(getDefault(obj) === obj);
});
