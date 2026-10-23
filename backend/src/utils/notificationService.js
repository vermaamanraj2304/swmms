export const sendCredentialsNotification = async ({
  recipientType, // 'resident', 'driver', or 'staff'
  name,
  email,
  phone,
  customId,
  password,
  details = {}
}) => {
  const portalUrl = process.env.CLIENT_URL || process.env.PORTAL_URL || 'http://localhost:3000';
  let roleName = 'Municipal Staff Employee';
  if (recipientType === 'resident') roleName = 'Resident Citizen';
  else if (recipientType === 'driver') roleName = 'Fleet Driver Operator';
  else if (recipientType === 'staff') roleName = details.roleName || 'Municipal Staff Employee';

  const messageText = `Hello ${name}! Welcome to SWM&MS Municipal System.
Your ${roleName} account has been registered by City Administration.
Login ID: ${customId} / ${email}
Password: ${password}
Portal Link: ${portalUrl}/login/admin
${details.department ? `Assigned Department: ${details.department}` : ''}
${details.address ? `Registered House Address: ${details.address}` : ''}
${details.vehicle ? `Assigned Vehicle: ${details.vehicle} (Sector: ${details.sector || 'Assigned'})` : ''}
Please log in to start administrative and operational duties.`;

  console.log(`\n======================================================`);
  console.log(`📨 [MUNICIPAL NOTIFICATION SERVICE] DISPATCHING CREDENTIALS`);
  console.log(`Role: ${roleName}`);
  console.log(`Recipient: ${name} <${email}>`);
  console.log(`Phone (WhatsApp): ${phone || 'Not provided'}`);
  console.log(`Generated Credentials -> ID: ${customId} | Password: ${password}`);
  console.log(`Message Preview:\n${messageText}`);
  console.log(`======================================================\n`);

  // WhatsApp click-to-chat URL format: https://wa.me/<phone>?text=<encoded_text>
  let whatsappUrl = null;
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  }

  // Mailto link format
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(`Your SWM&MS ${roleName} Credentials`)}&body=${encodeURIComponent(messageText)}`;

  return {
    success: true,
    emailSent: true,
    whatsAppSent: Boolean(phone),
    whatsappUrl,
    mailtoUrl,
    messageText,
    timestamp: new Date().toISOString()
  };
};
