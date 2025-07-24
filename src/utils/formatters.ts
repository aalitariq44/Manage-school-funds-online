// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatPhoneNumber = (phone: string): string => {
  // Format Saudi phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('5')) {
    return `+966 ${cleaned.substring(0, 1)} ${cleaned.substring(1, 4)} ${cleaned.substring(4, 8)}`;
  }
  return phone;
};
