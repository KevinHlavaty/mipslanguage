
import * as vscode from 'vscode';
import regex from './defs_regex'

export class SymbolProcessor {

	private _watcher: vscode.FileSystemWatcher;
	private _lastFolder: vscode.WorkspaceFolder | undefined;

	files: Map<string, Map<string, vscode.Location>>

	constructor() {
		vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) =>
			this._fileChanged(event.document.uri)
		);
		
		this._watcher = vscode.workspace.createFileSystemWatcher("**/.asm");
		this._watcher.onDidChange(this._fileChanged);
		this._watcher.onDidDelete(this._fileDeleted);

		let currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor?.document.uri;
		if(currentUri) {
			this._lastFolder = vscode.workspace.getWorkspaceFolder(currentUri);
		}
		this.files = new Map<string, Map<string, vscode.Location>>();

		this._documentAllFilesInCurrentFolder();
	}

	private _documentAllFilesInCurrentFolder() {
		const currentUri = vscode.window.activeTextEditor?.document.uri;
		if(!currentUri)
			return;

		let currentFolder = vscode.workspace.getWorkspaceFolder(currentUri);
		if(!currentFolder)
			return;
		
		vscode.workspace.findFiles(new vscode.RelativePattern(currentFolder, "*.asm"))
		                .then(uris => uris.forEach(uri => this._document(uri)));
	}

	private async _document(uri: vscode.Uri) {
		if(!uri.path.endsWith(".asm"))
			return;

		let currentMap = new Map<string, vscode.Location>();
		let currentDocument = await vscode.workspace.openTextDocument(uri);
		for(let lineNumber: number = 0; lineNumber < currentDocument.lineCount; lineNumber++) {
			const currentLine = currentDocument.lineAt(lineNumber);
			if(currentLine.isEmptyOrWhitespace)
				continue;
			
			const currentLineText = currentLine.text;
			
			const labelMatch = regex.labelDefinition.exec(currentLineText);
			const constantMatch = regex.constantDefinition.exec(currentLineText);
			if(labelMatch) {
				const labelName = labelMatch[1];
				currentMap.set(labelName, new vscode.Location(uri, new vscode.Position(lineNumber, 0)))
			} else if(constantMatch) {
				const constantName = constantMatch[1];
				currentMap.set(constantName, new vscode.Location(uri, new vscode.Position(lineNumber, 0)))
			}
		}
		this.files.set(uri.path, currentMap);
	}

	private _fileChanged(uri: vscode.Uri) {
		let uriFolder = vscode.workspace.getWorkspaceFolder(uri);
		if(uriFolder && uriFolder === this._lastFolder) {
			this._document(uri);
		}
	}

	private _fileDeleted(uri: vscode.Uri) {
		let uriFolder = vscode.workspace.getWorkspaceFolder(uri);
		if(uriFolder && uriFolder === this._lastFolder) {
			this.files.delete(uri.path);
		}
	}

	getFullSymbolAtDocPosition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location | undefined {
		let range: vscode.Range | undefined = document.getWordRangeAtPosition(position, /(\b|\$)[A-z_0-9\$]+(\b|\$)/);
		if(!range)
			return undefined;
		
		const text: string = document.getText(range);
		return this.files.get(document.uri.path)?.get(text);
	}
}