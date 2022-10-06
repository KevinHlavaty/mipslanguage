"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mkRegex = (str, opts = 'i') => new RegExp(str.raw[0].replace(/\s/gm, ''), opts);
exports.default = {
    labelDefinition: /^([A-z0-9_\\.\\$]+):/,
    constantDefinition: /^([A-z0-9_]+)\s*=/
};
//# sourceMappingURL=defs_regex.js.map