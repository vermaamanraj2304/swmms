import jwt from 'jsonwebtoken';
import { Resident } from '../models/Resident.js';
import { Driver } from '../models/Driver.js';
import { AdminStaff } from '../models/AdminStaff.js';
import { User } from '../models/User.js';
import { Role } from '../models/RolePermission.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'tmt_super_secret_jwt_key_2026_smart_waste', {
    expiresIn: '30d',
  });
};

export const resolveUserRBAC = async (user) => {
  if (!user) return { permissions: [], roleName: '' };
  const role = (user.role || '').toLowerCase();
  let permissions = [];
  let roleName = user.roleName || user.title || '';

  if (['admin', 'cityadmin', 'superadmin'].includes(role)) {
    permissions = ['*'];
    if (!roleName) roleName = role === 'superadmin' ? 'Global Operations Director (HQ)' : 'Municipal Administrator';
  } else if (role === 'staff') {
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      permissions = user.permissions;
    } else {
      try {
        const roleDoc = (user.roleId && await Role.findById(user.roleId)) ||
                        (user.roleName && await Role.findOne({ name: user.roleName }));
        if (roleDoc && Array.isArray(roleDoc.permissions)) {
          permissions = roleDoc.permissions;
          if (!roleName) roleName = roleDoc.name;
        }
      } catch {}
    }
    if (!roleName) roleName = 'Municipal Staff';
  }

  return { permissions, roleName };
};

// Ensure default Superadmin account exists in database
export const ensureSuperadminAccount = async () => {
  try {
    let superadmin = await AdminStaff.findOne({
      $or: [
        { role: 'superadmin' },
        { scope: 'superadmin' },
        { email: 'superadmin@smarttrash.gov' },
        { email: 'sterling@trackmytrash-hq.global' },
        { customId: 'HQ-SUP-001' }
      ]
    });

    if (!superadmin) {
      superadmin = await AdminStaff.create({
        customId: 'HQ-SUP-001',
        name: 'Alexandra Sterling',
        email: 'superadmin@smarttrash.gov',
        password: 'Superadmin@123',
        role: 'superadmin',
        scope: 'superadmin',
        title: 'Global Operations Director (HQ)',
        roleName: 'Global Operations Director (HQ)',
        department: 'Executive HQ & Governance',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
        officeLocation: 'Global Command HQ, Penthouse Suite 100',
        emergencyPhone: '+91 120 234 9999'
      });
      console.log('✅ Default Superadmin account initialized: superadmin@smarttrash.gov / Superadmin@123');
    }

    // Keep User model in sync for superadmin
    let user = await User.findOne({
      $or: [
        { role: 'superadmin' },
        { email: 'superadmin@smarttrash.gov' },
        { email: superadmin.email }
      ]
    });

    if (!user) {
      await User.create({
        _id: superadmin._id,
        customId: superadmin.customId,
        name: superadmin.name,
        email: superadmin.email,
        password: 'Superadmin@123',
        role: 'superadmin',
        phone: superadmin.phone || '+91 120 234 5670',
        title: superadmin.title,
        department: superadmin.department,
        avatar: superadmin.avatar,
        officeLocation: superadmin.officeLocation
      });
    }

    return superadmin;
  } catch (err) {
    console.warn('ensureSuperadminAccount notice:', err.message);
  }
};

