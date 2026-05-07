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

const BILL_KEYWORDS = ['bill', 'electricity', 'water', 'gas', 'broadband', 'recharge', 'eb', 'utility', 'postpaid', 'internet'];
const LOAN_KEYWORDS = ['loan', 'emi', 'installment', 'mortgage', 'repayment', 'credit card', 'statement', 'minimum due'];

export function parseFinancialText(text: string): ParsedBill | null {
  const lowerText = text.toLowerCase();
  
  // 1. Identify Type
  let type: 'loan' | 'bill' | 'emi' = 'bill';
  const isLoan = LOAN_KEYWORDS.some(k => lowerText.includes(k));
  const isBill = BILL_KEYWORDS.some(k => lowerText.includes(k));
  
  if (isLoan) type = 'emi';
  else if (isBill) type = 'bill';
  else {
    if (!lowerText.includes('due')) return null;
  }

  // 2. Extract Amount
  const amountRegex = /(?:rs\.?|inr|amt|amount|of|due|spent)\s*[:\s]*([\d,]+(?:\.\d{1,2})?)/i;
  const amountMatch = text.match(amountRegex);
  let amount = 0;
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  if (amount <= 0) return null;

  // 3. Extract Name
  let name = 'Smart Detected Bill';
  if (lowerText.includes('electricity') || lowerText.includes('eb')) name = 'Electricity Bill';
  else if (lowerText.includes('water')) name = 'Water Bill';
  else if (lowerText.includes('gas')) name = 'Gas Bill';
  else if (lowerText.includes('broadband') || lowerText.includes('airtel') || lowerText.includes('jio')) name = 'Internet/Recharge';
  else if (lowerText.includes('credit card')) name = 'Credit Card Bill';
  else if (lowerText.includes('loan') || lowerText.includes('hdfc') || lowerText.includes('sbi') || lowerText.includes('icici')) {
    name = isLoan ? 'Loan EMI' : 'Bank Bill';
  } else if (type === 'emi') name = 'Installment';

  // 4. Extract Date
  let date = new Date();
  const dayMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:of|this|next|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  if (dayMatch && dayMatch[1]) {
    const day = parseInt(dayMatch[1]);
    if (day >= 1 && day <= 31) {
      date.setDate(day);
    }
  }

  return {
    name,
    amount,
    type,
    date,
  };
}
