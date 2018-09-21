import { getDefault } from '../../utils/es-module';

test('getDefault', () => {
  expect(getDefault({ default: 5 })).toBe(5);
  expect(getDefault(5)).toBe(5);

  const obj = { x: 1, y: 2 };
  expect(getDefault({ default: obj })).toBe(obj);
  expect(getDefault(obj)).toBe(obj);
});
