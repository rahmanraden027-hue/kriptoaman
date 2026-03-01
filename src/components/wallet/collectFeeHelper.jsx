import { base44 } from '@/api/base44Client';

export const collectTransactionFee = async (transactionType, currency, transactionAmount, transactionId) => {
  try {
    const response = await base44.functions.invoke('collectTransactionFee', {
      transactionType,
      currency,
      transactionAmount,
      transactionId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error collecting fee:', error);
    throw error;
  }
};