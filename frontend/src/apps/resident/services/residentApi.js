export const getAuthHeaders = () => {
  const token = localStorage.getItem('tmt_resident_token') || localStorage.getItem('tmt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleAuthError = (res) => {
  if (res.status === 401) {
    const token = localStorage.getItem('tmt_resident_token') || localStorage.getItem('tmt_token');
    if (!token && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?portal=resident';
    }
  }
};

export const fetchResidentDashboard = async () => {
  const res = await fetch('/api/resident/dashboard', { headers: getAuthHeaders() });
  handleAuthError(res);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load dashboard data');
  }
  return data;
};

export const redeemPoints = async (rewardId) => {
  const res = await fetch('/api/resident/redeem-points', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ rewardId })
  });
  handleAuthError(res);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to redeem reward');
  }
  return data;
};

export const submitEmergency = async (payload) => {
  const res = await fetch('/api/resident/emergency-request', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit emergency request');
  }
  return data;
};

export const submitComplaint = async (payload) => {
  const res = await fetch('/api/resident/submit-complaint', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit complaint ticket');
  }
  return data;
};

export const deleteComplaint = async (complaintId) => {
  const res = await fetch(`/api/resident/delete-complaint/${complaintId}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete complaint ticket');
  }
  return data;
};

export const deleteEmergency = async (emergencyId) => {
  const res = await fetch(`/api/resident/delete-emergency-request/${emergencyId}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete emergency pickup request');
  }
  return data;
};

export const fetchPointsHistory = async () => {
  const res = await fetch('/api/resident/points-history', {
    headers: getAuthHeaders()
  });
  handleAuthError(res);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load points transaction history');
  }
  return data;
};


