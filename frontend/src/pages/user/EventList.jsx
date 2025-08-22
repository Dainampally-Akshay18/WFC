import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CreateEventDialog from '../../components/ui/CreateEventDialog';
import EditEventDialog from '../../components/ui/EditEventDialog';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [error, setError] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      
      // ⭐ FIXED: Map filters to correct API endpoints based on your routes
      let apiUrl;
      
      switch (filter) {
        case 'upcoming':
          apiUrl = '/api/events/upcoming'; // ⭐ CORRECT ENDPOINT
          break;
        case 'myEvents':
          apiUrl = '/api/events?myEvents=true'; // ⭐ QUERY PARAM FOR MY EVENTS
          break;
        case 'past':
        case 'attending':
        case 'all':
        default:
          apiUrl = '/api/events'; // ⭐ BASE ENDPOINT FOR ALL EVENTS
          break;
      }

      console.log('🔍 Fetching events from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.message || `Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Events response:', data);

      if (data.success || data.status === 'success') {
        setEvents(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load events');
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setError('Failed to load events: ' + error.message);
      
      // ⭐ FALLBACK: Mock events for testing
      const mockEvents = [
        {
          _id: '1',
          title: 'Sunday Worship Service',
          description: 'Join us for our weekly worship service with inspiring music and powerful messages.',
          eventDate: '2025-01-26T10:00:00Z',
          endDate: '2025-01-26T12:00:00Z',
          location: 'Main Sanctuary',
          branch: 'branch1',
          attendeeCount: 45,
          maxAttendees: 200,
          category: 'Worship',
          isActive: true,
          canEdit: true,
          canDelete: true,
          createdBy: {
            name: 'Pastor John'
          }
        },
        {
          _id: '2',
          title: 'Youth Bible Study',
          description: 'An interactive Bible study session for our youth community.',
          eventDate: '2025-01-28T19:00:00Z',
          endDate: '2025-01-28T21:00:00Z',
          location: 'Youth Center',
          branch: 'branch1',
          attendeeCount: 12,
          maxAttendees: 30,
          category: 'Study',
          isActive: true,
          canEdit: false,
          canDelete: false,
          createdBy: {
            name: 'Pastor Sarah'
          }
        }
      ];
      setEvents(mockEvents);
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ HANDLE EVENT CREATION SUCCESS
  const handleEventCreated = (newEvent) => {
    console.log('✅ Event created successfully:', newEvent);
    setEvents(prevEvents => [newEvent, ...prevEvents]);
  };

  // ⭐ HANDLE EVENT UPDATE SUCCESS
  const handleEventUpdated = (updatedEvent) => {
    console.log('✅ Event updated successfully:', updatedEvent);
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event._id === updatedEvent._id ? updatedEvent : event
      )
    );
    setEditingEvent(null);
  };

  // ⭐ HANDLE DELETE EVENT
  const handleDeleteEvent = async (eventId) => {
    if (!eventId) return;

    setIsDeleting(true);
    setDeletingEventId(eventId);
    
    try {
      const headers = await getAuthHeaders();
      
      console.log('🗑️ Deleting event:', eventId);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      const data = await response.json();
      console.log('✅ Event deleted successfully:', data);

      if (data.success) {
        // Remove event from list
        setEvents(prevEvents => 
          prevEvents.filter(event => event._id !== eventId)
        );
      }
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      setError('Failed to delete event: ' + error.message);
    } finally {
      setIsDeleting(false);
      setDeletingEventId(null);
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

  const filteredEvents = events.filter(event => {
    if (filter === 'upcoming') return true; // Already filtered by API
    if (filter === 'past') return !isUpcoming(event.eventDate);
    if (filter === 'attending') return event.userRegistered;
    if (filter === 'myEvents') return true; // Already filtered by API
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Church Events</h1>
          <p className="text-gray-600">Stay connected with our community events and activities</p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'myEvents', label: 'Created by Me' },
          { key: 'all', label: 'All' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Events Display */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <FunnelIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-600">
            {filter === 'upcoming' && "There are no upcoming events at this time."}
            {filter === 'past' && "No past events to show."}
            {filter === 'attending' && "You're not registered for any events yet."}
            {filter === 'myEvents' && "You haven't created any events yet."}
            {filter === 'all' && "No events available."}
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Event
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Event Image */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <div className="flex items-center justify-center text-sm opacity-90">
                    <CalendarDaysIcon className="w-4 h-4 mr-1" />
                    {formatDate(event.eventDate)}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {event.category || 'Event'}
                  </span>
                  <span className="text-sm text-gray-500">{event.branch}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Link
                    to={`/events/${event._id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {event.title}
                  </Link>
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {event.description.length > 100
                    ? event.description.substring(0, 100) + '...'
                    : event.description
                  }
                </p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{formatTime(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{event.attendeeCount || 0} / {event.maxAttendees} attendees</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <Link to={`/events/${event._id}`}>
                    <Button variant="primary" size="sm">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  
                  {isUpcoming(event.eventDate) && (
                    <Button 
                      variant={event.userRegistered ? "success" : "secondary"} 
                      size="sm"
                      onClick={() => {
                        console.log('Register for event:', event._id);
                      }}
                    >
                      {event.userRegistered ? 'Registered ✓' : 'Register'}
                    </Button>
                  )}
                </div>

                {/* Edit/Delete Buttons - Only show if user can edit/delete */}
                {(event.canEdit || event.canDelete) && (
                  <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                    {event.canEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingEvent(event)}
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    
                    {event.canDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteEvent(event._id)}
                        disabled={isDeleting && deletingEventId === event._id}
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        {isDeleting && deletingEventId === event._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Event Organizer */}
                {event.createdBy && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Organized by <span className="font-medium text-gray-700">{event.createdBy.name}</span>
                    </p>
                  </div>
                )}

                {/* Event Status Indicator */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    isUpcoming(event.eventDate)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isUpcoming(event.eventDate) ? '🟢 Upcoming' : '🔴 Past Event'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ⭐ CREATE EVENT DIALOG */}
      <CreateEventDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {/* ⭐ EDIT EVENT DIALOG */}
      {editingEvent && (
        <EditEventDialog
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          eventData={editingEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default EventList;
