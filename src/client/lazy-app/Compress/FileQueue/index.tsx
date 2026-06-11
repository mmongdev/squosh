import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import { filterImageFiles } from 'shared/util/image-files';
import type { BatchProgress } from '../batch-compress';
import * as style from './style.css';
import 'add-css:./style.css';
import 'shared/custom-els/loading-spinner';

interface Props {
  files: File[];
  activeIndex: number;
  batchDownloading: boolean;
  batchProgress?: BatchProgress;
  onSelect: (index: number) => void;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onDownloadAll: () => void;
}

export default class FileQueue extends Component<Props> {
  private fileInput?: HTMLInputElement;

  private onAddClick = () => {
    this.fileInput!.click();
  };

  private onFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files ? filterImageFiles(input.files) : [];
    input.value = '';
    if (files.length === 0) return;
    this.props.onAdd(files);
  };

  render({
    files,
    activeIndex,
    batchDownloading,
    batchProgress,
    onSelect,
    onRemove,
    onDownloadAll,
  }: Props) {
    const fileInput = (
      <input
        class={style.hide}
        ref={linkRef(this, 'fileInput')}
        type="file"
        accept="image/*"
        multiple
        onChange={this.onFileChange}
      />
    );

    const addButton = (
      <button
        class={style.addBtn}
        onClick={this.onAddClick}
        title="Add images"
        disabled={batchDownloading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path
            fill="currentColor"
            d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"
          />
        </svg>
      </button>
    );

    const downloadAllButton =
      files.length > 1 ? (
        <button
          class={style.downloadAllBtn}
          onClick={onDownloadAll}
          disabled={batchDownloading}
          title="Download all as ZIP"
        >
          {batchDownloading ? (
            <loading-spinner class={style.downloadSpinner} />
          ) : (
            'ZIP'
          )}
        </button>
      ) : null;

    const progressLabel =
      batchDownloading && batchProgress ? (
        <span class={style.progress}>
          {batchProgress.current}/{batchProgress.total}
        </span>
      ) : null;

    if (files.length <= 1) {
      return (
        <div class={style.queue}>
          {fileInput}
          {addButton}
        </div>
      );
    }

    return (
      <div class={style.queue}>
        {fileInput}
        <div class={style.list}>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              class={index === activeIndex ? style.itemActive : style.item}
            >
              <button
                class={style.selectBtn}
                onClick={() => onSelect(index)}
                title={file.name}
                disabled={batchDownloading}
              >
                <span class={style.index}>{index + 1}</span>
                <span class={style.name}>{file.name}</span>
              </button>
              <button
                class={style.removeBtn}
                onClick={() => onRemove(index)}
                title="Remove"
                disabled={batchDownloading}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {progressLabel}
        {downloadAllButton}
        {addButton}
      </div>
    );
  }
}
