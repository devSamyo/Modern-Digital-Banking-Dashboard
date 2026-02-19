import { useState } from 'react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, API_BASE_URL } from '../../config';

const ReportsCenter = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [downloadingMonthly, setDownloadingMonthly] = useState(false);
  const [downloadingCategory, setDownloadingCategory] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDownloadMonthlySummary = async () => {
    try {
      setDownloadingMonthly(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.REPORT_MONTHLY_SUMMARY}?month=${selectedMonth}&year=${selectedYear}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download error:', errorText);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly_summary_${months[selectedMonth - 1]}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Monthly summary report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading monthly summary:', error);
      toast.error(error.message || 'Failed to download monthly summary report');
    } finally {
      setDownloadingMonthly(false);
    }
  };

  const handleDownloadCategoryBreakdown = async () => {
    try {
      setDownloadingCategory(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.REPORT_CATEGORY_BREAKDOWN}?month=${selectedMonth}&year=${selectedYear}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download error:', errorText);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `category_breakdown_${months[selectedMonth - 1]}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Category breakdown report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading category breakdown:', error);
      toast.error(error.message || 'Failed to download category breakdown report');
    } finally {
      setDownloadingCategory(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">📊 Reports Center</h2>
        <p className="text-gray-600 mt-2">Download comprehensive financial reports in PDF format</p>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Report Period</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, idx) => (
                <option key={idx} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Summary Report */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-blue-900">Monthly Summary Report</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Includes:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Total Income & Expenses</li>
              <li>✓ Net Savings</li>
              <li>✓ Budget Status</li>
              <li>✓ Bills Summary</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadMonthlySummary}
            disabled={downloadingMonthly}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {downloadingMonthly ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>
                📥 Download PDF Report
              </>
            )}
          </button>
        </div>

        {/* Category Breakdown Report */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-purple-900">Category Breakdown Report</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Includes:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Spending by Category</li>
              <li>✓ Transaction Count</li>
              <li>✓ Percentage Breakdown</li>
              <li>✓ Top 3 Categories</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadCategoryBreakdown}
            disabled={downloadingCategory}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {downloadingCategory ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>
                📥 Download PDF Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💡</div>
          <div>
            <h4 className="font-semibold text-green-900 mb-2">Report Tips</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Reports are generated in real-time based on your current data</li>
              <li>• PDF files can be saved, printed, or shared easily</li>
              <li>• Use these reports for tax preparation or financial planning</li>
              <li>• Download reports regularly to track your financial progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsCenter;