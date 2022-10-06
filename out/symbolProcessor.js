"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolProcessor = void 0;
const vscode = require("vscode");
const defs_regex_1 = require("./defs_regex");
class SymbolProcessor {
    constructor() {
        vscode.workspace.onDidChangeTextDocument((event) => this._fileChanged(event.document.uri));
        this._watcher = vscode.workspace.createFileSystemWatcher("**/.asm");
        this._watcher.onDidChange(this._fileChanged);
        this._watcher.onDidDelete(this._fileDeleted);
        let currentUri = vscode.window.activeTextEditor?.document.uri;
        if (currentUri) {
            this._lastFolder = vscode.workspace.getWorkspaceFolder(currentUri);
        }
        this.files = new Map();
        this._documentAllFilesInCurrentFolder();
    }
    _documentAllFilesInCurrentFolder() {
        const currentUri = vscode.window.activeTextEditor?.document.uri;
        if (!currentUri)
            return;
        let currentFolder = vscode.workspace.getWorkspaceFolder(currentUri);
        if (!currentFolder)
            return;
        vscode.workspace.findFiles(new vscode.RelativePattern(currentFolder, "*.asm"))
            .then(uris => uris.forEach(uri => this._document(uri)));
    }
    async _document(uri) {
        if (!uri.path.endsWith(".asm"))
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
    _fileChanged(uri) {
        let uriFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (uriFolder && uriFolder === this._lastFolder) {
            this._document(uri);
        }
    }
    _fileDeleted(uri) {
        let uriFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (uriFolder && uriFolder === this._lastFolder) {
            this.files.delete(uri.path);
        }
    }
    getFullSymbolAtDocPosition(document, position, token) {
        let range = document.getWordRangeAtPosition(position, /(\b|\$)[A-z_0-9\$]+(\b|\$)/);
        if (!range)
            return undefined;
        const text = document.getText(range);
        return this.files.get(document.uri.path)?.get(text);
    }
}
exports.SymbolProcessor = SymbolProcessor;
//# sourceMappingURL=symbolProcessor.js.map