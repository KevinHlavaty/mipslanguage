"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.EXTENSION_LANGUAGE_ID = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const MipsDefinitionProvider_1 = require("./MipsDefinitionProvider");
const symbolProcessor_1 = require("./symbolProcessor");
exports.EXTENSION_LANGUAGE_ID = "mips";
let changeConfigSubscription;
let symbolProcessor;
function activate(context) {
    configure(context);
    changeConfigSubscription = vscode.workspace.onDidChangeConfiguration(event => {
        configure(context, event);
    });
}
exports.activate = activate;
function deactivate() {
    if (changeConfigSubscription) {
        changeConfigSubscription.dispose();
        changeConfigSubscription = undefined;
    }
}
exports.deactivate = deactivate;
function configure(context, event) {
    const languageSelector = { language: exports.EXTENSION_LANGUAGE_ID, scheme: "file" };
    if (!symbolProcessor) {
        symbolProcessor = new symbolProcessor_1.SymbolProcessor();
    }
    vscode.languages.registerDefinitionProvider(languageSelector, new MipsDefinitionProvider_1.MipsDefinitionProvider(symbolProcessor));
}
//# sourceMappingURL=extension.js.map