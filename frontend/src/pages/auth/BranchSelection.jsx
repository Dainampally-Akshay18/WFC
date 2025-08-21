import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const BranchSelection = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { selectBranch, userData, currentUser } = useAuth(); // ⭐ Get currentUser
  const navigate = useNavigate();

  // ⭐ Debug log to see what user data we have
  console.log('🔍 Branch selection page - User data:', {
    currentUser: currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName
    } : null,
    userData: userData
  });

  const branches = [
    {
      id: 'branch1',
      name: 'Branch 1',
      description: 'Main branch with traditional services and family programs.'
    },
    {
      id: 'branch2',
      name: 'Branch 2', 
      description: 'Contemporary branch focused on modern worship and community outreach.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBranch) {
      setError('Please select a branch to continue');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('🏢 Submitting branch selection:', selectedBranch);
      console.log('👤 Current user for branch selection:', currentUser?.email);
      
      await selectBranch(selectedBranch);
      
      console.log('✅ Branch selection successful, redirecting to pending approval');
      navigate('/pending-approval');
    } catch (error) {
      console.error('❌ Branch selection error:', error);
      setError(error.message || 'Branch selection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">🏢</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Branch
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Welcome {currentUser?.displayName || userData?.name}! 
            Please select the branch you'd like to join.
          </p>
          {/* ⭐ Debug info - remove in production */}
          <p className="text-sm text-gray-500 mt-2">
            Email: {currentUser?.email || userData?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-8">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className={`cursor-pointer transition-all duration-200 p-6 ${
                  selectedBranch === branch.id
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                    : 'hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedBranch(branch.id);
                  setError('');
                }}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="branch"
                    value={branch.id}
                    checked={selectedBranch === branch.id}
                    onChange={(e) => {
                      setSelectedBranch(e.target.value);
                      setError('');
                    }}
                    className="mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {branch.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {branch.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="text-center">
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={isLoading}
              disabled={!selectedBranch || isLoading}
              fullWidth
            >
              {isLoading ? 'Submitting...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchSelection;
