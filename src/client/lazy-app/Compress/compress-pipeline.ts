import {
  blobToImg,
  blobToText,
  builtinDecode,
  sniffMimeType,
  canDecodeImageType,
  abortable,
  assertSignal,
  ImageMimeTypes,
} from '../util';
import {
  PreprocessorState,
  ProcessorState,
  EncoderState,
  encoderMap,
} from '../feature-meta';
import WorkerBridge from '../worker-bridge';
import { resize } from 'features/processors/resize/client';
import { drawableToImageData } from '../util/canvas';

export interface SourceImage {
  file: File;
  decoded: ImageData;
  preprocessed: ImageData;
  vectorImage?: HTMLImageElement;
}

export async function decodeImage(
  signal: AbortSignal,
  blob: Blob,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  const mimeType = await abortable(signal, sniffMimeType(blob));
  const canDecode = await abortable(signal, canDecodeImageType(mimeType));

  try {
    if (!canDecode) {
      if (mimeType === 'image/avif') {
        return await workerBridge.avifDecode(signal, blob);
      }
      if (mimeType === 'image/webp') {
        return await workerBridge.webpDecode(signal, blob);
      }
      if (mimeType === 'image/jxl') {
        return await workerBridge.jxlDecode(signal, blob);
      }
      if (mimeType === 'image/webp2') {
        return await workerBridge.wp2Decode(signal, blob);
      }
      if (mimeType === 'image/qoi') {
        return await workerBridge.qoiDecode(signal, blob);
      }
    }
    return await builtinDecode(signal, blob);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.log(err);
    throw Error("Couldn't decode image");
  }
}

export async function preprocessImage(
  signal: AbortSignal,
  data: ImageData,
  preprocessorState: PreprocessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let processedData = data;

  if (preprocessorState.rotate.rotate !== 0) {
    processedData = await workerBridge.rotate(
      signal,
      processedData,
      preprocessorState.rotate,
    );
  }

  return processedData;
}

export async function processImage(
  signal: AbortSignal,
  source: SourceImage,
  processorState: ProcessorState,
  workerBridge: WorkerBridge,
): Promise<ImageData> {
  assertSignal(signal);
  let result = source.preprocessed;

  if (processorState.resize.enabled) {
    result = await resize(signal, source, processorState.resize, workerBridge);
  }
  if (processorState.quantize.enabled) {
    result = await workerBridge.quantize(
      signal,
      result,
      processorState.quantize,
    );
  }
  return result;
}

export async function compressImage(
  signal: AbortSignal,
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
  workerBridge: WorkerBridge,
): Promise<File> {
  assertSignal(signal);

  const encoder = encoderMap[encodeData.type];
  const compressedData = await encoder.encode(
    signal,
    workerBridge,
    image,
    encodeData.options as any,
  );

  const type: ImageMimeTypes = encoder.meta.mimeType;

  return new File(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.meta.extension}`),
    { type },
  );
}

export async function processSvg(
  signal: AbortSignal,
  blob: Blob,
): Promise<HTMLImageElement> {
  assertSignal(signal);
  const parser = new DOMParser();
  const text = await abortable(signal, blobToText(blob));
  const document = parser.parseFromString(text, 'image/svg+xml');
  const svg = document.documentElement!;

  if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
    return blobToImg(blob);
  }

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox === null) throw Error('SVG must have width/height or viewBox');

  const viewboxParts = viewBox.split(/\s+/);
  svg.setAttribute('width', viewboxParts[2]);
  svg.setAttribute('height', viewboxParts[3]);

  const serializer = new XMLSerializer();
  const newSource = serializer.serializeToString(document);
  return abortable(
    signal,
    blobToImg(new Blob([newSource], { type: 'image/svg+xml' })),
  );
}

export async function loadSourceImage(
  signal: AbortSignal,
  file: File,
  preprocessorState: PreprocessorState,
  workerBridge: WorkerBridge,
): Promise<SourceImage> {
  assertSignal(signal);

  let decoded: ImageData;
  let vectorImage: HTMLImageElement | undefined;

  if (file.type.startsWith('image/svg+xml')) {
    vectorImage = await processSvg(signal, file);
    decoded = drawableToImageData(vectorImage);
  } else {
    decoded = await decodeImage(signal, file, workerBridge);
  }

  const preprocessed = await preprocessImage(
    signal,
    decoded,
    preprocessorState,
    workerBridge,
  );

  return { file, decoded, preprocessed, vectorImage };
}

export async function compressSourceFile(
  signal: AbortSignal,
  file: File,
  preprocessorState: PreprocessorState,
  processorState: ProcessorState,
  encoderState: EncoderState | undefined,
  workerBridge: WorkerBridge,
): Promise<File> {
  const source = await loadSourceImage(
    signal,
    file,
    preprocessorState,
    workerBridge,
  );

  if (!encoderState) return source.file;

  const processed = await processImage(
    signal,
    source,
    processorState,
    workerBridge,
  );

  return compressImage(
    signal,
    processed,
    encoderState,
    source.file.name,
    workerBridge,
  );
}
