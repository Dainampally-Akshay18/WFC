import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { auth } from '../../config/firebase';
import Button from './Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CreateEventDialog = ({ isOpen, onClose, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    branch: '', // User's specific branch when cross-branch is not selected
    category: '',
    isCrossBranch: false, // ⭐ NEW: Checkbox for cross-branch
    maxAttendees: '50'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ⭐ HELPER FUNCTION TO GET FIREBASE TOKEN
  const getAuthHeaders = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return {
      'Content-Type': 'application/json'
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      branch: '',
      category: '',
      isCrossBranch: false,
      maxAttendees: '50'
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Event title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.date) return 'Date is required';
    if (!formData.time) return 'Time is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.category) return 'Category is required';
    
    // ⭐ Only require branch selection if NOT cross-branch
    if (!formData.isCrossBranch && !formData.branch) {
      return 'Please select a branch or check "Cross Branch"';
    }
    
    if (!formData.maxAttendees || parseInt(formData.maxAttendees) < 1) {
      return 'Max attendees must be at least 1';
    }
    
    // Check if date is not in the past
    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
    if (eventDateTime < new Date()) return 'Event date cannot be in the past';
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const eventDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

      // ⭐ NEW LOGIC: Handle cross-branch vs single branch
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        eventDate: eventDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location.trim(),
        // ⭐ If cross-branch is checked, set branch to 'both', otherwise use selected branch
        branch: formData.isCrossBranch ? 'both' : formData.branch,
        category: formData.category,
        maxAttendees: parseInt(formData.maxAttendees),
        // ⭐ Send cross-branch request flag to backend
        crossBranchRequested: formData.isCrossBranch
      };

      console.log('🔍 Creating event with data:', eventData);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Event created successfully:', data);

      if (onEventCreated) {
        onEventCreated(data.data);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error('❌ Error creating event:', error);
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Create New Event
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Event Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter event title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter event description"
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time *
                      </label>
                      <input
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter event location"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* ⭐ NEW: Cross-Branch Checkbox and Branch Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        name="isCrossBranch"
                        type="checkbox"
                        checked={formData.isCrossBranch}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Cross Branch (Available to both branches)
                      </label>
                    </div>

                    {/* ⭐ Only show branch selection if cross-branch is NOT checked */}
                    {!formData.isCrossBranch && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Branch *
                        </label>
                        <select
                          name="branch"
                          value={formData.branch}
                          onChange={handleInputChange}
                          required={!formData.isCrossBranch}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Branch</option>
                          <option value="branch1">Branch 1</option>
                          <option value="branch2">Branch 2</option>
                        </select>
                      </div>
                    )}

                    {/* ⭐ Show message when cross-branch is selected */}
                    {formData.isCrossBranch && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                          📍 This event will be available to users from both branches and will require pastor approval.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      <option value="Worship">Worship</option>
                      <option value="Study">Bible Study</option>
                      <option value="Fellowship">Fellowship</option>
                      <option value="Outreach">Outreach</option>
                      <option value="Youth">Youth</option>
                      <option value="Prayer">Prayer</option>
                      <option value="Conference">Conference</option>
                    </select>
                  </div>

                  {/* Max Attendees */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attendees *
                    </label>
                    <input
                      name="maxAttendees"
                      type="number"
                      value={formData.maxAttendees}
                      onChange={handleInputChange}
                      placeholder="50"
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Event'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateEventDialog;
