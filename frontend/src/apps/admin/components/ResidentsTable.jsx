import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Home, Mail, Phone, MapPin, AlertCircle, X } from 'lucide-react';

export default function ResidentsTable({
  residents = [],
  onAddResident,
  onRefresh,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const filteredResidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return residents;
    return residents.filter(r => 
      (r.name || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      (r.customId || '').toLowerCase().includes(term) ||
      (r.phone || '').toLowerCase().includes(term) ||
      (r.address || '').toLowerCase().includes(term) ||
      (r.houseLocation?.sector || '').toLowerCase().includes(term)
    );
  }, [residents, searchTerm]);

  const handleDeleteResident = async () => {
    if (!residentToDelete) return;
    try {
      setDeleteSubmitting(true);
      const id = residentToDelete._id || residentToDelete.customId;
      const res = await fetch(`/api/admin/residents/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove resident');

      if (showToast) showToast(data.message || `✅ Resident ${residentToDelete.name} removed successfully`, 'success');
      setResidentToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#0F172A]">Enrolled City Residents</h3>
            <span className="text-[11px] text-slate-400">
              {residents.length} registered residential properties in database
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, ID, sector..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>

          <button 
            onClick={onAddResident}
            className="bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Resident
          </button>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">CITIZEN</th>
                <th className="px-6 py-3.5">LOGIN ID</th>
                <th className="px-6 py-3.5">CONTACT</th>
                <th className="px-6 py-3.5">PROPERTY ADDRESS & SECTOR</th>
                <th className="px-6 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResidents && filteredResidents.length > 0 ? (
                filteredResidents.map(res => (
                  <tr key={res._id || res.customId} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {res.name ? res.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{res.name}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {res.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {res.customId || 'RES'}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {res.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {res.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No phone</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-medium text-slate-800 block">
                            {res.address || res.houseLocation?.address || 'Registered Residential Stop'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Sector: {res.houseLocation?.sector || res.sector || 'Unassigned Sector'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setResidentToDelete(res)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                        title="Delete Resident"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="font-medium block">No resident accounts enrolled yet.</span>
                    <span className="text-[11px] text-slate-400">All registered citizen properties will appear here directly from the database.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Resident Confirmation Modal */}
      {residentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-slate-900">Delete Resident Citizen</h3>
              </div>
              <button 
                onClick={() => setResidentToDelete(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete resident citizen <strong className="text-slate-900">{residentToDelete.name}</strong> ({residentToDelete.customId || residentToDelete.email})?
              </p>
              
              <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 text-[11px] text-rose-800 space-y-1">
                <span className="font-bold block">Consequences of deletion:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-rose-700">
                  <li>House GPS coordinates and scheduled municipal stops will be removed.</li>
                  <li>Account will be completely wiped from the database.</li>
                  <li>Any open complaints or emergency requests will be unlinked.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResidentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteResident}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteSubmitting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
