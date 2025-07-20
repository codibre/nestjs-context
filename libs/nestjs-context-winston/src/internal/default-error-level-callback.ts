import { HttpStatus } from '@nestjs/common';

export const defaultErrorLevelCallback = () => HttpStatus.INTERNAL_SERVER_ERROR;
