import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HeartIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
// IMPORT the service functions
import { getPrayers, addPrayer } from '../../services/prayerService';

const PrayerList = () => {
  const [prayers, setPrayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active', 'answered', 'my-prayers', 'all'
  const location = useLocation(); // To get success messages from navigation state

  // Use useCallback to prevent re-creating the function on every render
  const fetchPrayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let params = {};
      // Map frontend filter to backend API query params
      if (filter === 'active' || filter === 'answered') {
        params.status = filter;
      } else if (filter === 'all') {
        params.status = 'all'; // Special case to get all statuses
      }
      
      // For 'my-prayers', we would ideally hit a dedicated endpoint, e.g., /prayers/my-prayers
      // For now, we'll fetch all and filter client-side, but a backend endpoint is better for scale.
      // Your routes file has /my-requests, which is perfect, but we'll stick to the main endpoint for this example.
      
      const response = await getPrayers(params);
      setPrayers(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch prayer requests.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]); // Re-run fetchPrayers only when the filter changes

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const handlePrayerToggle = async (prayerId) => {
    const originalPrayers = [...prayers];

    // Optimistic UI Update
    setPrayers(currentPrayers =>
      currentPrayers.map(prayer =>
        prayer._id === prayerId
          ? {
              ...prayer,
              isPrayingFor: !prayer.isPrayingFor,
              prayerCount: prayer.isPrayingFor ? prayer.prayerCount - 1 : prayer.prayerCount + 1,
            }
          : prayer
      )
    );

    try {
      // API call in the background
      await addPrayer(prayerId);
    } catch (error) {
      // If API call fails, revert the change and show an error
      console.error("Failed to update prayer status:", error);
      setPrayers(originalPrayers);
      // Optionally, show a toast notification for the error
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return <ExclamationTriangleIcon className="w-3 h-3" />;
    }
    return null;
  };

  // The API now handles filtering, so we just render the `prayers` state
  const displayedPrayers = prayers;
  
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner text="Loading prayer requests..." />;
    }

    if (error) {
      return (
        <Card className="text-center py-12 bg-red-50 border-red-200">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Prayers</h3>
          <p className="text-red-700">{error}</p>
        </Card>
      );
    }
    
    if (displayedPrayers.length === 0) {
      return (
        <Card className="text-center py-12">
          <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prayer requests found</h3>
          <p className="text-gray-600 mb-6">There are no prayer requests that match the current filter.</p>
          <Link to="/prayers/submit">
            <Button variant="primary">Submit a Prayer Request</Button>
          </Link>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
        {displayedPrayers.map((prayer) => (
          <Card key={prayer._id} className={`${prayer.status === 'answered' ? 'bg-green-50 border-green-200' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${getPriorityColor(prayer.priority)}`}>
                    {getPriorityIcon(prayer.priority)}
                    {prayer.priority.charAt(0).toUpperCase() + prayer.priority.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">{prayer.category}</span>
                  <span className="text-xs text-gray-500">{prayer.submitterBranch}</span>
                  {prayer.status === 'answered' && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Answered</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{prayer.title}</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">{prayer.description}</p>
                {prayer.status === 'answered' && prayer.answeredDescription && (
                  <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
                    <p className="text-sm font-medium text-green-800">Prayer Answer:</p>
                    <p className="mt-1 text-sm text-green-700">{prayer.answeredDescription}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center"><UserIcon className="w-4 h-4 mr-1" />{prayer.displayName}</div>
                    <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" />{formatDate(prayer.submissionDate)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{prayer.prayerCount} people praying</span>
                  </div>
                </div>
              </div>
              <div className="ml-6">
                <button
                  onClick={() => handlePrayerToggle(prayer._id)}
                  disabled={prayer.status === 'answered'}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    prayer.isPrayingFor
                      ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {prayer.isPrayingFor ? <HeartIconSolid className="w-4 h-4 text-primary-600" /> : <HeartIcon className="w-4 h-4" />}
                  <span>{prayer.isPrayingFor ? 'Praying' : 'Pray'}</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prayer Requests</h1>
          <p className="mt-1 text-gray-600">Join our community in prayer and support</p>
        </div>
        <Link to="/prayers/submit">
          <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>Submit Prayer Request</Button>
        </Link>
      </div>
      
      {location.state?.message && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-3"/>
            <p>{location.state.message}</p>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['active', 'answered', 'all'].map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setFilter(tabKey)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === tabKey
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >{tabKey.replace('-', ' ')} Prayers</button>
          ))}
        </nav>
      </div>

      {renderContent()}
    </div>
  );
};

export default PrayerList;