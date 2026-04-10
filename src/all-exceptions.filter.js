import { Catch, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: exception.message };

    const error = typeof errorResponse === 'string' 
      ? errorResponse 
      : errorResponse.error || 'InternalServerError';
      
    const message = typeof errorResponse === 'object' && errorResponse.message 
      ? errorResponse.message 
      : exception.message;

    response.status(status).json({
      error,
      message
    });
  }
}
