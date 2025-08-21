import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HeartIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const PrayerList = () => {
  const [prayers, setPrayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    fetchPrayers();
  }, [filter]);

  const fetchPrayers = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPrayers = [
        {
          id: 1,
          title: 'Healing for My Mother',
          description: 'Please pray for my mother who is undergoing surgery this week. We trust in God\'s healing power.',
          submittedBy: 'Anonymous',
          submittedAt: '2025-01-22T14:30:00Z',
          priority: 'urgent',
          status: 'active',
          prayerCount: 45,
          isPrayingFor: true,
          branch: 'Branch 1',
          category: 'Health'
        },
        {
          id: 2,
          title: 'Job Search Guidance',
          description: 'I have been looking for employment for several months. Please pray for God\'s guidance and provision.',
          submittedBy: 'John D.',
          submittedAt: '2025-01-20T10:15:00Z',
          priority: 'normal',
          status: 'active',
          prayerCount: 23,
          isPrayingFor: false,
          branch: 'Branch 2',
          category: 'Career'
        },
        {
          id: 3,
          title: 'Family Reconciliation',
          description: 'Praying for restoration and healing in my family relationships. May God bring peace and understanding.',
          submittedBy: 'Sarah M.',
          submittedAt: '2025-01-18T16:45:00Z',
          priority: 'normal',
          status: 'answered',
          prayerCount: 67,
          isPrayingFor: true,
          branch: 'Both Branches',
          category: 'Family',
          answer: 'Thank you all for your prayers! My family has come together and we are working through our differences with love and understanding.'
        },
        {
          id: 4,
          title: 'Wisdom for Church Leadership',
          description: 'Please pray for our church leadership as we make important decisions about the future direction of our ministry.',
          submittedBy: 'Pastor Committee',
          submittedAt: '2025-01-15T09:00:00Z',
          priority: 'high',
          status: 'active',
          prayerCount: 89,
          isPrayingFor: true,
          branch: 'Both Branches',
          category: 'Ministry'
        }
      ];

      setPrayers(mockPrayers);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrayers = prayers.filter(prayer => {
    if (filter === 'active') return prayer.status === 'active';
    if (filter === 'answered') return prayer.status === 'answered';
    if (filter === 'my-prayers') return prayer.isPrayingFor;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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

  const handlePrayerToggle = (prayerId) => {
    setPrayers(prayers.map(prayer => 
      prayer.id === prayerId 
        ? { 
            ...prayer, 
            isPrayingFor: !prayer.isPrayingFor,
            prayerCount: prayer.isPrayingFor ? prayer.prayerCount - 1 : prayer.prayerCount + 1
          }
        : prayer
    ));
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading prayer requests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prayer Requests</h1>
          <p className="mt-1 text-gray-600">
            Join our community in prayer and support
          </p>
        </div>
        <Link to="/prayers/submit">
          <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
            Submit Prayer Request
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'active', label: 'Active Prayers', count: prayers.filter(p => p.status === 'active').length },
            { key: 'answered', label: 'Answered Prayers', count: prayers.filter(p => p.status === 'answered').length },
            { key: 'my-prayers', label: 'My Prayers', count: prayers.filter(p => p.isPrayingFor).length },
            { key: 'all', label: 'All Requests', count: prayers.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Prayer Requests */}
      {filteredPrayers.length === 0 ? (
        <Card className="text-center py-12">
          <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prayer requests found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'active' && "There are no active prayer requests at this time."}
            {filter === 'answered' && "No answered prayers to show yet."}
            {filter === 'my-prayers' && "You haven't joined any prayer requests yet."}
            {filter === 'all' && "No prayer requests available."}
          </p>
          <Link to="/prayers/submit">
            <Button variant="primary">
              Submit a Prayer Request
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPrayers.map((prayer) => (
            <Card key={prayer.id} className={`${prayer.status === 'answered' ? 'bg-green-50 border-green-200' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${getPriorityColor(prayer.priority)}`}>
                      {getPriorityIcon(prayer.priority)}
                      {prayer.priority.charAt(0).toUpperCase() + prayer.priority.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{prayer.category}</span>
                    <span className="text-xs text-gray-500">{prayer.branch}</span>
                    {prayer.status === 'answered' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Answered
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {prayer.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {prayer.description}
                  </p>

                  {/* Answered Prayer */}
                  {prayer.status === 'answered' && prayer.answer && (
                    <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Prayer Answer:
                          </p>
                          <p className="mt-1 text-sm text-green-700">
                            {prayer.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1" />
                        {prayer.submittedBy}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(prayer.submittedAt)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{prayer.prayerCount} people praying</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="ml-6">
                  <button
                    onClick={() => handlePrayerToggle(prayer.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      prayer.isPrayingFor
                        ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {prayer.isPrayingFor ? (
                      <HeartIconSolid className="w-4 h-4 text-primary-600" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                    <span>{prayer.isPrayingFor ? 'Praying' : 'Pray'}</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrayerList;
