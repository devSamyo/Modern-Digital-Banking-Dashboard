import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useBillReminder } from '../../hooks/useBillReminder';

/**
 * Bill Reminder Notification Component
 * Shows a toast notification when user logs in with pending bills
 * Displays in the center of screen and is dismissible
 */
const BillReminderNotification = ({ onNavigateToBills }) => {
  const { fetchBillsSummary } = useBillReminder();
  const hasShownRef = useRef(false);
  const TOAST_ID = 'bill-reminder-notification'; // Unique ID to prevent duplicates

  useEffect(() => {
    // Prevent duplicate notifications using ref
    if (hasShownRef.current) {
      return;
    }

    // Check if notification was already shown in this session
    const hasShownNotification = sessionStorage.getItem('billReminderShown');
    
    if (hasShownNotification) {
      hasShownRef.current = true;
      return;
    }

    // Fetch bills summary on component mount (when user logs in)
    const checkPendingBills = async () => {
      const summary = await fetchBillsSummary();
      
      // Only show notification if there are pending bills
      if (summary && (summary.upcoming_count > 0 || summary.overdue_count > 0)) {
        // Dismiss any existing toasts with this ID first
        toast.dismiss(TOAST_ID);
        
        showBillReminderToast(summary);
        sessionStorage.setItem('billReminderShown', 'true');
        hasShownRef.current = true;
      }
    };

    checkPendingBills();
  }, []);

  /**
   * Show custom toast notification with bill summary
   */
  const showBillReminderToast = (summary) => {
    const hasOverdue = summary.overdue_count > 0;
    const hasUpcoming = summary.upcoming_count > 0;

    toast.custom(
      (t) => (
        <div
          className={`
            ${t.visible ? 'animate-enter' : 'animate-leave'}
            max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto 
            flex flex-col overflow-hidden border-4
            ${hasOverdue ? 'border-red-500' : 'border-orange-500'}
          `}
          style={{
            animation: t.visible 
              ? 'slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              : 'slideOutDown 0.3s ease-in-out'
          }}
        >
          {/* Header */}
          <div className={`px-6 py-4 ${hasOverdue ? 'bg-red-500' : 'bg-orange-500'} text-white relative`}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-3 right-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition-all"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 pr-8">
              <div className="text-3xl">
                {hasOverdue ? '⚠️' : '📋'}
              </div>
              <div>
                <h3 className="font-bold text-lg">Bill Reminder</h3>
                <p className="text-sm opacity-90">You have pending bills to pay</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-4">
              {/* Overdue Bills */}
              {hasOverdue && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🚨</div>
                    <div className="flex-1">
                      <p className="font-bold text-red-900 text-lg">
                        {summary.overdue_count} Overdue Bill{summary.overdue_count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-red-700 font-semibold text-xl mt-1">
                        ₹{summary.overdue_amount.toFixed(2)}
                      </p>
                      {summary.overdue_bills.length > 0 && (
                        <div className="mt-2 text-sm text-red-800">
                          <p className="font-medium">Most urgent:</p>
                          <ul className="mt-1 space-y-1">
                            {summary.overdue_bills.slice(0, 2).map((bill, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{bill.biller_name}</span>
                                <span className="font-semibold">₹{bill.amount_due.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Bills */}
              {hasUpcoming && (
                <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📅</div>
                    <div className="flex-1">
                      <p className="font-bold text-orange-900 text-lg">
                        {summary.upcoming_count} Upcoming Bill{summary.upcoming_count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-orange-700 font-semibold text-xl mt-1">
                        ₹{summary.upcoming_amount.toFixed(2)}
                      </p>
                      {summary.upcoming_bills.length > 0 && (
                        <div className="mt-2 text-sm text-orange-800">
                          <p className="font-medium">Due soon:</p>
                          <ul className="mt-1 space-y-1">
                            {summary.upcoming_bills.slice(0, 2).map((bill, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{bill.biller_name}</span>
                                <span className="text-xs opacity-75">in {bill.days_until_due} days</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (onNavigateToBills) {
                  onNavigateToBills();
                }
              }}
              className={`
                w-full mt-5 py-3 px-4 rounded-xl font-bold text-white
                transition-all transform hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
                ${hasOverdue 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600' 
                  : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
                }
              `}
            >
              View All Bills →
            </button>
          </div>
        </div>
      ),
      {
        id: TOAST_ID, // ← THIS IS THE KEY FIX - Unique ID prevents duplicates!
        duration: Infinity, // Stay on screen until user dismisses
        position: 'top-center',
        style: {
          marginTop: '20vh', // Center vertically
        },
      }
    );
  };

  return null; // This component doesn't render anything directly
};

export default BillReminderNotification;