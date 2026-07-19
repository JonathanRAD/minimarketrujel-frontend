/**
 * Error de aplicación con código HTTP asociado.
 * Todos los errores "esperados" (validaciones, no encontrado, etc.)
 * deben lanzarse como AppError para que el middleware global los maneje bien.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe o entra en conflicto') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para esta acción') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos') {
    super(message, 422);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Petición inválida') {
    super(message, 400);
  }
}
