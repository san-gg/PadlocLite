import { EventEmitter } from "./event-target";

/** Error info */
export interface Error {
    /** Error code */
    code: number | string;
    /** Error message */
    message: string;
}

interface Progress {
    loaded: number;
    total: number;
}

export class RequestProgress extends EventEmitter {
    completed: Promise<void> = new Promise((resolve, reject) => {
        this._resolveCompleted = resolve;
        this._rejectCompleted = reject;
    });

    get uploadProgress() {
        return this._uploadProgress;
    }

    set uploadProgress(progress: Progress) {
        this._uploadProgress = progress;
        this.dispatch("upload-progress", progress);
        this.dispatch("progress", this.progress);
    }

    get downloadProgress() {
        return this._downloadProgress;
    }

    set downloadProgress(progress: Progress) {
        this._downloadProgress = progress;
        this.dispatch("download-progress", progress);
        this.dispatch("progress", this.progress);
    }

    get progress() {
        return {
            loaded: this.uploadProgress.loaded + this.downloadProgress.loaded,
            total: this.uploadProgress.total + this.downloadProgress.total,
        };
    }

    set error(error: Error | undefined) {
        this._error = error;
        if (error) {
            this.dispatch("error", { error });
            this.uploadProgress = this.downloadProgress = { loaded: 0, total: 0 };
            this._rejectCompleted(error);
        }
    }

    get error() {
        return this._error;
    }

    private _uploadProgress: Progress = { loaded: 0, total: 0 };
    private _downloadProgress: Progress = { loaded: 0, total: 0 };

    private _error?: Error;

    private _resolveCompleted!: () => void;
    private _rejectCompleted!: (err: Error) => void;

    complete() {
        this._resolveCompleted();
    }
}
