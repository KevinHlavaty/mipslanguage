
import * as vscode from 'vscode'
import { SymbolProcessor } from './symbolProcessor';

export class MipsDefinitionProvider implements vscode.DefinitionProvider {
    constructor(public symbolProcessor: SymbolProcessor) {}

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
        return this.symbolProcessor.getFullSymbolAtDocPosition(document, position, token);
    }

}