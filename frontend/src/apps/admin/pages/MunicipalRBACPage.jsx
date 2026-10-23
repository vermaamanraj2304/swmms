import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Building2, 
  Briefcase, 
  Mail, 
  Phone, 
  Lock, 
  Check, 
  Layers, 
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ClipboardList
} from 'lucide-react';

export default function MunicipalRBACPage({ 
  rbacData, 
  initialSection = 'all_staff',
  onRefresh, 
  showToast 
}) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals State
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Standard Municipal Departments strictly aligned with the Admin Sidebar navigation
  const MUNICIPAL_DEPARTMENTS = [
    'Complaint Management',
    'Emergency Management',
    'Reward & Points',
    'Vehicle Management',
    'Driver Management',
    'Resident Management',
    'Service Areas & Sectors',
    'Finance Management',
    'Staff Management & RBAC',
    'Logs & Audit Trail'
  ];

  // Registration Forms State
  const initialStaffForm = {
    name: '',
    email: '',
    password: 'Staff@123',
    phone: '',
    department: 'Complaint Management',
    roleName: '',
    city: 'Central Municipal Ward',
    status: 'Active'
  };
  const [regStaffForm, setRegStaffForm] = useState(initialStaffForm);

  const initialRoleForm = {
    name: '',
    department: 'Complaint Management',
    description: '',
    permissions: ['resolve_complaints']
  };
  const [regRoleForm, setRegRoleForm] = useState(initialRoleForm);
  const [selectedRoleIdForEdit, setSelectedRoleIdForEdit] = useState('NEW');
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [selectedPermissionCategory, setSelectedPermissionCategory] = useState('ALL');

  const roles = rbacData?.roles || [];
  const staff = rbacData?.staff || [];
  const availablePermissions = rbacData?.availablePermissions || [];

  // Initialize default roleName when roles load
  useEffect(() => {
    if (roles.length > 0 && !regStaffForm.roleName) {
      const defaultRole = roles.find(r => r.department === 'Complaint Management') || roles[0];
      setRegStaffForm(prev => ({ ...prev, roleName: defaultRole?.name || 'Complaint Resolution Officer' }));
    }
  }, [roles]);

  // Auto-sync matching RBAC Role when Department changes
  const handleDepartmentChange = (newDept) => {
    const matchingRole = roles.find(r => r.department === newDept) || 
      roles.find(r => r.name.toLowerCase().includes(newDept.split(' ')[0].toLowerCase())) ||
      roles[0];
    
    setRegStaffForm(prev => ({
      ...prev,
      department: newDept,
      roleName: matchingRole ? matchingRole.name : prev.roleName
    }));
  };

  // Group permissions by category for clear hierarchical display
  const permissionsByCategory = availablePermissions.reduce((acc, perm) => {
    const cat = perm.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {});

  // Select an existing role to edit its granted permissions, or switch to create new role
  const handleSelectRoleForEdit = (roleId) => {
    setSelectedRoleIdForEdit(roleId);
    if (!roleId || roleId === 'NEW') {
      setRegRoleForm(initialRoleForm);
    } else {
      const foundRole = roles.find(r => r._id === roleId);
      if (foundRole) {
        setRegRoleForm({
          _id: foundRole._id,
          name: foundRole.name,
          department: foundRole.department || 'Complaint Management',
          description: foundRole.description || '',
          permissions: Array.isArray(foundRole.permissions) ? [...foundRole.permissions] : [],
          isSystemDefault: foundRole.isSystemDefault || false,
          customId: foundRole.customId || ''
        });
      }
    }
  };

  // Toggle all permissions within a specific category
  const toggleCategoryPermissions = (category, categoryPerms) => {
    const catPermIds = categoryPerms.map(p => p.id);
    const allSelected = catPermIds.every(id => regRoleForm.permissions.includes(id));
    
    setRegRoleForm(prev => {
      let updated;
      if (allSelected) {
        updated = prev.permissions.filter(id => !catPermIds.includes(id));
      } else {
        const toAdd = catPermIds.filter(id => !prev.permissions.includes(id));
        updated = [...prev.permissions, ...toAdd];
      }
      return { ...prev, permissions: updated };
    });
  };

  // Filter available permissions by search term and selected category
  const filteredPermissions = availablePermissions.filter(p => {
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(permissionSearchTerm.toLowerCase());
    
    const matchesCategory = selectedPermissionCategory === 'ALL' || p.category === selectedPermissionCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPermissionsByCategory = filteredPermissions.reduce((acc, perm) => {
    const cat = perm.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {});

  // --- Handlers: Staff Registration ---
  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regStaffForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast('Staff employee successfully registered and onboarded!', 'success');
        const defaultRole = roles.find(r => r.department === 'Complaint Management') || roles[0];
        setRegStaffForm({
          ...initialStaffForm,
          department: 'Complaint Management',
          roleName: defaultRole?.name || 'Complaint Resolution Officer'
        });
        if (onRefresh) onRefresh();
        setActiveSection('all_staff');
      } else {
        if (showToast) showToast(data.message || 'Failed to onboard staff employee', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network or server error onboarding staff employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Edit Staff ---
  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${editingStaff._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStaff)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast('Staff employee record updated!', 'success');
        setShowEditStaffModal(false);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to update staff record', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error updating staff employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Delete Staff ---
  const handleDeleteStaff = async (st) => {
    if (!window.confirm(`Are you sure you want to remove employee ${st.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/staff/${st._id}`, { method: 'DELETE' });
      if (res.ok) {
        if (showToast) showToast(`Staff employee ${st.name} removed.`, 'info');
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast('Failed to delete staff employee', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error deleting staff employee', 'error');
    }
  };

  // --- Handlers: Save Role (Create or Update Granted Permissions) ---
  const handleSaveRole = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEditing = selectedRoleIdForEdit && selectedRoleIdForEdit !== 'NEW';
      const endpoint = isEditing ? `/api/admin/roles/${selectedRoleIdForEdit}` : '/api/admin/roles';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regRoleForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) {
          showToast(
            isEditing 
              ? `Role "${regRoleForm.name}" & granted permissions updated successfully!` 
              : `New role policy "${regRoleForm.name}" created successfully!`, 
            'success'
          );
        }
        if (onRefresh) onRefresh();
        if (!isEditing) {
          setRegRoleForm(initialRoleForm);
          setSelectedRoleIdForEdit('NEW');
        }
      } else {
        if (showToast) showToast(data.message || 'Failed to save role policy', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error saving role policy', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterRole = handleSaveRole;

  // --- Handlers: Edit Role ---
  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRole) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/roles/${editingRole._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast('Role policy updated successfully!', 'success');
        setShowEditRoleModal(false);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to update role', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error updating role policy', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Delete Role ---
  const handleDeleteRole = async (r) => {
    if (r.isSystemDefault) {
      if (showToast) showToast('Cannot delete default system roles', 'error');
      return;
    }
    if (!window.confirm(`Delete custom role ${r.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/roles/${r._id}`, { method: 'DELETE' });
      if (res.ok) {
        if (showToast) showToast(`Role policy ${r.name} deleted`, 'info');
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast('Failed to delete role', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error deleting role', 'error');
    }
  };

  // Toggle permission in role registration form
  const toggleRegPermission = (permId) => {
    setRegRoleForm(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  // Toggle permission in role edit modal
  const toggleEditPermission = (permId) => {
    setEditingRole(prev => {
      const exists = (prev.permissions || []).includes(permId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== permId)
          : [...(prev.permissions || []), permId]
      };
    });
  };

  // Filtered staff list
  const filteredStaff = staff.filter(st => {
    const matchesSearch = 
      (st.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.roleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.customId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = departmentFilter === 'ALL' || st.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* ========================================================= */}
      {/* SECTION 1: ALL STAFF (Staff Directory Table & Roster) */}
      {/* ========================================================= */}
      {activeSection === 'all_staff' && (
        <div className="space-y-6">
          {/* Header & Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" /> MUNICIPAL WORKFORCE & PERSONNEL
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">All Staff Directory</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Roster of municipal administrative officers, dispatchers, field supervisors, and portal operators.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={() => setActiveSection('staff_registration')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Register New Staff
              </button>
              <button
                onClick={() => setActiveSection('role_registration')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Key className="w-4 h-4 text-blue-600" /> Create Role
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL STAFF</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">{staff.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Municipal personnel</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CONFIGURED ROLES</span>
                <Shield className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-indigo-600">{roles.length}</h3>
              <span className="text-xs text-indigo-600/80 mt-1 inline-block">Active access policies</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SECURITY PERMISSIONS</span>
                <Key className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600">{availablePermissions.length}</h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Granular action tokens</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE ACCOUNTS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {staff.filter(s => s.status === 'Active').length}
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Portal authentication ready</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search staff by name, email, role, id..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-blue-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-blue-500 shadow-2xs"
                >
                  <option value="ALL">All Departments (10)</option>
                  {MUNICIPAL_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 mx-1">|</span>
                <span className="text-xs font-bold text-slate-500">Status:</span>
                {['ALL', 'Active', 'Inactive'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      statusFilter === st 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredStaff.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">No Municipal Staff Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {searchTerm || departmentFilter !== 'ALL' || statusFilter !== 'ALL'
                      ? 'No staff records match your selected search or filter criteria.'
                      : 'Onboard municipal employees such as dispatchers, field supervisors, and helpdesk officers.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('staff_registration')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Register First Employee
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">EMPLOYEE ID & NAME</th>
                      <th className="px-6 py-4">DEPARTMENT</th>
                      <th className="px-6 py-4">ASSIGNED ROLE</th>
                      <th className="px-6 py-4">OFFICIAL CONTACT</th>
                      <th className="px-6 py-4">STATUS</th>
                      <th className="px-6 py-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStaff.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <strong className="text-slate-900 block font-bold text-xs">{st.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{st.customId || 'EMP-100'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 block">{st.department}</span>
                          <span className="text-[10px] text-slate-400">{st.city || 'Central Ward'}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200/80 text-[11px] font-bold inline-flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            {st.roleName}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="text-slate-700 block flex items-center gap-1.5 font-medium">
                              <Mail className="w-3 h-3 text-slate-400" /> {st.email}
                            </span>
                            {st.phone && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" /> {st.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                            st.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {st.status || 'Active'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingStaff({ ...st });
                                setShowEditStaffModal(true);
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                              title="Edit Staff Member"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(st)}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: STAFF REGISTRATION (Enrollment Form) */}
      {/* ========================================================= */}
      {activeSection === 'staff_registration' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0F172A]">Staff Employee Registration</h3>
              <p className="text-xs text-slate-400">
                Onboard a municipal officer, fleet dispatcher, or administrative staff member with portal credentials.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterStaff} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra or Priya Nair"
                  value={regStaffForm.name}
                  onChange={(e) => setRegStaffForm({ ...regStaffForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@cleancty.gov or staff@swmms.gov.in"
                  value={regStaffForm.email}
                  onChange={(e) => setRegStaffForm({ ...regStaffForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98123 45678"
                  value={regStaffForm.phone}
                  onChange={(e) => setRegStaffForm({ ...regStaffForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Portal Login Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regStaffForm.password}
                    onChange={(e) => setRegStaffForm({ ...regStaffForm, password: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Default initial password: Staff@123</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Municipal Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={regStaffForm.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-medium text-slate-800"
                >
                  {MUNICIPAL_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Aligned to Admin Sidebar Divisions</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned RBAC Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={regStaffForm.roleName}
                  onChange={(e) => setRegStaffForm({ ...regStaffForm, roleName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-semibold text-slate-800"
                >
                  {roles.map(r => (
                    <option key={r._id} value={r.name}>
                      {r.name} {r.department ? `[${r.department}]` : ''} ({r.customId})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Security scope & operational clearance</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Account Status
                </label>
                <select
                  value={regStaffForm.status}
                  onChange={(e) => setRegStaffForm({ ...regStaffForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-medium text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City / Municipal Ward Jurisdiction
              </label>
              <input
                type="text"
                placeholder="e.g. Central Municipal Ward or Ward 14 - Greenfield"
                value={regStaffForm.city}
                onChange={(e) => setRegStaffForm({ ...regStaffForm, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('all_staff')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel & View All Staff
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Registering...' : 'Complete Staff Onboarding'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: ROLE REGISTRATION & PERMISSION MATRIX */}
      {/* ========================================================= */}
      {activeSection === 'role_registration' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            
            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">
                    {selectedRoleIdForEdit && selectedRoleIdForEdit !== 'NEW' 
                      ? `Edit Granted Permissions: ${regRoleForm.name}` 
                      : 'Create Municipal Role Policy'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedRoleIdForEdit && selectedRoleIdForEdit !== 'NEW'
                      ? 'Configure and edit granted functional capability tokens for this role. Updates propagate to all assigned staff.'
                      : 'Define a custom municipal role policy and assign granular security tokens to control portal access.'}
                  </p>
                </div>
              </div>

              {/* Mode / Quick Switcher */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => handleSelectRoleForEdit('NEW')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedRoleIdForEdit === 'NEW'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> New Role
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('other')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" /> All Roles ({roles.length})
                </button>
              </div>
            </div>

            {/* Role Target Selector Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-indigo-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Select Role to Edit Granted Permissions:
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Switch between any existing municipal role or create a new policy
                  </span>
                </div>
              </div>

              <div className="w-full md:w-80">
                <select
                  value={selectedRoleIdForEdit}
                  onChange={(e) => handleSelectRoleForEdit(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-indigo-500 shadow-2xs"
                >
                  <option value="NEW">+ Register New Role Policy</option>
                  <optgroup label="Municipal Roles">
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.name} {r.department ? `[${r.department}]` : ''} ({r.permissions?.length || 0} Perms)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-6">
              {/* Role Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Role Title / Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Zone Inspector, Night Dispatcher"
                    value={regRoleForm.name}
                    onChange={(e) => setRegRoleForm({ ...regRoleForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Municipal Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regRoleForm.department}
                    onChange={(e) => setRegRoleForm({ ...regRoleForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500 font-semibold text-slate-800"
                  >
                    {MUNICIPAL_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jurisdiction Scope
                  </label>
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-600 font-medium">
                    <span>City Admin Division</span>
                    {selectedRoleIdForEdit !== 'NEW' && regRoleForm.customId && (
                      <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">
                        {regRoleForm.customId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Role Description & Operational Authority
                </label>
                <textarea
                  rows="2"
                  placeholder="Summarize the administrative responsibilities and access scope of this role..."
                  value={regRoleForm.description}
                  onChange={(e) => setRegRoleForm({ ...regRoleForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500"
                />
              </div>

              {/* ========================================================= */}
              {/* NEW SECTION: ALL SYSTEM PERMISSIONS & CAPABILITY MATRIX */}
              {/* ========================================================= */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                      SECURITY CLEARANCE & ACCESS MATRIX
                    </span>
                    <h4 className="text-base font-bold flex items-center gap-2 mt-0.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      All System Permissions ({regRoleForm.permissions.length} of {availablePermissions.length} Granted)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Check or uncheck functional permissions to modify granted access for <strong>{regRoleForm.name || 'this role'}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegRoleForm({ ...regRoleForm, permissions: availablePermissions.map(p => p.id) })}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Grant All Permissions
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRoleForm({ ...regRoleForm, permissions: [] })}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Progress bar of granted permissions */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((regRoleForm.permissions.length / (availablePermissions.length || 1)) * 100)}%` }}
                  />
                </div>

                {/* Active Granted Permissions Chips Bar */}
                {regRoleForm.permissions.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-indigo-600" /> Active Granted Tokens:
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        Click '×' on any chip to revoke
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {regRoleForm.permissions.map(permId => {
                        const permObj = availablePermissions.find(p => p.id === permId);
                        return (
                          <span
                            key={permId}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-xl shadow-2xs"
                          >
                            <span>{permObj?.name || permId}</span>
                            <span className="text-[9px] font-mono opacity-60">({permId})</span>
                            <button
                              type="button"
                              onClick={() => toggleRegPermission(permId)}
                              className="text-slate-400 hover:text-rose-600 ml-0.5 rounded-full p-0.5"
                              title="Revoke Permission"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search permissions by name, token..."
                      value={permissionSearchTerm}
                      onChange={(e) => setPermissionSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Module:</span>
                    <select
                      value={selectedPermissionCategory}
                      onChange={(e) => setSelectedPermissionCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:bg-white focus:outline-indigo-500"
                    >
                      <option value="ALL">All Modules ({availablePermissions.length})</option>
                      {Object.keys(permissionsByCategory).map(cat => (
                        <option key={cat} value={cat}>
                          {cat} ({permissionsByCategory[cat].length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* All Permissions Cards Grouped by Department */}
                <div className="space-y-4 pt-2">
                  {Object.entries(filteredPermissionsByCategory).map(([category, perms]) => {
                    const allCatGranted = perms.every(p => regRoleForm.permissions.includes(p.id));
                    const catGrantedCount = perms.filter(p => regRoleForm.permissions.includes(p.id)).length;

                    return (
                      <div key={category} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              {category}
                            </h5>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-bold">
                              {catGrantedCount} / {perms.length} Active
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleCategoryPermissions(category, perms)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                          >
                            {allCatGranted ? 'Deselect Category' : 'Select All in Category'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {perms.map(p => {
                            const isChecked = regRoleForm.permissions.includes(p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => toggleRegPermission(p.id)}
                                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition select-none flex flex-col justify-between space-y-2.5 ${
                                  isChecked
                                    ? 'border-indigo-500 bg-indigo-50/70 text-slate-900 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <h6 className="font-bold text-slate-900 leading-snug">
                                      {p.name}
                                    </h6>
                                    <span className="font-mono text-[10px] text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded inline-block font-semibold">
                                      {p.id}
                                    </span>
                                  </div>
                                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                                    isChecked ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                </div>

                                {p.description && (
                                  <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                                    {p.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSection('other')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting
                    ? 'Saving...'
                    : selectedRoleIdForEdit && selectedRoleIdForEdit !== 'NEW'
                    ? 'Save & Update Role Permissions'
                    : 'Create Custom Role Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: OTHER (Roles & Permission Policies / Governance) */}
      {/* ========================================================= */}
      {activeSection === 'other' && (
        <div className="space-y-6">
          {/* Header & Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" /> RBAC ROLES & PERMISSION POLICIES
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Role Policies & Security Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review system core policies, custom operational roles, and the granular permissions reference matrix.
              </p>
            </div>

            <button
              onClick={() => setActiveSection('role_registration')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Create Custom Role
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((r) => (
              <div 
                key={r._id} 
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">{r.customId}</span>
                          {r.department && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                              {r.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {r.isSystemDefault && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                          System Core
                        </span>
                      )}

                      <button
                        onClick={() => {
                          handleSelectRoleForEdit(r._id);
                          setActiveSection('role_registration');
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 transition shadow-2xs"
                        title="Edit Role & Granted Permissions in Matrix"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Permissions</span>
                      </button>

                      {!r.isSystemDefault && (
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Custom Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    {r.description || 'Standard municipal operations role with defined permission scopes.'}
                  </p>

                  {/* Granted Permissions */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      GRANTED PERMISSION TOKENS ({r.permissions?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.permissions && r.permissions.length > 0 ? (
                        r.permissions.map(permId => {
                          const permObj = availablePermissions.find(p => p.id === permId);
                          return (
                            <span 
                              key={permId}
                              className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              {permObj ? permObj.name : permId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic">No permissions granted</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Scope: <strong className="text-slate-700">City Admin</strong></span>
                  <span className="text-blue-600 font-bold">
                    {staff.filter(s => s.roleName === r.name).length} Employees Assigned
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions Reference Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> Security Permissions Master Catalog
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete list of municipal system permission tokens, operational modules, and which roles inherit them.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">PERMISSION TOKEN</th>
                    <th className="px-6 py-4">CAPABILITY NAME</th>
                    <th className="px-6 py-4">MODULE / CATEGORY</th>
                    <th className="px-6 py-4 text-right">INHERITING ROLES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {availablePermissions.map(p => {
                    const matchedRoles = roles.filter(r => (r.permissions || []).includes(p.id));
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-700">
                          {p.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                            {p.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {matchedRoles.map(r => (
                              <span key={r._id} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT STAFF EMPLOYEE */}
      {/* ========================================================= */}
      {showEditStaffModal && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Edit Staff Member</h3>
                  <p className="text-xs text-slate-400">Update employee details, department, or assigned role</p>
                </div>
              </div>
              <button onClick={() => setShowEditStaffModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={editingStaff.email}
                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={editingStaff.department}
                    onChange={e => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-medium text-slate-800"
                  >
                    {MUNICIPAL_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={editingStaff.roleName}
                    onChange={e => setEditingStaff({ ...editingStaff, roleName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-semibold text-slate-800"
                  >
                    {roles.map(r => (
                      <option key={r._id} value={r.name}>
                        {r.name} {r.department ? `[${r.department}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Municipal Ward</label>
                  <input
                    type="text"
                    value={editingStaff.city || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingStaff.status || 'Active'}
                    onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT ROLE POLICY */}
      {/* ========================================================= */}
      {showEditRoleModal && editingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Edit Role: {editingRole.name}</h3>
                  <p className="text-xs text-slate-400">Configure granted security tokens and access capabilities</p>
                </div>
              </div>
              <button onClick={() => setShowEditRoleModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditRoleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={editingRole.name}
                    onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Municipal Department</label>
                  <select
                    value={editingRole.department || 'Complaint Management'}
                    onChange={e => setEditingRole({ ...editingRole, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-indigo-500 text-slate-800"
                  >
                    {MUNICIPAL_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editingRole.description || ''}
                  onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Granted Permissions ({editingRole.permissions?.length || 0} Selected)
                </label>
                <div className="space-y-4 max-h-60 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map(p => {
                          const isChecked = (editingRole.permissions || []).includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => toggleEditPermission(p.id)}
                              className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center justify-between ${
                                isChecked 
                                  ? 'border-indigo-500 bg-indigo-50/70 text-slate-900 shadow-xs' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                              }`}
                            >
                              <span>{p.name}</span>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                              }`}>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditRoleModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Role Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
