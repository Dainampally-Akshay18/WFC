import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const ForgotPassword = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
        <p className="mt-2 text-gray-600">Coming soon...</p>
      </div>
      <Link to="/login">
        <Button variant="secondary" fullWidth>
          Back to Login
        </Button>
      </Link>
    </div>
  );
};

export default ForgotPassword;
