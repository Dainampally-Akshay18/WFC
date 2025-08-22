import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import ReactPlayer from 'react-player';
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
  TagIcon,
} from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

const SermonDetail = () => {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState('');
  const [relatedSermons, setRelatedSermons] = useState([]);

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

  // ⭐ HELPER FUNCTIONS TO DETECT VIDEO TYPE
  const isYouTubeUrl = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const isCloudinaryUrl = (url) => {
    return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
  };

  const isAzureBlobUrl = (url) => {
    return url && url.includes('blob.core.windows.net');
  };

  // ⭐ CONVERT CLOUDINARY EMBED URL TO DIRECT VIDEO URL
  const getCloudinaryVideoUrl = (embedUrl) => {
    try {
      // Extract cloud_name and public_id from embed URL
      const urlParams = new URLSearchParams(embedUrl.split('?')[1]);
      const cloudName = urlParams.get('cloud_name');
      const publicId = urlParams.get('public_id');
      
      if (cloudName && publicId) {
        // Return direct Cloudinary video URL
        return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
      }
    } catch (error) {
      console.error('Error parsing Cloudinary URL:', error);
    }
    return null;
  };

  useEffect(() => {
    if (id) {
      fetchSermon();
    }
  }, [id]);

  const fetchSermon = async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      
      console.log('🔍 Fetching sermon with ID:', id);
      const response = await fetch(`/api/sermons/${id}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sermon: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Sermon response:', data);

      if (data.success || data.status === 'success') {
        setSermon(data.data || data.sermon);
        if (data.data?.category) {
          fetchRelatedSermons(data.data.category);
        }
      } else {
        throw new Error(data.message || 'Failed to load sermon');
      }
    } catch (error) {
      console.error('❌ Error fetching sermon:', error);
      setError('Failed to load sermon details');
      
      // ⭐ FALLBACK: Mock sermon data
      const mockSermon = {
        _id: id,
        title: 'Love Your Neighbor',
        description: 'Understanding what it means to love our neighbors as ourselves',
        fullContent: `Welcome, brothers and sisters in Christ. Today we gather to discuss the importance of loving our neighbors as ourselves.

This fundamental teaching of Jesus calls us to extend compassion, kindness, and understanding to those around us. It challenges us to look beyond our own needs and consider the welfare of others.

When Jesus spoke about loving our neighbors, He wasn't just talking about the people who live next door. He was referring to everyone we encounter - colleagues, strangers, even those who may disagree with us.

The parable of the Good Samaritan illustrates this beautifully. It shows us that being a neighbor means actively helping those in need, regardless of their background or circumstances.

In our modern world, this teaching is more relevant than ever. We live in divided times, but love has the power to bridge any gap. When we choose love over fear, understanding over judgment, we create communities that reflect God's kingdom on earth.

Let us commit today to being good neighbors - not just in word, but in deed. May our actions reflect the love that Christ has shown us.

God bless you all. Amen.`,
        // ⭐ CLOUDINARY URL LIKE YOUR DATABASE
        videoURL: 'https://player.cloudinary.com/embed/?cloud_name=dadapse5k&public_id=n7...',
        duration: '1800', // 30 minutes in seconds
        views: 4,
        createdAt: '2025-08-20T16:27:30.794Z',
        category: 'Love',
        tags: ['love', 'community', 'service'],
        downloadable: true,
        uploadedBy: {
          name: 'Pastor John Smith',
          title: 'Senior Pastor',
          bio: 'Senior Pastor with 15 years of ministry experience'
        }
      };
      setSermon(mockSermon);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedSermons = async (category) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sermons/category/${category}?limit=3`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success || data.status === 'success') {
          const related = (data.data || []).filter(s => s._id !== id).slice(0, 3);
          setRelatedSermons(related);
        }
      }
    } catch (error) {
      console.error('Error fetching related sermons:', error);
    }
  };

  // ⭐ FORMAT DURATION FROM SECONDS TO MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    console.log(isBookmarked ? 'Removed bookmark' : 'Added bookmark');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: sermon.title,
          text: sermon.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Sharing failed. Link: ' + window.location.href);
    }
  };

  const handleDownload = () => {
    if (sermon.downloadable && sermon.videoURL) {
      let downloadUrl = sermon.videoURL;
      
      // Convert Cloudinary embed URL to direct video URL for download
      if (isCloudinaryUrl(sermon.videoURL)) {
        downloadUrl = getCloudinaryVideoUrl(sermon.videoURL);
      }
      
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${sermon.title}.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Download not available for this video format.');
      }
    } else {
      alert('This video is not available for download.');
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
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading sermon...</span>
      </div>
    );
  }

  if (error && !sermon) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/sermons" className="flex items-center space-x-2 mb-6 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Sermons</span>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Sermon</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/sermons" className="flex items-center space-x-2 mb-6 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Sermons</span>
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sermon Not Found</h2>
          <p className="text-gray-600">The sermon you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link to="/sermons" className="flex items-center space-x-2 mb-6 text-blue-600 hover:text-blue-800 transition-colors">
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back to Sermons</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Sermon Header */}
          <div className="mb-6">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {sermon.category}
              </span>
              {sermon.tags?.map((tag, index) => (
                <span key={index} className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{sermon.title}</h1>
            
            <div className="flex items-center flex-wrap gap-6 text-gray-600 mb-4">
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                <span>{formatDate(sermon.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <PlayIcon className="w-5 h-5 mr-2" />
                <span>{typeof sermon.duration === 'number' ? formatDuration(sermon.duration) : sermon.duration}</span>
              </div>
              <div className="flex items-center">
                <EyeIcon className="w-5 h-5 mr-2" />
                <span>{sermon.views?.toLocaleString() || 0} views</span>
              </div>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed">{sermon.description}</p>
          </div>

          {/* ⭐ SMART VIDEO PLAYER - HANDLES ALL VIDEO TYPES */}
          <div className="relative mb-8 bg-black rounded-lg overflow-hidden shadow-lg">
            {sermon.videoURL ? (
              <>
                {isYouTubeUrl(sermon.videoURL) ? (
                  // ⭐ YOUTUBE PLAYER
                  <div className="aspect-video">
                    <ReactPlayer
                      url={sermon.videoURL}
                      controls={true}
                      width="100%"
                      height="100%"
                      config={{
                        youtube: {
                          playerVars: {
                            showinfo: 1,
                            origin: window.location.origin
                          }
                        }
                      }}
                    />
                  </div>
                ) : isCloudinaryUrl(sermon.videoURL) ? (
                  // ⭐ CLOUDINARY PLAYER USING IFRAME
                  <div className="aspect-video">
                    <iframe
                      src={sermon.videoURL}
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={sermon.title}
                    />
                  </div>
                ) : (
                  // ⭐ HTML5 VIDEO FOR AZURE BLOB/MP4 FILES
                  <video
                    controls
                    className="w-full aspect-video"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Video loading error:', e);
                    }}
                  >
                    <source src={sermon.videoURL} type="video/mp4" />
                    <source src={sermon.videoURL} type="video/webm" />
                    <source src={sermon.videoURL} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </>
            ) : (
              <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <PlayIcon className="w-16 h-16 mx-auto mb-2" />
                  <p>Video not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center flex-wrap gap-3">
              <Button
                onClick={toggleBookmark}
                variant={isBookmarked ? "primary" : "secondary"}
                size="sm"
              >
                <BookmarkIcon className="w-5 h-5 mr-2" />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              
              <Button onClick={handleShare} variant="secondary" size="sm">
                <ShareIcon className="w-5 h-5 mr-2" />
                Share
              </Button>
              
              {sermon.downloadable && (
                <Button onClick={handleDownload} variant="secondary" size="sm">
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Download
                </Button>
              )}
            </div>
            
            {/* Video Type Indicator */}
            <div className="text-sm text-gray-500">
              {isYouTubeUrl(sermon.videoURL) && "📺 YouTube Video"}
              {isCloudinaryUrl(sermon.videoURL) && "☁️ Cloudinary Video"}
              {isAzureBlobUrl(sermon.videoURL) && "🔵 Azure Blob Video"}
            </div>
          </div>

          {/* Full Content */}
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sermon Content</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {sermon.fullContent || sermon.description}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Pastor Info */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">About the Pastor</h3>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">
                  {sermon.uploadedBy?.name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{sermon.uploadedBy?.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{sermon.uploadedBy?.title}</p>
                <p className="text-sm text-gray-500">{sermon.uploadedBy?.bio}</p>
              </div>
            </div>
          </Card>

          {/* Related Sermons */}
          {relatedSermons.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Related Sermons</h3>
              <div className="space-y-4">
                {relatedSermons.map((relatedSermon) => (
                  <Link
                    key={relatedSermon._id}
                    to={`/sermons/${relatedSermon._id}`}
                    className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {relatedSermon.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {relatedSermon.description.length > 80
                        ? relatedSermon.description.substring(0, 80) + '...'
                        : relatedSermon.description
                      }
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{relatedSermon.uploadedBy?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{typeof relatedSermon.duration === 'number' ? formatDuration(relatedSermon.duration) : relatedSermon.duration}</span>
                      {isYouTubeUrl(relatedSermon.videoURL) && <span className="mx-2">• 📺</span>}
                      {isCloudinaryUrl(relatedSermon.videoURL) && <span className="mx-2">• ☁️</span>}
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
