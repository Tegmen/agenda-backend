import { verifyToken } from '../utils/auth.js';

/**
 * Middleware to authenticate requests using JWT tokens
 * Adds user information to req.user
 */
export function authenticate(req, res, next) {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Kein Authentifizierungstoken bereitgestellt' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    const decoded = verifyToken(token);

    // Add user info to request object
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
}

/**
 * Middleware to check if user has required role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Aktion' });
    }

    next();
  };
}

/**
 * Role hierarchy helper
 * Returns true if the user's role is sufficient for the required role
 */
export function hasRoleOrHigher(userRole, requiredRole) {
  const roleHierarchy = {
    STUDENT: 1,
    TEACHER: 2,
    PRINCIPAL: 3,
    ADMIN: 4
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
