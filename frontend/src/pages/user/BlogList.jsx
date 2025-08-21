import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBlogs = [
        {
          id: 1,
          title: 'Walking in Faith: A Personal Journey',
          excerpt: 'In this heartfelt reflection, I share my personal journey of faith and the lessons learned along the way. Life has its ups and downs, but through it all, God remains faithful.',
          content: 'Full blog content would go here...',
          author: {
            name: 'Pastor John Smith',
            title: 'Senior Pastor',
            avatar: 'https://via.placeholder.com/40x40?text=JS'
          },
          publishDate: '2025-01-22T10:00:00Z',
          readTime: '5 min read',
          views: 342,
          tags: ['faith', 'personal', 'testimony'],
          image: 'https://via.placeholder.com/600x300?text=Walking+in+Faith',
          featured: true
        },
        {
          id: 2,
          title: 'The Power of Community in Times of Need',
          excerpt: 'Reflecting on how our church community has been a beacon of hope and support during challenging times. Together we are stronger.',
          content: 'Full blog content would go here...',
          author: {
            name: 'Pastor Sarah Johnson',
            title: 'Associate Pastor',
            avatar: 'https://via.placeholder.com/40x40?text=SJ'
          },
          publishDate: '2025-01-20T14:30:00Z',
          readTime: '7 min read',
          views: 289,
          tags: ['community', 'support', 'hope'],
          image: 'https://via.placeholder.com/600x300?text=Power+of+Community',
          featured: false
        },
        {
          id: 3,
          title: 'Finding Peace in God\'s Promises',
          excerpt: 'In a world full of uncertainty, God\'s promises remain our anchor. Let us explore the scriptures that bring peace to our hearts.',
          content: 'Full blog content would go here...',
          author: {
            name: 'Pastor Michael Brown',
            title: 'Youth Pastor',
            avatar: 'https://via.placeholder.com/40x40?text=MB'
          },
          publishDate: '2025-01-18T09:15:00Z',
          readTime: '4 min read',
          views: 156,
          tags: ['peace', 'promises', 'scripture'],
          image: 'https://via.placeholder.com/600x300?text=Finding+Peace',
          featured: false
        }
      ];

      setBlogs(mockBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const featuredBlog = blogs.find(blog => blog.featured);
  const regularBlogs = blogs.filter(blog => !blog.featured);

  if (isLoading) {
    return <LoadingSpinner text="Loading blog posts..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pastor's Pen</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Heartfelt reflections, spiritual insights, and personal thoughts from our pastoral team
        </p>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto">
        <Input
          type="text"
          placeholder="Search blog posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
        />
      </div>

      {/* Featured Blog */}
      {featuredBlog && !searchTerm && (
        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img
                src={featuredBlog.image}
                alt={featuredBlog.title}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            <div className="md:w-1/2 p-8">
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                  Featured
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                <Link 
                  to={`/blogs/${featuredBlog.id}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {featuredBlog.title}
                </Link>
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {featuredBlog.excerpt}
              </p>

              {/* Author & Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={featuredBlog.author.avatar}
                    alt={featuredBlog.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {featuredBlog.author.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {featuredBlog.author.title}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center mb-1">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {formatDate(featuredBlog.publishDate)}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {featuredBlog.readTime}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {featuredBlog.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(searchTerm ? filteredBlogs : regularBlogs).map((blog) => (
          <Card key={blog.id} className="card-hover group">
            {/* Blog Image */}
            <div className="relative mb-4">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-3 right-3">
                <div className="flex items-center bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  <EyeIcon className="w-3 h-3 mr-1" />
                  {blog.views}
                </div>
              </div>
            </div>

            {/* Blog Content */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                <Link to={`/blogs/${blog.id}`}>
                  {blog.title}
                </Link>
              </h3>

              <p className="text-gray-600 text-sm line-clamp-3">
                {blog.excerpt}
              </p>

              {/* Author & Date */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-600">
                    {blog.author.name}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {formatDate(blog.publishDate)}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {blog.tags.slice(0, 2).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {blog.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{blog.tags.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredBlogs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or browse all posts.
          </p>
        </div>
      )}
    </div>
  );
};

export default BlogList;
