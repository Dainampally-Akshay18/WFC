import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ShareIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');

  const { currentUser } = useAuth();

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

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      
      console.log('🔍 Fetching event with ID:', id);
      const response = await fetch(`/api/events/${id}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Event response:', data);

      if (data.success || data.status === 'success') {
        setEvent(data.data);
        setIsRegistered(data.data.userRegistered || false);
      } else {
        throw new Error(data.message || 'Failed to load event');
      }
    } catch (error) {
      console.error('❌ Error fetching event:', error);
      setError('Failed to load event details');
      
      // ⭐ FALLBACK: Mock event data
      const mockEvent = {
        _id: id,
        title: 'Sunday Worship Service',
        description: 'Join us for our weekly worship service with inspiring music and powerful messages from God\'s Word. This service includes contemporary worship, prayer time, and a message that will encourage and strengthen your faith.',
        eventDate: '2025-01-26T10:00:00Z',
        endDate: '2025-01-26T12:00:00Z',
        location: 'Main Sanctuary',
        branch: 'Branch 1',
        attendeeCount: 45,
        maxAttendees: 200,
        category: 'Worship',
        isActive: true,
        userRegistered: false,
        createdBy: {
          name: 'Pastor John Smith',
          title: 'Senior Pastor'
        },
        attendees: []
      };
      setEvent(mockEvent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        setIsRegistered(true);
        // Refresh event data to update attendee count
        fetchEvent();
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleUnregister = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/events/${id}/unregister`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setIsRegistered(false);
        fetchEvent();
      }
    } catch (error) {
      console.error('Unregistration failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) >= new Date();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading event...</span>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/events" className="flex items-center space-x-2 mb-6 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Events</span>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Event</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/events" className="flex items-center space-x-2 mb-6 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Events</span>
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600">The event you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link to="/events" className="flex items-center space-x-2 mb-6 text-blue-600 hover:text-blue-800 transition-colors">
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back to Events</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Event Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {event.category}
              </span>
              <span className="text-sm text-gray-500">{event.branch}</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 mb-6">
              <div className="flex items-center">
                <CalendarDaysIcon className="w-5 h-5 mr-3" />
                <div>
                  <div className="font-medium">{formatDate(event.eventDate)}</div>
                  <div className="text-sm">{formatTime(event.eventDate)} - {formatTime(event.endDate)}</div>
                </div>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-3" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-3" />
                <span>{event.attendeeCount || 0} / {event.maxAttendees} attendees</span>
              </div>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Event Image/Banner */}
          <div className="relative mb-8 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-white text-3xl font-bold text-center px-6">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-8 p-4 bg-gray-50 rounded-lg">
            {isUpcoming(event.eventDate) && (
              <>
                {isRegistered ? (
                  <Button onClick={handleUnregister} variant="secondary">
                    Unregister
                  </Button>
                ) : (
                  <Button onClick={handleRegister} variant="primary">
                    Register for Event
                  </Button>
                )}
              </>
            )}
            
            <Button onClick={handleShare} variant="secondary">
              <ShareIcon className="w-5 h-5 mr-2" />
              Share Event
            </Button>
          </div>

          {/* Event Status */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Event Status</h3>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Registration Status:</span>
                <span className={`font-medium ${isUpcoming(event.eventDate) ? 'text-green-600' : 'text-gray-500'}`}>
                  {isUpcoming(event.eventDate) ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">Available Spots:</span>
                <span className="font-medium text-blue-600">
                  {event.maxAttendees - (event.attendeeCount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Organizer Info */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Organizer</h3>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">
                  {event.createdBy?.name?.charAt(0) || 'O'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{event.createdBy?.name}</h4>
                <p className="text-sm text-gray-600">{event.createdBy?.title}</p>
              </div>
            </div>
          </Card>

          {/* Event Details */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{event.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Branch:</span>
                <span className="font-medium">{event.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {Math.round((new Date(event.endDate) - new Date(event.eventDate)) / (1000 * 60))} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${isUpcoming(event.eventDate) ? 'text-green-600' : 'text-gray-500'}`}>
                  {isUpcoming(event.eventDate) ? 'Upcoming' : 'Past'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
