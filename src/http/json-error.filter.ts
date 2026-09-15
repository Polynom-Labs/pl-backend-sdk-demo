import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class JsonErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(JsonErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const message = exceptionMessage(exception);
    if (!(exception instanceof HttpException) || exception.getStatus() >= 500) {
      this.logger.error(
        message,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === "string") {
        response.status(status).json({ statusCode: status, message: payload });
        return;
      }
      response.status(status).json(payload);
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
    });
  }
}

function exceptionMessage(exception: unknown): string {
  if (exception instanceof Error && exception.message) {
    return exception.message;
  }
  if (typeof exception === "string" && exception.length > 0) {
    return exception;
  }
  if (exception && typeof exception === "object") {
    if (
      "message" in exception &&
      typeof exception.message === "string" &&
      exception.message.length > 0
    ) {
      return exception.message;
    }
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
  }
  return "Internal server error";
}
