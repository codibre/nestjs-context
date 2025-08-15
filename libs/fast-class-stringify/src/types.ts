import { Type } from '@nestjs/common';

export type Cls = Type<object>;
export type Stringify = (c: unknown) => string;
