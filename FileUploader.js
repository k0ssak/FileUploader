const FileUploader = (() => {
    class FileUploader {
        constructor (settings) {
            this.xhr = new XMLHttpRequest();
            this.isSending = false;

            this.elements = {
                $fileInput: settings.$fileInput,
                $submitButton: settings.$submitButton,
                $progressBar: null,
                $bar: null
            };

            this.settings = Object.assign({
                type: 'click',
                maxSize: 20000,
                allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    
                url: null,
                async: true,
                headers: {},
    
                start: (ev) => {                
                    this.elements.$progressBar = document.createElement('div');
                    this.elements.$progressBar.classList.add('progress-bar');
                    this.elements.$bar = document.createElement('span');
                    this.elements.$bar.classList.add('progress-bar__bar');
                    
                    this.elements.$progressBar.appendChild(this.elements.$bar);
                    this.elements.$fileInput.parentNode.appendChild(this.elements.$progressBar);
                },
                progress: (ev) => {
                    this.elements.$progressBar.dataset.progress = FileUploader.formatBytes(ev.loaded);
                    this.elements.$progressBar.dataset.progressMax = FileUploader.formatBytes(ev.total);
                    this.elements.$bar.style.width = ((100 * ev.loaded) / ev.total) + '%';
                },
                success: null,
                complete: () => {
                    setTimeout(() => {
                        this.elements.$progressBar.remove();
                        this.isSending = false;
                    }, 300);
                },
                abort: null,
                error: null,
                timeout: null
            }, settings);
        
            Object.assign(this.settings.headers, {
                'Content-Type': 'multipart/form-data',
                'X-Requested-With': 'XMLHttpRequest'
            }, settings.headers);

            if (!this.elements.$fileInput) {
                console.error('this.settings.$file required. (<input type="file">).');
                return false;
            }
    
            if (!this.elements.$submitButton && this.settings.type === 'click') {
                console.error('this.settings.$submit is required. With type "click".');
                return false;
            }

            _addListeners(this.xhr, this.settings);

            if (this.settings.type === 'change') {
                this.elements.$fileInput.addEventListener('change', this.send.bind(this));
            }
    
            if (this.settings.type === 'click') {
                this.elements.$submitButton.addEventListener('click', this.send.bind(this));
            }
        }

        validate () {
            const files = this.elements.$fileInput.files;
            const errorMessages = [];

            let valid = true;
            if (!files.length) {
                valid = false;
                errorMessages.push('No files selected.');
            }

            _forEachIn(files, (file, key) => {
                if (!_validExtension(this.settings.allowedExtensions, _getExt(file.name))) {
                    valid = false;
                    errorMessages.push(file.name + ' has wrong extension.');
                }

                if (!_validSize(this.settings.maxSize, file.size * 0.001)) {
                    valid = false;
                    errorMessages.push(file.name + ' size exceeds max size. ' + this.settings.maxSize + 'KB allowed.');
                }
            });

            return {
                valid: valid,
                errorMessages: errorMessages
            }
        }

        send () {          
            const validate = this.validate();
            if (!validate.valid) {
                console.log(validate.errorMessages) // TODO: display them
                return false;
            }

            if (this.isSending !== false) {
                return false;
            }

            this.isSending = true;
            this.xhr.open('post', this.settings.url, this.settings.async);

            const files = this.elements.$fileInput.files;
            if (files.length === 1) {
                this.settings.headers['Content-Type'] = files[0].type;
            }

            const formData = new FormData();
            _forEachIn(this.settings.headers, (headerValue, headerKey) => this.xhr.setRequestHeader(headerKey, headerValue));
            _forEachIn(files, (file, key) => formData.append(this.elements.$fileInput.name, file, file.name));

            this.xhr.send(formData);

            return this;
        }

        static formatBytes (bytes) {
            if (bytes == 0) {
                return '0 B'
            };
    
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
    
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }

    function _addListeners (xhr, settings) {
        xhr.upload.addEventListener('loadstart', settings.start);
        xhr.upload.addEventListener('progress', settings.progress);
        xhr.upload.addEventListener('load', settings.success);
        xhr.upload.addEventListener('loadend', settings.complete);
        xhr.upload.addEventListener('abort', settings.abort);
        xhr.upload.addEventListener('error', settings.error);
        xhr.upload.addEventListener('timeout', settings.timeout);
    }

    function _forEachIn (obj, callback) {
        let counter = 0;
        for (let x in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, x)) {
                callback(obj[x], x, counter, obj);
                counter += 1;
            }
        }
    }

    function _getExt (filename) {
        const parts = filename.split('.');
        return parts[parts.length - 1].toLowerCase();
    }

    function _validExtension (allowedExtensions, ext) {
        if (!allowedExtensions || !allowedExtensions.length) {
            return true;
        }

        return allowedExtensions.indexOf(ext) >= 0;
    }

    function _validSize (maxSize, fileSize) {
        if (!maxSize) {
            return true;
        }

        return fileSize <= maxSize;
    }
   
    return FileUploader;
})();

window.addEventListener('DOMContentLoaded', () => {
    new FileUploader({
        $fileInput: document.getElementById('test'),
        $submitButton: document.getElementById('test-submit'),
        url: 'localhost',
        type: 'click'
    });
});
