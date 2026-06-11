import type { FileDropEvent } from 'file-drop-element';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SnackOptions } from 'shared/custom-els/snack-bar';

import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';
import 'file-drop-element';
import 'shared/custom-els/snack-bar';
import Intro from 'shared/prerendered-app/Intro';
import 'shared/custom-els/loading-spinner';
import { filterImageFiles } from 'shared/util/image-files';

const ROUTE_EDITOR = '/editor';

const compressPromise = import('client/lazy-app/Compress');
const swBridgePromise = import('client/lazy-app/sw-bridge');

function back() {
  window.history.back();
}

interface Props {}

interface State {
  awaitingShareTarget: boolean;
  files: File[];
  activeFileIndex: number;
  isEditorOpen: Boolean;
  Compress?: typeof import('client/lazy-app/Compress').default;
}

export default class App extends Component<Props, State> {
  state: State = {
    awaitingShareTarget: new URL(location.href).searchParams.has(
      'share-target',
    ),
    isEditorOpen: false,
    files: [],
    activeFileIndex: 0,
    Compress: undefined,
  };

  snackbar?: SnackBarElement;

  constructor() {
    super();

    compressPromise
      .then((module) => {
        this.setState({ Compress: module.default });
      })
      .catch(() => {
        this.showSnack('Failed to load app');
      });

    swBridgePromise.then(async ({ offliner, getSharedImage }) => {
      offliner(this.showSnack);
      if (!this.state.awaitingShareTarget) return;
      const file = await getSharedImage();
      // Remove the ?share-target from the URL
      history.replaceState('', '', '/');
      this.openEditor();
      this.setState({
        files: [file],
        activeFileIndex: 0,
        awaitingShareTarget: false,
      });
    });

    // Since iOS 10, Apple tries to prevent disabling pinch-zoom. This is great in theory, but
    // really breaks things on Squoosh, as you can easily end up zooming the UI when you mean to
    // zoom the image. Once you've done this, it's really difficult to undo. Anyway, this seems to
    // prevent it.
    document.body.addEventListener('gesturestart', (event: any) => {
      event.preventDefault();
    });

    window.addEventListener('popstate', this.onPopState);
  }

  private onFileDrop = ({ files }: FileDropEvent) => {
    const imageFiles = filterImageFiles(files);
    if (imageFiles.length === 0) return;

    if (this.state.isEditorOpen) {
      this.addFiles(imageFiles);
      return;
    }

    this.openEditor();
    this.setState({ files: imageFiles, activeFileIndex: 0 });
    if (imageFiles.length > 1) {
      this.showSnack(`${imageFiles.length} images loaded`);
    }
  };

  private onIntroPickFiles = (files: File[]) => {
    this.openEditor();
    this.setState({ files, activeFileIndex: 0 });
    if (files.length > 1) {
      this.showSnack(`${files.length} images loaded`);
    }
  };

  private addFiles = (newFiles: File[]) => {
    const imageFiles = filterImageFiles(newFiles);
    if (imageFiles.length === 0) return;

    this.setState((state) => ({
      files: [...state.files, ...imageFiles],
    }));
    this.showSnack(
      imageFiles.length === 1
        ? '1 image added'
        : `${imageFiles.length} images added`,
    );
  };

  private onActiveFileChange = (index: number) => {
    this.setState({ activeFileIndex: index });
  };

  private onFileRemove = (index: number) => {
    this.setState((state) => {
      const files = state.files.filter((_, i) => i !== index);
      if (files.length === 0) {
        back();
        return { files: [], activeFileIndex: 0 };
      }

      let activeFileIndex = state.activeFileIndex;
      if (index < activeFileIndex) activeFileIndex--;
      else if (index === activeFileIndex) {
        activeFileIndex = Math.min(activeFileIndex, files.length - 1);
      }

      return { files, activeFileIndex };
    });
  };

  private showSnack = (
    message: string,
    options: SnackOptions = {},
  ): Promise<string> => {
    if (!this.snackbar) throw Error('Snackbar missing');
    return this.snackbar.showSnackbar(message, options);
  };

  private onPopState = () => {
    this.setState({ isEditorOpen: location.pathname === ROUTE_EDITOR });
  };

  private openEditor = () => {
    if (this.state.isEditorOpen) return;
    // Change path, but preserve query string.
    const editorURL = new URL(location.href);
    editorURL.pathname = ROUTE_EDITOR;
    history.pushState(null, '', editorURL.href);
    this.setState({ isEditorOpen: true });
  };

  render(
    {}: Props,
    { files, activeFileIndex, isEditorOpen, Compress, awaitingShareTarget }: State,
  ) {
    const showSpinner = awaitingShareTarget || (isEditorOpen && !Compress);
    const activeFile = files[activeFileIndex];

    return (
      <div class={style.app}>
        <file-drop multiple onfiledrop={this.onFileDrop} class={style.drop}>
          {showSpinner ? (
            <loading-spinner class={style.appLoader} />
          ) : isEditorOpen ? (
            Compress &&
            activeFile && (
              <Compress
                files={files}
                activeFileIndex={activeFileIndex}
                file={activeFile}
                showSnack={this.showSnack}
                onBack={back}
                onActiveFileChange={this.onActiveFileChange}
                onFilesAdd={this.addFiles}
                onFileRemove={this.onFileRemove}
              />
            )
          ) : (
            <Intro onFiles={this.onIntroPickFiles} showSnack={this.showSnack} />
          )}
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
