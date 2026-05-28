import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction, Category } from '../hooks/useDatabase';
import { formatWithCommas } from '../constants/theme';

export async function exportToPDF(transactions: Transaction[], categories: Category[], currency: string) {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const htmlRows = transactions.map(t => {
    const cat = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(t.date).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${cat}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${t.note || '---'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${t.type === 'income' ? '#22c55e' : '#ef4444'}">
          ${t.type === 'income' ? '+' : '-'}${currency}${formatWithCommas(t.amount)}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { margin-bottom: 40px; }
          .title { font-size: 28px; font-weight: 900; color: #FF7A00; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #666; }
          .stats-grid { display: flex; flex-direction: row; gap: 20px; margin: 30px 0; }
          .stat-box { flex: 1; padding: 20px; border-radius: 12px; background: #f8f9fa; border: 1px solid #eee; }
          .stat-label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #888; margin-bottom: 5px; }
          .stat-value { font-size: 18px; font-weight: 900; }
          .income { color: #22c55e; }
          .expense { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px 10px; border-bottom: 2px solid #333; font-size: 12px; text-transform: uppercase; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Financial Statement</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Income</div>
            <div class="stat-value income">+${currency}${formatWithCommas(income)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Expense</div>
            <div class="stat-value expense">-${currency}${formatWithCommas(expense)}</div>
          </div>
          <div class="stat-box" style="background: #FFF7ED; border-color: #FF7A00;">
            <div class="stat-label" style="color: #FF7A00;">Net Balance</div>
            <div class="stat-value" style="color: #121212;">${currency}${formatWithCommas(balance)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Note</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}
