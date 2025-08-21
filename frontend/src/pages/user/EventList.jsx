import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents = [
        {
          id: 1,
          title: 'Sunday Worship Service',
          description: 'Join us for our weekly worship service with inspiring music and powerful messages.',
          date: '2025-01-26',
          time: '10:00 AM',
          location: 'Main Sanctuary',
          branch: 'Branch 1',
          attendees: 45,
          maxAttendees: 200,
          category: 'Worship',
          isAttending: false,
          image: 'https://via.placeholder.com/400x200?text=Sunday+Worship'
        },
        {
          id: 2,
          title: 'Youth Bible Study',
          description: 'An interactive Bible study session for our youth community.',
          date: '2025-01-28',
          time: '7:00 PM',
          location: 'Youth Center',
          branch: 'Branch 1',
          attendees: 12,
          maxAttendees: 30,
          category: 'Study',
          isAttending: true,
          image: 'https://via.placeholder.com/400x200?text=Youth+Bible+Study'
        },
        {
          id: 3,
          title: 'Community Outreach',
          description: 'Join us as we serve our local community with food and fellowship.',
          date: '2025-02-01',
          time: '9:00 AM',
          location: 'Community Center',
          branch: 'Both Branches',
          attendees: 28,
          maxAttendees: 50,
          category: 'Outreach',
          isAttending: false,
          image: 'https://via.placeholder.com/400x200?text=Community+Outreach'
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) >= new Date();
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'upcoming') return isUpcoming(event.date);
    if (filter === 'past') return !isUpcoming(event.date);
    if (filter === 'attending') return event.isAttending;
    return true;
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading events..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-gray-600">
            Stay connected with our community events and activities
          </p>
        </div>
        <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
          Request Event
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past Events' },
            { key: 'attending', label: 'My Events' },
            { key: 'all', label: 'All Events' }
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
            </button>
          ))}
        </nav>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            {filter === 'upcoming' && "There are no upcoming events at this time."}
            {filter === 'past' && "No past events to show."}
            {filter === 'attending' && "You're not registered for any events yet."}
            {filter === 'all' && "No events available."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover group">
              {/* Event Image */}
              <div className="relative mb-4">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.category === 'Worship' ? 'bg-primary-100 text-primary-800' :
                    event.category === 'Study' ? 'bg-success-100 text-success-800' :
                    event.category === 'Outreach' ? 'bg-secondary-100 text-secondary-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.category}
                  </span>
                </div>
                {event.isAttending && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-success-500 text-white rounded-full">
                      Attending
                    </span>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    {event.time}
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      {event.attendees}/{event.maxAttendees} attending
                    </div>
                    <span className="text-xs text-gray-400">
                      {event.branch}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Link to={`/events/${event.id}`} className="flex-1">
                    <Button variant="secondary" fullWidth size="small">
                      View Details
                    </Button>
                  </Link>
                  <Button 
                    variant={event.isAttending ? "danger" : "primary"} 
                    fullWidth 
                    size="small"
                  >
                    {event.isAttending ? "Cancel" : "Join Event"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
