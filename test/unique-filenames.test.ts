import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uniqueFilenames } from '../src/shared/util/unique-filenames';

test('uniqueFilenames leaves unique names unchanged', () => {
  assert.deepEqual(uniqueFilenames(['a.jpg', 'b.png']), ['a.jpg', 'b.png']);
});

test('uniqueFilenames deduplicates colliding names', () => {
  assert.deepEqual(uniqueFilenames(['photo.jpg', 'photo.jpg', 'photo.jpg']), [
    'photo.jpg',
    'photo-2.jpg',
    'photo-3.jpg',
  ]);
});

test('uniqueFilenames handles names without extensions', () => {
  assert.deepEqual(uniqueFilenames(['image', 'image']), ['image', 'image-2']);
});
