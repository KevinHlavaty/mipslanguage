
import * as vscode from 'vscode';
import regex from './defs_regex'

export class SymbolProcessor {

	private _watcher: vscode.FileSystemWatcher;
	private _lastFolderPath: string | undefined;

	files: Map<string, Map<string, vscode.Location>>

	constructor() {
		vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
			if(editor)
				this._changedTextDocument(editor.document.uri);
		});
		
		this._watcher = vscode.workspace.createFileSystemWatcher("**/.{asm,s}");
		this._watcher.onDidChange(this._fileChanged);
		this._watcher.onDidDelete(this._fileDeleted);

		let currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor?.document.uri;
		if(currentUri) {
			this._lastFolderPath = currentUri.path.substring(0, currentUri.path.lastIndexOf("/"));
		}
		this.files = new Map<string, Map<string, vscode.Location>>();

		this._documentAllFilesInCurrentFolder();
	}

	private _documentAllFilesInCurrentFolder() {
		const currentUri = vscode.window.activeTextEditor?.document.uri;
		if(!currentUri)
			return;

		let currentFolderPath: string = currentUri.fsPath.substring(0, currentUri.fsPath.lastIndexOf("/"));
		if(currentFolderPath.length === 0)
			currentFolderPath = currentUri.fsPath.substring(0, currentUri.fsPath.lastIndexOf("\\"))
		
		vscode.workspace.findFiles(new vscode.RelativePattern(currentFolderPath, "*.{asm,s}"))
		                .then(uris => uris.forEach(uri => this._document(uri)));
	}

	private async _document(uri: vscode.Uri) {
		if(!uri.path.endsWith(".asm") && !uri.path.endsWith(".s"))
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

	private _changedTextDocument(uri: vscode.Uri) {
		let currentFolderPath: string | undefined = uri.path.substring(0, uri.path.lastIndexOf("/"));
		if(!currentFolderPath || !this._lastFolderPath || currentFolderPath !== this._lastFolderPath) {
			this.files.clear();
			this._documentAllFilesInCurrentFolder();
			this._lastFolderPath = currentFolderPath;
		}
	}

	private _fileChanged(uri: vscode.Uri) {
		let currentFolderPath: string | undefined = uri.path.substring(0, uri.path.lastIndexOf("/"));
		if(currentFolderPath && this._lastFolderPath && currentFolderPath === this._lastFolderPath) {
			this._document(uri);
		}
	}

	private _fileDeleted(uri: vscode.Uri) {
		let currentFolderPath: string | undefined = uri.path.substring(0, uri.path.lastIndexOf("/"));
		if(currentFolderPath && this._lastFolderPath && currentFolderPath === this._lastFolderPath) {
			this.files.delete(uri.path);
		}
	}

	getFullSymbolAtDocPosition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Location | undefined {
		let range: vscode.Range | undefined = document.getWordRangeAtPosition(position, /(\b|\$)[A-z_0-9\$]+(\b|\$)/);
		if(!range)
			return undefined;
		
		const text: string = document.getText(range);
		for(let file of this.files.values()) {
			let result: vscode.Location | undefined = file.get(text);
			if(result)
				return result;
		}
		return undefined;
	}
}