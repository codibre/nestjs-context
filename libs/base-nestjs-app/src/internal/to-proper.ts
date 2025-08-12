export function toProperCase<s extends string>(str: s): Capitalize<s> {
	return `${str.charAt(0).toUpperCase()}${str.slice(1)}` as Capitalize<s>;
}
