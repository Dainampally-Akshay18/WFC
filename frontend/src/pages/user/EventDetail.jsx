import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EditEventDialog from '../../components/ui/EditEventDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ShareIcon,
  TagIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentUser } = useAuth();

  // Helper function to get Firebase token
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
    return { 'Content-Type': 'application/json' };
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
      
      // Fallback: Mock event data
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
        canEdit: true,
        canDelete: true,
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
        fetchEvent(); // Refresh event data to update attendee count
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

  const handleEventUpdated = (updatedEvent) => {
    setEvent(updatedEvent);
    setEditingEvent(null);
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Event deleted successfully');
        navigate('/events'); // Redirect to events list
      }
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      setError('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <CalendarDaysIcon className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-500 mb-6">The event you're looking for could not be found.</p>
          <Link to="/events">
            <Button className="flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/events" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Events
        </Link>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
            <ShareIcon className="h-4 w-4" />
            Share
          </Button>
          
          {/* Edit and Delete buttons for event owners */}
          {event.canEdit && (
            <Button
              variant="outline"
              onClick={() => setEditingEvent(event)}
              className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
          )}
          
          {event.canDelete && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Event Card */}
      <Card className="overflow-hidden">
        <div className="p-8">
          {/* Event Title and Status */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isUpcoming(event.eventDate) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isUpcoming(event.eventDate) ? 'Upcoming' : 'Past Event'}
                </span>
                {event.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {event.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <CalendarDaysIcon className="h-6 w-6 mr-3 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">{formatDate(event.eventDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700">
                <ClockIcon className="h-6 w-6 mr-3 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {formatTime(event.eventDate)} - {formatTime(event.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <MapPinIcon className="h-6 w-6 mr-3 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700">
                <UserGroupIcon className="h-6 w-6 mr-3 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {event.attendeeCount || 0} / {event.maxAttendees} attending
                  </p>
                  <p className="text-sm text-gray-500">
                    {event.maxAttendees - (event.attendeeCount || 0)} spots remaining
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>

          {/* Registration Section */}
          {isUpcoming(event.eventDate) && (
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isRegistered ? 'You\'re registered!' : 'Join us for this event'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isRegistered 
                      ? 'We look forward to seeing you there'
                      : 'Register now to secure your spot'
                    }
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {isRegistered ? (
                    <Button 
                      variant="outline" 
                      onClick={handleUnregister}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Unregister
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleRegister}
                      disabled={event.attendeeCount >= event.maxAttendees}
                      className={event.attendeeCount >= event.maxAttendees ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {event.attendeeCount >= event.maxAttendees ? 'Event Full' : 'Register Now'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Event Organizer */}
          <div className="border-t pt-6 mt-6">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Organized by:</span> {event.createdBy.name}
              {event.createdBy.title && (
                <span className="ml-2 text-gray-500">({event.createdBy.title})</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog 
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={handleEventUpdated}
          event={editingEvent}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmText="Delete Event"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventDetail;
