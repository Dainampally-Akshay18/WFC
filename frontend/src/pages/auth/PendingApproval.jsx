import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const PendingApproval = () => {
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card className="text-center p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Approval Pending
            </h1>
            <p className="text-gray-600">
              Your branch selection is under review
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Status:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Account created</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Branch selected: {userData?.branch}</span>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-500 mr-2">⏳</span>
                <span>Awaiting pastor approval</span>
              </div>
            </div>
          </div>

          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What's next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• A pastor will review your application</li>
              <li>• You'll receive email notification</li>
              <li>• Access granted within 24 hours</li>
            </ul>
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
