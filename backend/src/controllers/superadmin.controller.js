import { City } from '../models/City.js';
import { AuditLog } from '../models/AuditLog.js';
import { Role, Staff } from '../models/RolePermission.js';

export const getSuperadminDashboard = async (req, res) => {
  try {
    const cities = await City.find().sort({ createdAt: -1 });
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 });

    const totalGlobalRevenue = cities.reduce((acc, c) => acc + (c.monthlyRevenue || 0), 0);
    const totalFleetCount = cities.reduce((acc, c) => acc + (c.fleetSize || 0), 0);

    res.json({
      globalStats: {
        totalCities: cities.length,
        activeMunicipalities: cities.filter(c => c.status === 'Active').length,
        totalGlobalRevenue,
        totalFleetCount,
      },
      cities,
      systemAuditLogs: auditLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCity = async (req, res) => {
  try {
    const { name, state, country, adminName, adminEmail, phone, contractTier, fleetSize, residentsCount, monthlyRevenue } = req.body;
    
    if (!name || !adminEmail) {
      return res.status(400).json({ message: 'City name and admin email are required' });
    }

    const count = await City.countDocuments();
    const customId = `CITY-00${count + 1}`;

    const newCity = await City.create({
      customId,
      name,
      state,
      country: country || 'N/A',
      adminName,
      adminEmail,
      phone,
      contractTier: contractTier || 'Standard',
      fleetSize: fleetSize || 0,
      residentsCount: residentsCount || 0,
      monthlyRevenue: monthlyRevenue || 0,
      status: 'Active',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    await AuditLog.create({
      customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      event: `Onboarded ${name} (${adminName})`,
      user: 'Superadmin',
      severity: 'Info',
      time: 'Just now'
    });

    res.status(201).json(newCity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleCityStatus = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (city) {
      const prevStatus = city.status;
      city.status = city.status === 'Active' ? 'Suspended' : 'Active';
      await city.save();

      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Changed status of ${city.name} from ${prevStatus} to ${city.status}`,
        user: 'Superadmin',
        severity: 'Security',
        time: 'Just now'
      });

      return res.json(city);
    }
    res.status(404).json({ message: 'City municipality not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCity = async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (city) {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Deleted Municipality ${city.name}`,
        user: 'Superadmin',
        severity: 'Critical',
        time: 'Just now'
      });
      return res.json({ message: 'City authority deleted successfully' });
    }
    res.status(404).json({ message: 'City municipality not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSuperadminRBACData = async (req, res) => {
  try {
    const roles = await Role.find({ scope: 'superadmin' }).sort({ createdAt: -1 });
    const staff = await Staff.find({ scope: 'superadmin' }).sort({ createdAt: -1 });

    const availablePermissions = [
      { id: 'manage_cities', name: 'Onboard & Suspend City Authorities', category: 'Tenant Management' },
      { id: 'manage_subscriptions', name: 'Modify SaaS Contracts & Pricing Tiers', category: 'SaaS Billing' },
      { id: 'access_audit_logs', name: 'View & Export Security Audit Logs', category: 'Security' },
      { id: 'global_analytics', name: 'Access Platform Revenue & Environmental Telemetry', category: 'Analytics' },
      { id: 'global_settings', name: 'Configure Multi-Tenant Security Rules', category: 'HQ Settings' },
      { id: 'rbac_administration', name: 'Manage HQ Staff Roles & Permission Policies', category: 'Administration' }
    ];

    res.json({
      roles,
      staff,
      availablePermissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSuperadminRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const customId = `HQROLE-${Math.floor(100 + Math.random() * 900)}`;

    const role = await Role.create({
      customId,
      name,
      scope: 'superadmin',
      description,
      permissions: permissions || []
    });

    await AuditLog.create({
      customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      event: `Created HQ Custom Staff Role '${name}'`,
      user: 'Superadmin',
      severity: 'Security',
      time: 'Just now'
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSuperadminRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const onboardSuperadminStaff = async (req, res) => {
  try {
    const { name, email, phone, department, roleName } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const customId = `HQEMP-${Math.floor(100 + Math.random() * 900)}`;

    const staffMember = await Staff.create({
      customId,
      name,
      email,
      phone,
      department: department || 'HQ Operations',
      roleName: roleName || 'HQ Inspector',
      scope: 'superadmin',
      city: 'HQ Global',
      status: 'Active'
    });

    await AuditLog.create({
      customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      event: `Onboarded HQ Staff Member ${name} (${roleName})`,
      user: 'Superadmin',
      severity: 'Info',
      time: 'Just now'
    });

    res.status(201).json(staffMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
