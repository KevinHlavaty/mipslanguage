"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MipsDefinitionProvider = void 0;
class MipsDefinitionProvider {
    constructor(symbolProcessor) {
        this.symbolProcessor = symbolProcessor;
    }
    provideDefinition(document, position, token) {
        return this.symbolProcessor.getFullSymbolAtDocPosition(document, position, token);
    }
}
exports.MipsDefinitionProvider = MipsDefinitionProvider;
//# sourceMappingURL=MipsDefinitionProvider.js.map