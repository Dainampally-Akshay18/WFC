import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PrayerSubmit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    category: '',
    isAnonymous: false,
    shareWithOtherBranch: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Health', 'Family', 'Career', 'Ministry', 'Spiritual Growth', 
    'Financial', 'Relationships', 'Travel Safety', 'Other'
  ];

  const priorities = [
    { value: 'normal', label: 'Normal', description: 'Regular prayer request' },
    { value: 'high', label: 'High', description: 'Important situation needing focused prayer' },
    { value: 'urgent', label: 'Urgent', description: 'Critical situation requiring immediate prayer' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Prayer title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Prayer description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful submission
      console.log('Prayer request submitted:', formData);
      
      // Redirect to prayer list with success message
      navigate('/prayers', { 
        state: { message: 'Prayer request submitted successfully!' }
      });
    } catch (error) {
      setErrors({ submit: 'Failed to submit prayer request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/prayers">
        <Button variant="ghost">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Prayer Requests
        </Button>
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Submit Prayer Request
        </h1>
        <p className="text-gray-600">
          Share your prayer needs with our caring community
        </p>
      </div>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Your privacy matters</p>
            <p>
              Prayer requests are shared with our prayer team and community members. 
              You can choose to submit anonymously if you prefer privacy.
            </p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <Input
            label="Prayer Title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief title for your prayer request"
            required
            error={errors.title}
            maxLength={100}
          />

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Prayer Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe your prayer request in detail. Share what's on your heart and how we can specifically pray for you..."
              rows={5}
              className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
              maxLength={1000}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{errors.description && <span className="text-red-600">{errors.description}</span>}</span>
              <span>{formData.description.length}/1000</span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`select-field ${errors.category ? 'input-error' : ''}`}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Priority Level
            </label>
            <div className="space-y-2">
              {priorities.map(priority => (
                <label key={priority.value} className="flex items-start">
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {priority.label}
                      </span>
                      {priority.value === 'urgent' && (
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {priority.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Privacy Options */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Privacy Settings</h3>
            
            <label className="flex items-start">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="mt-1 mr-3"
              />
              <div>
                <span className="font-medium text-gray-900">Submit anonymously</span>
                <p className="text-sm text-gray-600 mt-1">
                  Your name will not be shown with this prayer request
                </p>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                name="shareWithOtherBranch"
                checked={formData.shareWithOtherBranch}
                onChange={handleChange}
                className="mt-1 mr-3"
              />
              <div>
                <span className="font-medium text-gray-900">Share with both branches</span>
                <p className="text-sm text-gray-600 mt-1">
                  Allow members from both church branches to see and pray for this request
                </p>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
            >
              Submit Prayer Request
            </Button>
            <Link to="/prayers" className="flex-1">
              <Button variant="secondary" fullWidth>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {/* Guidelines */}
      <Card className="bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">Prayer Request Guidelines</p>
            <ul className="space-y-1 text-sm">
              <li>• Be specific about your prayer needs while maintaining appropriate boundaries</li>
              <li>• Remember that your request will be visible to church members</li>
              <li>• Focus on prayer needs rather than personal grievances</li>
              <li>• Urgent requests should be reserved for critical situations</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrayerSubmit;
