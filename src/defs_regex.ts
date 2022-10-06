const mkRegex = (str: TemplateStringsArray, opts: string = 'i') =>
	new RegExp(str.raw[0].replace(/\s/gm, ''), opts);

export default {
	labelDefinition: /^([A-z0-9_\\.\\$]+):/,
	constantDefinition: /^([A-z0-9_]+)\s*=/
}