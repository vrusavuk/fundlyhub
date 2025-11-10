/**
 * Utility for exporting donation data to CSV
 */

import type { DonationData } from '@/lib/data-table/donation-columns';

export async function exportDonationsCSV(
  donations: DonationData[],
  filename: string = 'donations-export'
) {
  // Prepare CSV data
  const csvRows: string[] = [];
  
  // Headers
  const headers = [
    'Donation ID',
    'Receipt ID',
    'Date',
    'Donor Name',
    'Donor Email',
    'Amount',
    'Tip',
    'Fees',
    'Net Amount',
    'Currency',
    'Campaign',
    'Campaign ID',
    'Status',
    'Provider',
    'Anonymous'
  ];
  csvRows.push(headers.join(','));

  // Data rows
  donations.forEach(d => {
    const row = [
      d.id,
      d.receipt_id || '',
      new Date(d.created_at).toLocaleString(),
      d.is_anonymous ? 'Anonymous' : (d.donor_name || d.donor?.name || ''),
      d.is_anonymous ? '' : (d.donor_email || d.donor?.email || ''),
      d.amount.toString(),
      (d.tip_amount || 0).toString(),
      (d.fee_amount || 0).toString(),
      (d.net_amount || d.amount).toString(),
      d.currency,
      d.fundraiser?.title || '',
      d.fundraiser_id,
      d.payment_status,
      d.payment_provider || 'stripe',
      d.is_anonymous ? 'Yes' : 'No'
    ];
    
    // Escape commas and quotes in CSV
    const escapedRow = row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    });
    
    csvRows.push(escapedRow.join(','));
  });

  // Create CSV blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}
