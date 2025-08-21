import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PlayIcon,
  EyeIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const SermonDetail = () => {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    fetchSermon();
  }, [id]);

  const fetchSermon = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSermon = {
        id: parseInt(id),
        title: 'Faith in Times of Trial',
        description: 'A powerful message about maintaining faith during difficult times and finding strength in God\'s promises. In this sermon, we explore how faith can be our anchor when life\'s storms rage around us.',
        fullContent: `
          <p>Welcome, brothers and sisters. Today we gather to discuss one of the most challenging aspects of our Christian walk - maintaining faith during times of trial.</p>
          
          <h3>The Nature of Trials</h3>
          <p>Trials come in many forms. They may be financial difficulties, health challenges, relationship problems, or spiritual battles. But remember, trials are not a sign that God has abandoned us.</p>
          
          <h3>Lessons from Scripture</h3>
          <p>In James 1:2-4, we read: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance."</p>
          
          <h3>Practical Steps</h3>
          <ul>
            <li>Maintain regular prayer and Bible study</li>
            <li>Stay connected with your church community</li>
            <li>Remember God's past faithfulness</li>
            <li>Trust in God's perfect timing</li>
          </ul>
        `,
        category: 'Faith',
        pastor: {
          name: 'Pastor John Smith',
          title: 'Senior Pastor',
          bio: 'Pastor John has been serving our community for over 15 years.'
        },
        duration: '45:30',
        views: 1234,
        createdAt: '2025-01-20T10:30:00Z',
        videoUrl: 'https://example.com/sermon-video.mp4',
        audioUrl: 'https://example.com/sermon-audio.mp3',
        downloadable: true,
        tags: ['faith', 'trials', 'strength', 'perseverance'],
        relatedSermons: [
          {
            id: 2,
            title: 'The Power of Prayer',
            pastor: 'Pastor Sarah Johnson',
            views: 987
          },
          {
            id: 3,
            title: 'Hope in Dark Times',
            pastor: 'Pastor Michael Brown',
            views: 756
          }
        ]
      };

      setSermon(mockSermon);
    } catch (error) {
      console.error('Error fetching sermon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: sermon.title,
          text: sermon.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading sermon..." />;
  }

  if (!sermon) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sermon not found</h1>
        <Link to="/sermons">
          <Button variant="primary">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Sermons
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/sermons">
        <Button variant="ghost">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Sermons
        </Button>
      </Link>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <Card className="!p-0">
            <div className="aspect-video bg-gray-900 rounded-t-xl flex items-center justify-center">
              <PlayIcon className="w-16 h-16 text-white cursor-pointer hover:text-primary-400 transition-colors" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="badge-primary">{sermon.category}</span>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {formatDate(sermon.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {sermon.views} views
                  </div>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {sermon.title}
              </h1>

              <div className="flex items-center space-x-4 mb-6">
                <Button 
                  variant="primary"
                  leftIcon={<PlayIcon className="w-4 h-4" />}
                >
                  Play Video
                </Button>
                {sermon.downloadable && (
                  <Button 
                    variant="secondary"
                    leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>}
                  >
                    Download
                  </Button>
                )}
                <Button 
                  variant="secondary"
                  onClick={handleShare}
                  leftIcon={<ShareIcon className="w-4 h-4" />}
                >
                  Share
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  leftIcon={<BookmarkIcon className="w-4 h-4" />}
                >
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Sermon</h2>
            <p className="text-gray-700 leading-relaxed">
              {sermon.description}
            </p>
          </Card>

          {/* Full Content */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sermon Notes</h2>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: sermon.fullContent }}
            />
          </Card>

          {/* Tags */}
          {sermon.tags && sermon.tags.length > 0 && (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {sermon.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pastor Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaker</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-lg">
                  {sermon.pastor.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{sermon.pastor.name}</h4>
                <p className="text-sm text-gray-600">{sermon.pastor.title}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-3">{sermon.pastor.bio}</p>
          </Card>

          {/* Related Sermons */}
          {sermon.relatedSermons && sermon.relatedSermons.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Sermons</h3>
              <div className="space-y-4">
                {sermon.relatedSermons.map((relatedSermon) => (
                  <Link
                    key={relatedSermon.id}
                    to={`/sermons/${relatedSermon.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {relatedSermon.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      by {relatedSermon.pastor}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      {relatedSermon.views} views
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SermonDetail;
