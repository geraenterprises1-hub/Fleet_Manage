// Email notification utilities
// In production, integrate with SendGrid, AWS SES, or similar service

export async function notifyHighValueExpense(
  driverName: string,
  amount: number,
  category: string,
  date: string
): Promise<void> {
  const threshold = 5000; // ₹5000
  
  if (amount >= threshold) {
    console.log(`High-value expense alert: ${driverName} spent ₹${amount} on ${category} on ${date}`);
    // TODO: Send email notification to admin
    // Example: await sendEmail({ to: 'admin@fleet.com', subject: 'High Value Expense', body: ... });
  }
}

