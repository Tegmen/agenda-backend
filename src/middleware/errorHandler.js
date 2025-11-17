/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Ein Eintrag mit diesen Daten existiert bereits'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Eintrag nicht gefunden'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validierungsfehler',
      details: err.details
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Ungültiger Token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token abgelaufen'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Interner Serverfehler'
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route nicht gefunden'
  });
}
