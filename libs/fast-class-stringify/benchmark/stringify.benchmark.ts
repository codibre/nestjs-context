/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import Benchmark from 'benchmark';
import { ApiProperty } from '@nestjs/swagger';
import { registerSwaggerSchema, stringifyClass } from '../src';

// Complex POCO class with all primary types, array, and subobject
class SubObject {
	@ApiProperty()
	id: number;
	@ApiProperty()
	label: string;
}

class ComplexPOCO {
	@ApiProperty()
	str: string;
	@ApiProperty()
	num: number;
	@ApiProperty()
	bool: boolean;
	@ApiProperty()
	arr: number[];
	@ApiProperty({
		type: SubObject,
	})
	sub: SubObject;
	@ApiProperty()
	date: Date;
	@ApiProperty({
		type: String,
		required: false,
	})
	nullable: string | null;
	@ApiProperty()
	undef?: string;
	static create(i: number) {
		const result = new ComplexPOCO();
		result.str = `str${i}`;
		result.num = i;
		result.bool = i % 2 === 0;
		result.arr = [i, i + 1, i + 2];
		result.sub = new SubObject();
		result.sub.id = i;
		result.sub.label = `label${i}`;
		result.date = new Date(2000 + i, 0, 1);
		result.nullable = i % 3 === 0 ? null : `nullable${i}`;
		if (i % 4 === 0) result.undef = undefined;
		return result;
	}
}

// Function to create an array of ComplexPOCO
export function createComplexArray(size: number): ComplexPOCO[] {
	return Array.from({ length: size }, (_, i) => ComplexPOCO.create(i));
}

registerSwaggerSchema(ComplexPOCO);
registerSwaggerSchema(SubObject);

// Prepare data
const SIZES = [10, 100, 1000, 10000];

for (const SIZE of SIZES) {
	const data = createComplexArray(SIZE);

	const str1 = stringifyClass(data);
	const str2 = JSON.stringify(data);

	console.log(`Results equal: ${str1 === str2 ? 'yes' : 'no'}`);

	// Benchmark suite
	const suite = new Benchmark.Suite();

	suite
		.add(`stringifyClass (${SIZE})`, function () {
			stringifyClass(data);
		})
		.add(`JSON.stringify (${SIZE})`, function () {
			JSON.stringify(data);
		})
		.on('cycle', function (event: any) {

			console.log(String(event.target));
		})
		.on('complete', function (this: Benchmark.Suite) {

			console.log('Fastest is ' + this.filter('fastest').map('name'));
		})
		.run();
}
