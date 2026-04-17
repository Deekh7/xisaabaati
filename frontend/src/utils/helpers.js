export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || isNaN(amount)) return '$0';
  if (currency === 'USD') return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return `${Number(amount).toLocaleString()} ${currency}`;
}

export function formatDate(dateInput, lang = 'en') {
  if (!dateInput) return '';
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  const localeMap = { en: 'en-US', so: 'en-US', ar: 'ar-EG' };
  return date.toLocaleDateString(localeMap[lang] || 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function generateInvoiceNumber(prefix = 'INV') {
  const now = new Date();
  const yy   = now.getFullYear().toString().slice(-2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${yy}${mm}-${rand}`;
}

export function calcInvoiceTotal(items = []) {
  return items.reduce((sum, item) => {
    return sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || item.qty || 1));
  }, 0);
}

export function getStatusColor(status) {
  switch (status) {
    case 'paid':    return '#22c55e';
    case 'unpaid':  return '#ef4444';
    case 'partial': return '#f59e0b';
    default:        return '#94a3b8';
  }
}

export function isToday(dateInput) {
  if (!dateInput) return false;
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  return date.toDateString() === new Date().toDateString();
}

export function isThisWeek(dateInput) {
  if (!dateInput) return false;
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

export function isThisMonth(dateInput) {
  if (!dateInput) return false;
  const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function groupByDay(invoices, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayTotal = invoices
      .filter(inv => {
        const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
        return invDate.toDateString() === d.toDateString() && inv.status === 'paid';
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    result.push({ label, revenue: dayTotal });
  }
  return result;
}

// Business type config — single source of truth used by all screens
export const BIZ_TYPES = {
  grocery:    { emoji:'🛒', docLabel:'Invoice',      itemLabel:'Products', clientLabel:'Customer',  quickItems:['Rice 5kg','Sugar 2kg','Flour 5kg','Oil 1L','Tea 500g','Milk 1L'],       color:'#15803d', bg:'#f0fdf4' },
  retail:     { emoji:'🏪', docLabel:'Receipt',       itemLabel:'Items',    clientLabel:'Customer',  quickItems:['Clothing','Shoes','Accessories','Electronics','Bags','Watches'],        color:'#1d4ed8', bg:'#eff6ff' },
  wholesale:  { emoji:'📦', docLabel:'Order',         itemLabel:'Products', clientLabel:'Dealer',    quickItems:['Case 24x','Pallet','Box 12x','Drum 200L','Sack 50kg','Carton'],        color:'#7c3aed', bg:'#f5f3ff' },
  pharmacy:   { emoji:'💊', docLabel:'Prescription',  itemLabel:'Medicines',clientLabel:'Patient',   quickItems:['Paracetamol','Amoxicillin','Vitamin C','Ibuprofen','ORS','Antacid'],   color:'#0891b2', bg:'#ecfeff' },
  restaurant: { emoji:'🍽️', docLabel:'Order',         itemLabel:'Menu Items',clientLabel:'Table',   quickItems:['Rice + Meat','Pasta','Burger','Pizza','Juice','Tea'],                   color:'#dc2626', bg:'#fef2f2' },
  services:   { emoji:'🔧', docLabel:'Invoice',       itemLabel:'Services', clientLabel:'Client',    quickItems:['Consultation','Installation','Repair','Maintenance','Delivery','Support'], color:'#d97706', bg:'#fffbeb' },
  salon:      { emoji:'✂️', docLabel:'Receipt',       itemLabel:'Services', clientLabel:'Client',    quickItems:['Haircut','Color','Styling','Manicure','Pedicure','Facial'],             color:'#db2777', bg:'#fdf2f8' },
  other:      { emoji:'🏢', docLabel:'Invoice',       itemLabel:'Items',    clientLabel:'Customer',  quickItems:['Service 1','Service 2','Product 1','Product 2','Item A','Item B'],      color:'#14532d', bg:'#f0fdf4' },
};

export function getBizConfig(bizTypeId) {
  return BIZ_TYPES[bizTypeId] || BIZ_TYPES.other;
}
