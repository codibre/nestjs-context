import { RequestContext } from 'winston-context-logger';

export function getContextProxy<T extends object>(cls: new () => T) {
	const symbolProp = Symbol(cls.name);
	const root = new cls();
	function getObj() {
		const context = RequestContext.currentContext;
		if (!context) return root;
		return (context.privateMeta[symbolProp] ??= new cls()) as T;
	}
	return new Proxy({} as unknown as T, {
		get(_, prop) {
			const obj = getObj();
			if (!(prop in obj)) return undefined;
			const value = obj[prop as keyof T];
			const result: unknown =
				typeof value === 'function' ? value.bind(obj) : value;
			return result;
		},

		set(_, prop, newValue) {
			const obj = getObj();
			obj[prop as keyof T] = newValue;
			return true;
		},
	});
}
