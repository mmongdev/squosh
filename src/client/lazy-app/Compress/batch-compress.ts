import {
  PreprocessorState,
  ProcessorState,
  EncoderState,
} from '../feature-meta';
import WorkerBridge from '../worker-bridge';
import { compressSourceFile } from './compress-pipeline';

export interface BatchProgress {
  current: number;
  total: number;
  filename: string;
}

export async function compressFilesBatch(
  signal: AbortSignal,
  files: File[],
  preprocessorState: PreprocessorState,
  processorState: ProcessorState,
  encoderState: EncoderState | undefined,
  workerBridge: WorkerBridge,
  onProgress?: (progress: BatchProgress) => void,
): Promise<File[]> {
  const results: File[] = [];

  for (let i = 0; i < files.length; i++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const file = files[i];
    onProgress?.({ current: i + 1, total: files.length, filename: file.name });

    const compressed = await compressSourceFile(
      signal,
      file,
      preprocessorState,
      processorState,
      encoderState,
      workerBridge,
    );
    results.push(compressed);
  }

  return results;
}
