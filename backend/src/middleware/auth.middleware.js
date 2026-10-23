import jwt from 'jsonwebtoken';
import { Resident } from '../models/Resident.js';
import { Driver } from '../models/Driver.js';
import { AdminStaff } from '../models/AdminStaff.js';
import { User } from '../models/User.js';
import { Role } from '../models/RolePermission.js';

export const findUserById = async (id) => {
  if (!id) return null;
  let user = await Resident.findById(id).select('-password');
  if (user) return user;
  user = await Driver.findById(id).select('-password');
  if (user) return user;
  user = await AdminStaff.findById(id).select('-password');
  if (user) {
    const userRole = (user.role || '').toLowerCase();
    if (['admin', 'cityadmin', 'superadmin'].includes(userRole)) {
      user.permissions = ['*'];
    } else if (userRole === 'staff') {
      if (!user.permissions || user.permissions.length === 0) {
        try {
          const roleDoc = (user.roleId && await Role.findById(user.roleId)) ||
                          (user.roleName && await Role.findOne({ name: user.roleName }));
          if (roleDoc && Array.isArray(roleDoc.permissions)) {
            user.permissions = roleDoc.permissions;
          } else {
            user.permissions = [];
          }
        } catch {
          user.permissions = [];
        }
      }
    }
    return user;
  }
  try {
    user = await User.findById(id).select('-password');
    if (user) {
      const userRole = (user.role || '').toLowerCase();
      if (['admin', 'cityadmin', 'superadmin'].includes(userRole)) {
        user.permissions = ['*'];
      } else if (userRole === 'staff') {
        const adminStaff = await AdminStaff.findOne({ email: user.email });
        if (adminStaff && Array.isArray(adminStaff.permissions) && adminStaff.permissions.length > 0) {
          user.permissions = adminStaff.permissions;
          user.roleName = adminStaff.roleName;
          user.roleId = adminStaff.roleId;
        } else {
          const roleDoc = (adminStaff?.roleId && await Role.findById(adminStaff.roleId)) ||
                          (user.title && await Role.findOne({ name: user.title })) ||
                          (adminStaff?.roleName && await Role.findOne({ name: adminStaff.roleName }));
          user.permissions = (roleDoc && Array.isArray(roleDoc.permissions)) ? roleDoc.permissions : [];
          user.roleName = roleDoc ? roleDoc.name : (user.title || 'Staff');
        }
      }
    }
  } catch (err) {
    user = null;
  }
  return user;
};

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tmt_super_secret_jwt_key_2026_smart_waste');
      req.user = await findUserById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user profile not found' });
      }
      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
    }
  }

  // Strictly reject unauthorized requests in production
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEV_FALLBACK !== 'true') {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  // Explicit dev-mode fallback only when enabled
  try {
    const route = req.baseUrl || req.originalUrl || '';
    if (route.includes('/admin')) {
      req.user = await AdminStaff.findOne({ role: { $in: ['admin', 'cityadmin', 'superadmin'] } }) ||
                 await User.findOne({ role: { $in: ['admin', 'cityadmin', 'superadmin'] } }) ||
                 { _id: '6ad45a000000000000000001', role: 'admin', name: 'Municipal Admin' };
      return next();
    } else if (route.includes('/driver')) {
      req.user = await Driver.findOne() || await User.findOne({ role: 'driver' }) || { _id: '6ad45a000000000000000002', role: 'driver', name: 'Driver Operator' };
      return next();
    } else if (route.includes('/resident')) {
      req.user = await Resident.findOne() || await User.findOne({ role: 'resident' }) || { _id: '6ad45a000000000000000003', role: 'resident', name: 'Resident' };
      return next();
    }
  } catch (err) {
    console.error('Fallback user lookup error:', err);
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, session missing or expired' 
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const isAllowed = roles.some(role => {
      const target = role.toLowerCase();
      if (target === 'admin') {
        return ['admin', 'cityadmin', 'superadmin', 'staff'].includes(userRole);
      }
      return userRole === target;
    });

    if (!isAllowed) {
      return res.status(403).json({ 
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource` 
      });
    }

    next();
  };
};

/**
 * Granular Role-Based Access Control (RBAC) Permission Middleware
 * Allows full admins ('admin', 'cityadmin', 'superadmin') and verifies specific
 * permission strings for municipal staff members ('staff').
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, authentication token missing or expired' 
      });
    }

    const userRole = (req.user.role || '').toLowerCase();

    // 1. Full Administrators and Superadmins have wildcard authority over all modules
    if (['admin', 'cityadmin', 'superadmin'].includes(userRole)) {
      return next();
    }

    // 2. Municipal Staff Accounts check granular assigned permissions
    if (userRole === 'staff') {
      const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];

      if (userPermissions.includes('*')) {
        return next();
      }

      const hasRequired = requiredPermissions.some(perm => userPermissions.includes(perm));
      if (hasRequired) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Forbidden: Staff account missing required permission [${requiredPermissions.join(', ')}]`,
        requiredPermissions,
        currentPermissions: userPermissions,
        roleName: req.user.roleName || req.user.title || 'Staff'
      });
    }

    // 3. Any non-admin role is rejected
    return res.status(403).json({
      success: false,
      message: `Access denied: role '${req.user.role}' is not authorized to perform administrative operations`
    });
  };
};
