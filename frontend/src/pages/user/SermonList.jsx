import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  // ⭐ FETCH CATEGORIES ON COMPONENT MOUNT
  useEffect(() => {
    fetchCategories();
  }, []);

  // ⭐ FETCH SERMONS WHEN CATEGORY CHANGES
  useEffect(() => {
    if (selectedCategory) {
      fetchSermonsByCategory();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      console.log('🔍 Fetching categories...');
      const response = await fetch('/api/sermons/categories', {
        method: 'GET',
        headers
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Categories response:', data);
      
      // Handle different response formats
      if (data.success || data.status === 'success') {
        setCategories(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setError('Failed to load sermon categories');
      
      // ⭐ FALLBACK: Mock categories if backend fails
      setCategories([
        { category: 'Faith', count: 12 },
        { category: 'Prayer', count: 8 },
        { category: 'Love', count: 6 },
        { category: 'Family', count: 10 },
        { category: 'Hope', count: 7 },
        { category: 'Worship', count: 9 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSermonsByCategory = async () => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      console.log('🔍 Fetching sermons for category:', selectedCategory.category);
      const response = await fetch(`/api/sermons/category/${selectedCategory.category}`, {
        method: 'GET',
        headers
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch sermons: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Sermons response:', data);
      
      // Handle different response formats
      if (data.success || data.status === 'success') {
        setSermons(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load sermons');
      }
    } catch (error) {
      console.error('❌ Error fetching sermons:', error);
      setError('Failed to load sermons');
      
      // ⭐ FALLBACK: Mock sermons for selected category
      const mockSermons = [
        {
          _id: '1',
          title: `${selectedCategory.category} - Walking in Faith`,
          description: `A powerful message about ${selectedCategory.category.toLowerCase()} and finding strength in God's promises. This sermon explores the depths of spiritual growth and understanding.`,
          category: selectedCategory.category,
          uploadedBy: { name: 'Pastor John Smith' },
          duration: '45:30',
          views: 1234,
          createdAt: '2025-01-20T10:30:00Z',
          videoURL: `https://via.placeholder.com/400x225?text=${selectedCategory.category}+Sermon`,
        },
        {
          _id: '2',
          title: `${selectedCategory.category} - Growing Deeper`,
          description: `Understanding ${selectedCategory.category.toLowerCase()} in our daily walk with Christ. This message will inspire and encourage your spiritual journey.`,
          category: selectedCategory.category,
          uploadedBy: { name: 'Pastor Sarah Johnson' },
          duration: '38:15',
          views: 987,
          createdAt: '2025-01-15T09:00:00Z',
          videoURL: `https://via.placeholder.com/400x225?text=${selectedCategory.category}+Message`,
        }
      ];
      setSermons(mockSermons);
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ FILTER SERMONS BY SEARCH TERM
  const filteredSermons = sermons.filter(sermon =>
    sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sermon.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sermon.uploadedBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchTerm(''); // Clear search when switching categories
    setError(''); // Clear any previous errors
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSermons([]);
    setSearchTerm('');
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading sermons...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ⭐ SHOW CATEGORIES FIRST */}
      {!selectedCategory ? (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sermon Categories</h1>
            <p className="text-gray-600">Choose a category to explore inspiring messages</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
                onClick={() => handleCategorySelect(category)}
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {category.category.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category.category}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.count || 0} sermons available
                  </p>
                  <Button variant="primary" size="sm">
                    View Sermons →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* ⭐ SHOW SERMONS FOR SELECTED CATEGORY */
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={handleBackToCategories}
              >
                ← Back to Categories
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedCategory.category} Sermons
                </h1>
                <p className="text-gray-600">
                  {filteredSermons.length} sermon{filteredSermons.length !== 1 ? 's' : ''} in this category
                </p>
              </div>
            </div>

            <Input
              type="text"
              placeholder={`Search ${selectedCategory.category} sermons...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {filteredSermons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FunnelIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sermons found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? `No sermons match "${searchTerm}" in ${selectedCategory.category}`
                  : `No sermons available in ${selectedCategory.category} category yet.`
                }
              </p>
              {searchTerm && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSermons.map((sermon) => (
                <Card key={sermon._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="relative">
                    <img
                      src={sermon.videoURL || 'https://via.placeholder.com/400x225?text=Sermon+Video'}
                      alt={sermon.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x225?text=Sermon+Video';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <PlayIcon className="w-12 h-12 text-white" />
                    </div>
                    {sermon.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {sermon.duration}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {sermon.category}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {sermon.views?.toLocaleString() || 0}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link
                        to={`/sermons/${sermon._id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {sermon.title}
                      </Link>
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {sermon.description.length > 120
                        ? sermon.description.substring(0, 120) + '...'
                        : sermon.description
                      }
                    </p>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(sermon.createdAt)}
                      </div>
                      <span className="text-gray-700 font-medium">
                        {sermon.uploadedBy?.name || 'Pastor'}
                      </span>
                    </div>

                    <Link to={`/sermons/${sermon._id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
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
      )}
    </div>
  );
};

export default SermonList;
