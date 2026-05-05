/**
 * Utility to parse notification/SMS text for bill and transaction data.
 * Designed for local, on-device processing to ensure privacy.
 */

export interface ParsedBill {
  name: string;
  amount: number;
  type: 'loan' | 'bill' | 'emi';
  date: Date;
}

const BILL_KEYWORDS = ['bill', 'electricity', 'water', 'gas', 'broadband', 'recharge', 'eb'];
const LOAN_KEYWORDS = ['loan', 'emi', 'installment', 'mortgage', 'repayment'];

export function parseFinancialText(text: string): ParsedBill | null {
  const lowerText = text.toLowerCase();
  
  // 1. Identify Type
  let type: 'loan' | 'bill' | 'emi' = 'bill';
  if (LOAN_KEYWORDS.some(k => lowerText.includes(k))) type = 'emi';
  else if (BILL_KEYWORDS.some(k => lowerText.includes(k))) type = 'bill';
  else return null; // Not a recognized financial message

  // 2. Extract Amount
  // Matches patterns like "Rs. 500", "Rs 500", "INR 500", "amounting to 500", "of 500"
  const amountRegex = /(?:rs\.?|inr|amt|amount|of)\s*[:\s]*([\d,]+(?:\.\d{1,2})?)/i;
  const amountMatch = text.match(amountRegex);
  let amount = 0;
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  if (amount <= 0) return null;

  // 3. Extract Name (Simplified)
  // Look for words before "bill" or after "to"
  let name = 'Unrecognized Bill';
  if (lowerText.includes('electricity') || lowerText.includes('eb')) name = 'Electricity Bill';
  else if (lowerText.includes('water')) name = 'Water Bill';
  else if (lowerText.includes('gas')) name = 'Gas Bill';
  else if (lowerText.includes('recharge')) name = 'Mobile Recharge';
  else if (type === 'emi') name = 'Loan EMI';

  return {
    name,
    amount,
    type,
    date: new Date(),
  };
}
