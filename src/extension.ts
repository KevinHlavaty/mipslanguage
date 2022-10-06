// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MipsDefinitionProvider } from './MipsDefinitionProvider'
import { SymbolProcessor } from './symbolProcessor';

export const EXTENSION_LANGUAGE_ID = "mips";

let changeConfigSubscription: vscode.Disposable | undefined;
let symbolProcessor: SymbolProcessor | undefined;

export function activate(context: vscode.ExtensionContext) {
	configure(context)

	changeConfigSubscription = vscode.workspace.onDidChangeConfiguration(event => {
		configure(context, event);
	})
}

export function deactivate() {
	if(changeConfigSubscription) {
		changeConfigSubscription.dispose();
		changeConfigSubscription = undefined;
	}
}

function configure(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
	const languageSelector: vscode.DocumentFilter = {language: EXTENSION_LANGUAGE_ID, scheme: "file"};

	if(!symbolProcessor) {
		symbolProcessor = new SymbolProcessor();
	}

	vscode.languages.registerDefinitionProvider(languageSelector, new MipsDefinitionProvider(symbolProcessor));
}