export const findUserByIdentifier = async (identifier, role) => {
  if (!identifier) return null;
  const trimmed = identifier.trim();
  const query = {
    $or: [
      { email: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
      { customId: { $regex: new RegExp(`^${trimmed}$`, 'i') } }
    ]
  };

  if (role === 'resident') {
    const resident = await Resident.findOne(query);
    if (resident) return resident;
  } else if (role === 'driver') {
    const driver = await Driver.findOne(query);
    if (driver) return driver;
  } else if (role === 'admin' || role === 'superadmin' || role === 'cityadmin' || role === 'staff') {
    const adminStaff = await AdminStaff.findOne(query);
    if (adminStaff) return adminStaff;
  }

  // Cross-model resolution if role is unspecified or not matched in targeted model
  let user = await Resident.findOne(query);
  if (user) return user;
  user = await Driver.findOne(query);
  if (user) return user;
  user = await AdminStaff.findOne(query);
  if (user) return user;
  try {
    user = await User.findOne(query);
  } catch (err) {
    user = null;
  }
  return user;
};

export const login = async (req, res) => {
  const { email, password, loginIdentifier, role } = req.body;
  const identifier = (loginIdentifier || email || '').trim();

  try {
    // If logging in as superadmin or admin, or using superadmin credentials, ensure seeded
    if (
      role === 'superadmin' || 
      role === 'admin' || 
      identifier.toLowerCase().includes('superadmin') || 
      identifier.toLowerCase().includes('sterling') || 
      identifier.toUpperCase() === 'HQ-SUP-001'
    ) {
      await ensureSuperadminAccount();
    }

    const user = await findUserByIdentifier(identifier, role);

    if (user && (await user.matchPassword(password))) {
      const userRole = (user.role || '').toLowerCase();
      const requestedRole = (role || '').toLowerCase();

      // Flexible authorization check:
      // An 'admin' or 'superadmin' portal allows admin, superadmin, cityadmin, staff
      const adminFamily = ['admin', 'cityadmin', 'superadmin', 'staff'];
      if (requestedRole === 'admin' && !adminFamily.includes(userRole)) {
        return res.status(403).json({ 
          message: `This account has '${user.role}' permissions and cannot access the admin portal.` 
        });
      } else if (requestedRole === 'superadmin' && !['superadmin', 'admin', 'cityadmin'].includes(userRole)) {
        return res.status(403).json({ 
          message: `This account has '${user.role}' permissions and cannot access the superadmin portal.` 
        });
      } else if (requestedRole && !['admin', 'superadmin'].includes(requestedRole) && userRole !== requestedRole) {
        return res.status(403).json({ 
          message: `This account has '${user.role}' permissions and cannot access the ${role} portal.` 
        });
      }

      const { permissions, roleName } = await resolveUserRBAC(user);

      res.json({
        _id: user._id,
        customId: user.customId,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName,
        permissions,
        scope: user.scope || (['superadmin'].includes(userRole) ? 'superadmin' : 'cityadmin'),
        avatar: user.avatar,
        address: user.address,
        phone: user.phone || '',
        assignedVehicle: user.assignedVehicle || '',
        activeSector: user.activeSector || '',
        isOnDuty: Boolean(user.isOnDuty),
        gender: user.gender || '',
        aadharNumber: user.aadharNumber || '',
        drivingLicence: user.drivingLicence || '',
        dob: user.dob || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        bloodGroup: user.bloodGroup || '',
        experienceYears: user.experienceYears || 0,
        houseLocation: user.houseLocation || { lat: 28.6139, lng: 77.2090, address: user.address },
        title: user.title || roleName,
        department: user.department || 'Operations',
        officeLocation: user.officeLocation || '',
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please verify your Email/Login ID and password.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const demoLogin = async (req, res) => {
  const { role } = req.body;
  try {
    let user = null;
    if (role === 'resident') {
      user = await Resident.findOne() || await User.findOne({ role: 'resident' });
    } else if (role === 'driver') {
      user = await Driver.findOne() || await User.findOne({ role: 'driver' });
    } else if (role === 'superadmin') {
      user = await ensureSuperadminAccount();
      if (!user) {
        user = await AdminStaff.findOne({ $or: [{ role: 'superadmin' }, { scope: 'superadmin' }] }) ||
               await User.findOne({ role: 'superadmin' });
      }
    } else {
      user = await AdminStaff.findOne({ $or: [{ role: 'admin' }, { scope: 'cityadmin' }] }) ||
             await User.findOne({ role: { $in: ['admin', 'cityadmin'] } });
    }

    if (!user) {
      return res.status(404).json({ message: `No active account in database for role '${role}'. Please create/register one.` });
    }

    const { permissions, roleName } = await resolveUserRBAC(user);

    res.json({
      _id: user._id,
      customId: user.customId,
      name: user.name,
      email: user.email,
      role: user.role,
      roleName,
      permissions,
      scope: user.scope || (user.role === 'superadmin' ? 'superadmin' : 'cityadmin'),
      avatar: user.avatar,
      address: user.address,
      phone: user.phone || '',
      assignedVehicle: user.assignedVehicle || '',
      activeSector: user.activeSector || '',
      isOnDuty: Boolean(user.isOnDuty),
      gender: user.gender || '',
      aadharNumber: user.aadharNumber || '',
      drivingLicence: user.drivingLicence || '',
      dob: user.dob || '',
      emergencyContact: user.emergencyContact || '',
      emergencyPhone: user.emergencyPhone || '',
      bloodGroup: user.bloodGroup || '',
      experienceYears: user.experienceYears || 0,
      houseLocation: user.houseLocation || { lat: 28.6139, lng: 77.2090, address: user.address },
      title: user.title || roleName,
      department: user.department || 'Operations',
      officeLocation: user.officeLocation || '',
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User session not found or user deleted from database' });
    }
    const user = req.user;
    const { permissions, roleName } = await resolveUserRBAC(user);

    res.json({
      _id: user._id,
      customId: user.customId,
      name: user.name,
      email: user.email,
      role: user.role,
      roleName,
      permissions,
      scope: user.scope || (user.role === 'superadmin' ? 'superadmin' : 'cityadmin'),
      avatar: user.avatar,
      address: user.address,
      phone: user.phone || '',
      assignedVehicle: user.assignedVehicle || '',
      activeSector: user.activeSector || '',
      isOnDuty: Boolean(user.isOnDuty),
      gender: user.gender || '',
      aadharNumber: user.aadharNumber || '',
      drivingLicence: user.drivingLicence || '',
      dob: user.dob || '',
      emergencyContact: user.emergencyContact || '',
      emergencyPhone: user.emergencyPhone || '',
      bloodGroup: user.bloodGroup || '',
      experienceYears: user.experienceYears || 0,
      houseLocation: user.houseLocation || { lat: 28.6139, lng: 77.2090, address: user.address },
      title: user.title || roleName,
      department: user.department || 'Operations',
      officeLocation: user.officeLocation || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  const { name, email, password, role, address, phone, houseLocation } = req.body;
  try {
    const userRole = role || 'resident';
    const userExists = await findUserByIdentifier(email, userRole);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const customId = `${userRole.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;

    let user;
    if (userRole === 'driver') {
      user = await Driver.create({
        customId,
        name,
        email,
        password,
        role: 'driver',
        phone: phone || '',
        address: address || '',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
      });
      await User.create({
        _id: user._id,
        customId,
        name,
        email,
        password,
        role: 'driver',
        phone: phone || '',
        address: address || '',
        avatar: user.avatar
      }).catch(() => null);
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      user = await AdminStaff.create({
        customId,
        name,
        email,
        password,
        role: userRole,
        scope: userRole === 'superadmin' ? 'superadmin' : 'cityadmin',
        phone: phone || '',
        title: userRole === 'superadmin' ? 'Global Operations Director (HQ)' : 'Municipal Coordinator',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
      });
      await User.create({
        _id: user._id,
        customId,
        name,
        email,
        password,
        role: userRole,
        phone: phone || '',
        title: user.title,
        avatar: user.avatar
      }).catch(() => null);
    } else {
      user = await Resident.create({
        customId,
        name,
        email,
        password,
        role: 'resident',
        address: address || '',
        phone: phone || '',
        houseLocation: houseLocation || { lat: 28.6139, lng: 77.2090, address },
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
      });
      await User.create({
        _id: user._id,
        customId,
        name,
        email,
        password,
        role: 'resident',
        address: address || '',
        phone: phone || '',
        houseLocation: user.houseLocation,
        avatar: user.avatar
      }).catch(() => null);
    }

    res.status(201).json({
      _id: user._id,
      customId: user.customId,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      houseLocation: user.houseLocation,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMunicipalInfo = async (req, res) => {
  try {
    const admin = await AdminStaff.findOne({ role: { $in: ['admin', 'cityadmin'] } }) ||
                  await User.findOne({ role: { $in: ['admin', 'cityadmin'] } });
    const name = admin?.name || 'Greater Noida Municipal Authority';
    const city = admin?.city || 'Greater Noida';
    res.json({ name, city, success: true });
  } catch (err) {
    res.json({ name: 'Greater Noida Municipal Authority', city: 'Greater Noida', success: false });
  }
};
