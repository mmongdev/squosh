const IMAGE_MIME_PATTERN = /^image\//;
const IMAGE_EXTENSION_PATTERN =
  /\.(avif|bmp|gif|ico|jpe?g|jxl|png|svg|tiff?|webp)$/i;

export function isImageFile(file: File): boolean {
  if (IMAGE_MIME_PATTERN.test(file.type)) return true;
  if (!file.type && IMAGE_EXTENSION_PATTERN.test(file.name)) return true;
  return false;
}

export function filterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(isImageFile);
}
