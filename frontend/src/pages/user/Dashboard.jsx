import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  BookOpenIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HeartIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { userData } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get dashboard data
    const fetchDashboardData = async () => {
      try {
        // This would be a real API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDashboardData({
          stats: {
            totalSermons: 45,
            totalEvents: 12,
            totalBlogs: 28,
            totalPrayers: 156
          },
          recentSermons: [
            {
              id: 1,
              title: 'Faith in Times of Trial',
              category: 'Faith',
              views: 234,
              createdAt: '2025-01-20'
            },
            {
              id: 2,
              title: 'The Power of Prayer',
              category: 'Prayer',
              views: 189,
              createdAt: '2025-01-18'
            }
          ],
          upcomingEvents: [
            {
              id: 1,
              title: 'Sunday Worship Service',
              date: '2025-01-26',
              time: '10:00 AM',
              attendees: 45
            },
            {
              id: 2,
              title: 'Youth Bible Study',
              date: '2025-01-28',
              time: '7:00 PM',
              attendees: 12
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const statCards = [
    {
      name: 'Total Sermons',
      value: dashboardData?.stats.totalSermons || 0,
      icon: BookOpenIcon,
      color: 'primary'
    },
    {
      name: 'Upcoming Events',
      value: dashboardData?.stats.totalEvents || 0,
      icon: CalendarDaysIcon,
      color: 'success'
    },
    {
      name: 'Blog Posts',
      value: dashboardData?.stats.totalBlogs || 0,
      icon: DocumentTextIcon,
      color: 'secondary'
    },
    {
      name: 'Prayer Requests',
      value: dashboardData?.stats.totalPrayers || 0,
      icon: HeartIcon,
      color: 'danger'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {userData?.name}! 👋
        </h1>
        <p className="text-primary-100">
          Here's what's happening in your {userData?.branch} community
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name} className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sermons */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sermons</h3>
          <div className="space-y-4">
            {dashboardData?.recentSermons?.map((sermon) => (
              <div key={sermon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{sermon.title}</h4>
                  <p className="text-sm text-gray-600">{sermon.category}</p>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {sermon.views}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {dashboardData?.upcomingEvents?.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {event.attendees}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-primary-50 rounded-lg text-center hover:bg-primary-100 transition-colors">
            <BookOpenIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-primary-700">Browse Sermons</span>
          </button>
          <button className="p-4 bg-success-50 rounded-lg text-center hover:bg-success-100 transition-colors">
            <CalendarDaysIcon className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-success-700">View Events</span>
          </button>
          <button className="p-4 bg-secondary-50 rounded-lg text-center hover:bg-secondary-100 transition-colors">
            <DocumentTextIcon className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-secondary-700">Read Blogs</span>
          </button>
          <button className="p-4 bg-danger-50 rounded-lg text-center hover:bg-danger-100 transition-colors">
            <HeartIcon className="w-8 h-8 text-danger-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-danger-700">Submit Prayer</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
