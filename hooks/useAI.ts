import { useMemo } from 'react';
import { Transaction, Category } from './useDatabase';

export function useAI(transactions: Transaction[], categories: Category[]) {
  const insights = useMemo(() => {
    if (transactions.length === 0) return "Hi! I'm your AI Guard. I'll analyze your spending once you add transactions.";
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) return "You haven't recorded any expenses yet. Your budget is 100% safe!";

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Group by category
    const catTotals: {[key: string]: number} = {};
    expenses.forEach(t => {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
    });

    // Find highest spending category
    let maxCatId = "";
    let maxAmt = 0;
    Object.keys(catTotals).forEach(id => {
      if (catTotals[id] > maxAmt) {
        maxAmt = catTotals[id];
        maxCatId = id;
      }
    });

    const highestCat = categories.find(c => c.id === maxCatId)?.name || 'Misc';
    
    if (expenses.length < 3) {
        return `Starting analysis... You've spent ₹${totalSpent.toLocaleString()} so far.`;
    }

    const percentage = ((maxAmt / totalSpent) * 100).toFixed(0);
    
    return `AI Insight: ${highestCat} is your top expense (${percentage}% of total). You might want to monitor this to save more this month!`;
  }, [transactions, categories]);

  return { insights };
}
