import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  PlayIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const SermonList = () => {
  const [sermons, setSermons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'faith', name: 'Faith' },
    { id: 'hope', name: 'Hope' },
    { id: 'love', name: 'Love' },
    { id: 'prayer', name: 'Prayer' },
    { id: 'family', name: 'Family' }
  ];

  useEffect(() => {
    fetchSermons();
  }, [selectedCategory, sortBy]);

  const fetchSermons = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSermons = [
        {
          id: 1,
          title: 'Faith in Times of Trial',
          description: 'A powerful message about maintaining faith during difficult times and finding strength in God\'s promises.',
          category: 'Faith',
          pastor: 'Pastor John Smith',
          duration: '45:30',
          views: 1234,
          createdAt: '2025-01-20T10:30:00Z',
          thumbnail: 'https://via.placeholder.com/400x225?text=Faith+in+Times+of+Trial',
          tags: ['faith', 'trials', 'strength']
        },
        {
          id: 2,
          title: 'The Power of Prayer',
          description: 'Understanding the importance of prayer in our daily lives and how it connects us with God.',
          category: 'Prayer',
          pastor: 'Pastor Sarah Johnson',
          duration: '38:15',
          views: 987,
          createdAt: '2025-01-15T09:00:00Z',
          thumbnail: 'https://via.placeholder.com/400x225?text=The+Power+of+Prayer',
          tags: ['prayer', 'spiritual', 'connection']
        },
        {
          id: 3,
          title: 'Love Without Boundaries',
          description: 'Exploring God\'s unconditional love for us and how we can share that love with others.',
          category: 'Love',
          pastor: 'Pastor Michael Brown',
          duration: '42:00',
          views: 756,
          createdAt: '2025-01-10T11:00:00Z',
          thumbnail: 'https://via.placeholder.com/400x225?text=Love+Without+Boundaries',
          tags: ['love', 'compassion', 'community']
        }
      ];

      setSermons(mockSermons);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSermons = sermons.filter(sermon => {
    const matchesSearch = sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sermon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           sermon.category.toLowerCase() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading sermons..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sermons</h1>
          <p className="mt-1 text-gray-600">
            Discover inspiring messages from our pastoral team
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-gray-500">
            {filteredSermons.length} sermon{filteredSermons.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search sermons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select-field"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-field"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mostViewed">Most Viewed</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sermons Grid */}
      {filteredSermons.length === 0 ? (
        <Card className="text-center py-12">
          <FunnelIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sermons found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or browse all categories.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSermons.map((sermon) => (
            <Card key={sermon.id} className="card-hover group">
              {/* Thumbnail */}
              <div className="relative mb-4">
                <img
                  src={sermon.thumbnail}
                  alt={sermon.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <PlayIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {sermon.duration}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {/* Category Badge */}
                <span className="badge-primary">
                  {sermon.category}
                </span>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {sermon.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm line-clamp-3">
                  {sermon.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {formatDate(sermon.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {sermon.views}
                    </div>
                  </div>
                </div>

                {/* Pastor */}
                <p className="text-sm text-gray-600">
                  by {sermon.pastor}
                </p>

                {/* Action Button */}
                <Link to={`/sermons/${sermon.id}`} className="block">
                  <Button variant="primary" fullWidth>
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Watch Sermon
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SermonList;
