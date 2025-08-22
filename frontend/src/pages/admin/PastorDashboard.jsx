import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PastorDashboard = () => {
  const { userData } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pastor Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, Pastor {userData?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approvals</h3>
          <div className="text-3xl font-bold text-blue-600">5</div>
          <p className="text-sm text-gray-500">Users waiting for approval</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Members</h3>
          <div className="text-3xl font-bold text-green-600">42</div>
          <p className="text-sm text-gray-500">Active church members</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prayer Requests</h3>
          <div className="text-3xl font-bold text-purple-600">8</div>
          <p className="text-sm text-gray-500">New prayer requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50">
              📝 Create New Sermon
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50">
              📅 Schedule Event
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50">
              ✍️ Write Blog Post
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50">
              👥 Review Applications
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <p className="text-sm text-gray-600">New user registration - John Doe</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <p className="text-sm text-gray-600">Prayer request submitted - Jane Smith</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <p className="text-sm text-gray-600">Event registration - Bible Study Group</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastorDashboard;
