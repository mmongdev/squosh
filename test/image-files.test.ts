import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isImageFile, filterImageFiles } from '../src/shared/util/image-files';

test('isImageFile accepts image mime types', () => {
  assert.equal(isImageFile(new File([], 'photo.jpg', { type: 'image/jpeg' })), true);
  assert.equal(isImageFile(new File([], 'photo.webp', { type: 'image/webp' })), true);
});

test('isImageFile accepts extension when mime is empty', () => {
  assert.equal(isImageFile(new File([], 'photo.jpg', { type: '' })), true);
  assert.equal(isImageFile(new File([], 'icon.svg', { type: '' })), true);
});

test('isImageFile rejects non-images', () => {
  assert.equal(isImageFile(new File([], 'notes.txt', { type: 'text/plain' })), false);
  assert.equal(isImageFile(new File([], 'data.json', { type: '' })), false);
});

test('filterImageFiles keeps only images', () => {
  const files = [
    new File([], 'a.png', { type: 'image/png' }),
    new File([], 'b.txt', { type: 'text/plain' }),
    new File([], 'c.webp', { type: 'image/webp' }),
  ];
  const filtered = filterImageFiles(files);
  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].name, 'a.png');
  assert.equal(filtered[1].name, 'c.webp');
});
