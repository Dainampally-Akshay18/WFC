import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-danger-600">403</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Unauthorized</h2>
        <p className="text-gray-600 mt-2 mb-8">
          You don't have permission to access this resource.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">
            Go back home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
