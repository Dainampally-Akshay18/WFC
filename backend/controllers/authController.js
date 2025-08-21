const { User, Pastor } = require('../models');
const admin = require('firebase-admin');

// Universal login handler (works for Email/Password AND Google)
const universalLogin = async (req, res) => {
  try {
    const { uid, email, name, picture } = req.firebaseUser;

    // 1. Look up the user in User or Pastor collections
    let user = await User.findOne({ firebaseUID: uid });
    let pastor = !user ? await Pastor.findOne({ firebaseUID: uid }) : null;

    // 2. If not found, create new user (for first-time Google login or email registration)
    if (!user && !pastor) {
      // Check if it's a known pastor email (you can customize this logic)
      const isPastorEmail = await checkIfPastorEmail(email);
      
      if (isPastorEmail) {
        pastor = await Pastor.create({
          firebaseUID: uid,
          email,
          name: name || email.split('@')[0],
          profilePicture: picture || '',
          title: 'Pastor',
          adminLevel: 'pastor'
        });

        return res.status(201).json({
          status: 'success',
          message: 'Pastor account created successfully',
          data: { 
            userType: 'pastor', 
            pastor: {
              id: pastor._id,
              name: pastor.name,
              email: pastor.email,
              title: pastor.title,
              adminLevel: pastor.adminLevel,
              permissions: pastor.permissions
            }
          }
        });
      } else {
        // Create regular user
        user = await User.create({
          firebaseUID: uid,
          email,
          name: name || email.split('@')[0],
          profilePicture: picture || '',
          branch: 'branch1', // Default branch, will be updated
          approvalStatus: 'pending'
        });

        return res.status(201).json({
          status: 'pending-profile',
          message: 'Please select your branch to complete registration.',
          data: { 
            userType: 'user',
            userId: user._id, 
            email: user.email,
            name: user.name,
            needsBranchSelection: true
          }
        });
      }
    }

    // 3. Handle existing user login
    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Check approval status
      if (user.approvalStatus === 'pending') {
        return res.status(200).json({
          status: 'pending-approval',
          message: 'Your account is awaiting pastor approval.',
          data: { 
            userType: 'user',
            approvalStatus: user.approvalStatus,
            branch: user.branch
          }
        });
      }

      if (user.approvalStatus === 'rejected') {
        return res.status(200).json({
          status: 'rejected',
          message: 'Your account has been rejected.',
          data: { 
            userType: 'user',
            approvalStatus: user.approvalStatus,
            rejectionReason: user.rejectionReason
          }
        });
      }

      // Check if branch selection is needed
      if (!user.branch || user.branch === 'undefined') {
        return res.status(200).json({
          status: 'needs-branch',
          message: 'Please select your branch.',
          data: { 
            userType: 'user',
            userId: user._id,
            needsBranchSelection: true
          }
        });
      }

      // Successful user login
      return res.status(200).json({
        status: 'success',
        message: 'User login successful',
        data: { 
          userType: 'user', 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            branch: user.branch,
            approvalStatus: user.approvalStatus,
            profilePicture: user.profilePicture,
            bio: user.bio
          }
        }
      });
    }

    // 4. Handle pastor login
    if (pastor) {
      // Update last login
      pastor.lastLogin = new Date();
      await pastor.save();

      return res.status(200).json({
        status: 'success',
        message: 'Pastor login successful',
        data: { 
          userType: 'pastor', 
          pastor: {
            id: pastor._id,
            name: pastor.name,
            email: pastor.email,
            title: pastor.title,
            adminLevel: pastor.adminLevel,
            permissions: pastor.permissions,
            profilePicture: pastor.profilePicture,
            bio: pastor.bio
          }
        }
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
};

// Branch selection endpoint
const selectBranch = async (req, res) => {
  try {
    const { uid } = req;
    const { branch } = req.body;

    if (!['branch1', 'branch2'].includes(branch)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid branch selection. Must be branch1 or branch2'
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID: uid },
      { 
        branch, 
        branchSelectedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: `Branch ${branch} selected successfully. Your request is pending pastor approval.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          branch: user.branch,
          approvalStatus: user.approvalStatus
        }
      }
    });

  } catch (error) {
    console.error('Branch selection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Branch selection failed',
      error: error.message
    });
  }
};

// Get current user status
const getUserStatus = async (req, res) => {
  try {
    const { uid } = req;

    // Check if user exists in User collection
    const user = await User.findOne({ firebaseUID: uid });
    
    if (user) {
      return res.json({
        status: 'success',
        data: {
          userType: 'user',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            branch: user.branch,
            approvalStatus: user.approvalStatus,
            rejectionReason: user.rejectionReason,
            profilePicture: user.profilePicture,
            bio: user.bio
          }
        }
      });
    }

    // Check if user exists in Pastor collection
    const pastor = await Pastor.findOne({ firebaseUID: uid });
    
    if (pastor) {
      return res.json({
        status: 'success',
        data: {
          userType: 'pastor',
          pastor: {
            id: pastor._id,
            name: pastor.name,
            email: pastor.email,
            title: pastor.title,
            adminLevel: pastor.adminLevel,
            permissions: pastor.permissions,
            profilePicture: pastor.profilePicture,
            bio: pastor.bio
          }
        }
      });
    }

    // User not found in database
    res.status(404).json({
      status: 'error',
      message: 'User not found in database'
    });

  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user status',
      error: error.message
    });
  }
};

// Manual user registration (for email/password)
const registerUser = async (req, res) => {
  try {
    const { email, name, bio, profilePicture } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create user in database
    const user = await User.create({
      email,
      name,
      bio: bio || '',
      profilePicture: profilePicture || '',
      approvalStatus: 'pending'
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please complete authentication with Firebase.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Helper function to check if email belongs to a pastor
const checkIfPastorEmail = async (email) => {
  // You can customize this logic
  // For now, check if pastor with this email already exists
  const existingPastor = await Pastor.findOne({ email });
  return !!existingPastor;
  
  // Or you can check against a predefined list:
  // const pastorEmails = ['pastor@church.com', 'admin@church.com'];
  // return pastorEmails.includes(email);
};

// Set Firebase custom claims
const setCustomClaims = async (uid, claims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    return { success: true };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return { success: false, error: error.message };
  }
};

// Logout
const logout = async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Logout failed'
    });
  }
};

// Add this new function to your existing authController.js
const googleLogin = async (req, res) => {
  const { uid, email, name, photoURL } = req.body;

  console.log('🔐 Google login request:', { uid, email, name, photoURL });

  try {
    // TODO: Check if user exists in database
    // For now, returning mock response indicating branch selection is needed
    
    return res.json({
      status: 'success',
      message: 'Google login successful',
      data: {
        user: {
          id: uid || 'google-mock-id',
          email,
          name,
          photoURL,
          branch: null,  // ⭐ No branch selected yet
          approvalStatus: 'pending',  // Will be pending until branch selection
          userType: 'user',
          loginMethod: 'google',
          needsBranchSelection: true  // ⭐ Important: Branch selection required
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Google login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Google login failed',
      error: error.message
    });
  }
};



module.exports = {
  universalLogin,
  selectBranch,
  getUserStatus,
  registerUser,
  setCustomClaims,
  logout,
  googleLogin
};
