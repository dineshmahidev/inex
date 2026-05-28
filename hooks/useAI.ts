import { useMemo } from 'react';
import { Transaction, Category } from './useDatabase';
import { Language, buildAIInsight } from '@/constants/i18n';

export function useAI(
  transactions: Transaction[],
  categories: Category[],
  language: Language = 'en',
) {
  const insights = useMemo(() => {
    // No transactions yet
    if (transactions.length === 0) {
      return buildAIInsight(language, {
        totalSpent: 0,
        highestCat: '',
        percentage: '0',
        expenseCount: 0,
      });
    }

    const expenses = transactions.filter(t => t.type === 'expense');

    // No expenses yet
    if (expenses.length === 0) {
      switch (language) {
        case 'ta':
          return 'இன்னும் எந்த செலவும் பதிவு செய்யவில்லை. உங்கள் பட்ஜெட் 100% பாதுகாப்பாக உள்ளது!';
        case 'tanglish':
          return "Indha varai ethuvum selvazhhikkavillai. Unga budget 100% safe!";
        case 'hi':
          return 'अभी तक कोई खर्च दर्ज नहीं। आपका बजट 100% सुरक्षित है!';
        default:
          return "You haven't recorded any expenses yet. Your budget is 100% safe!";
      }
    }

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const catTotals: { [key: string]: number } = {};
    expenses.forEach(t => {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
    });

    // Find highest spending category
    let maxCatId = '';
    let maxAmt = 0;
    Object.keys(catTotals).forEach(id => {
      if (catTotals[id] > maxAmt) {
        maxAmt = catTotals[id];
        maxCatId = id;
      }
    });

    const highestCat = categories.find(c => c.id === maxCatId)?.name || 'Misc';
    const percentage = ((maxAmt / totalSpent) * 100).toFixed(0);

    return buildAIInsight(language, {
      totalSpent,
      highestCat,
      percentage,
      expenseCount: expenses.length,
    });
  }, [transactions, categories, language]);

  return { insights };
}
