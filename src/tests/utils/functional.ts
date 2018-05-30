import test from 'ava';
import { ensureEndWithSlash, ensureStartWithWebpackRelativePoint, pipeEvent } from '../../utils/functional';

test('ensureEndWithSlash', t => {
  t.true(ensureEndWithSlash('/') === '/');
  t.true(ensureEndWithSlash('') === '/');
  t.true(ensureEndWithSlash('abc') === 'abc/');
  t.true(ensureEndWithSlash('abc/') === 'abc/');
  t.true(ensureEndWithSlash('abc/def') === 'abc/def/');
  t.true(ensureEndWithSlash('abc/def/') === 'abc/def/');
});

test('ensureStartWithWebpackRelativePoint', t => {
  t.true(ensureStartWithWebpackRelativePoint('') === './');
  t.true(ensureStartWithWebpackRelativePoint('src') === './src');
  t.true(ensureStartWithWebpackRelativePoint('./src') === './src');
  t.throws(() => {
    ensureStartWithWebpackRelativePoint('/src');
  });
});

test('pipeEvent', t => {
  const mockEventValue = {
    target: {
      value: 5
    }
  };

  const callback = (value: number) => {
    t.true(value === 5);
  };

  const mockTrigger = { onChange: pipeEvent(callback) };
  mockTrigger.onChange(mockEventValue);
});
