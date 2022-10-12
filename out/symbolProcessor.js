"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolProcessor = void 0;
const vscode = require("vscode");
const defs_regex_1 = require("./defs_regex");
class SymbolProcessor {
    constructor() {
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor)
                this._changedTextDocument(editor.document.uri);
        });
        this._watcher = vscode.workspace.createFileSystemWatcher("**/.{asm,s}");
        this._watcher.onDidChange(this._fileChanged);
        this._watcher.onDidDelete(this._fileDeleted);
        let currentUri = vscode.window.activeTextEditor?.document.uri;
        if (currentUri) {
            this._lastFolderPath = currentUri.path.substring(0, currentUri.path.lastIndexOf("/"));
        }
        this.files = new Map();
        this._documentAllFilesInCurrentFolder();
    }
    _documentAllFilesInCurrentFolder() {
        const currentUri = vscode.window.activeTextEditor?.document.uri;
        if (!currentUri)
            return;
        let currentFolderPath = currentUri.fsPath.substring(0, currentUri.fsPath.lastIndexOf("/"));
        if (currentFolderPath.length === 0)
            currentFolderPath = currentUri.fsPath.substring(0, currentUri.fsPath.lastIndexOf("\\"));
        vscode.workspace.findFiles(new vscode.RelativePattern(currentFolderPath, "*.{asm,s}"))
            .then(uris => uris.forEach(uri => this._document(uri)));
    }
    async _document(uri) {
        if (!uri.path.endsWith(".asm") && !uri.path.endsWith(".s"))
            return;
        let currentMap = new Map();
        let currentDocument = await vscode.workspace.openTextDocument(uri);
        for (let lineNumber = 0; lineNumber < currentDocument.lineCount; lineNumber++) {
            const currentLine = currentDocument.lineAt(lineNumber);
            if (currentLine.isEmptyOrWhitespace)
                continue;
            const currentLineText = currentLine.text;
            const labelMatch = defs_regex_1.default.labelDefinition.exec(currentLineText);
            const constantMatch = defs_regex_1.default.constantDefinition.exec(currentLineText);
            if (labelMatch) {
                const labelName = labelMatch[1];
                currentMap.set(labelName, new vscode.Location(uri, new vscode.Position(lineNumber, 0)));
            }
            else if (constantMatch) {
                const constantName = constantMatch[1];
                currentMap.set(constantName, new vscode.Location(uri, new vscode.Position(lineNumber, 0)));
            }
        }
        this.files.set(uri.path, currentMap);
    }
    _changedTextDocument(uri) {
        let currentFolderPath = uri.path.substring(0, uri.path.lastIndexOf("/"));
        if (!currentFolderPath || !this._lastFolderPath || currentFolderPath !== this._lastFolderPath) {
            this.files.clear();
            this._documentAllFilesInCurrentFolder();
            this._lastFolderPath = currentFolderPath;
        }
    }
    _fileChanged(uri) {
        let currentFolderPath = uri.path.substring(0, uri.path.lastIndexOf("/"));
        if (currentFolderPath && this._lastFolderPath && currentFolderPath === this._lastFolderPath) {
            this._document(uri);
        }
    }
    _fileDeleted(uri) {
        let currentFolderPath = uri.path.substring(0, uri.path.lastIndexOf("/"));
        if (currentFolderPath && this._lastFolderPath && currentFolderPath === this._lastFolderPath) {
            this.files.delete(uri.path);
        }
    }
    getFullSymbolAtDocPosition(document, position, token) {
        let range = document.getWordRangeAtPosition(position, /(\b|\$)[A-z_0-9\$]+(\b|\$)/);
        if (!range)
            return undefined;
        const text = document.getText(range);
        for (let file of this.files.values()) {
            let result = file.get(text);
            if (result)
                return result;
        }
        return undefined;
    }
}
exports.SymbolProcessor = SymbolProcessor;
//# sourceMappingURL=symbolProcessor.js.map