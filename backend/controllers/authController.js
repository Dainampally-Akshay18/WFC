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
// const selectBranch = async (req, res) => {
//   try {
//     const { uid } = req;
//     const { branch } = req.body;

//     if (!['branch1', 'branch2'].includes(branch)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid branch selection. Must be branch1 or branch2'
//       });
//     }

//     const user = await User.findOneAndUpdate(
//       { firebaseUID: uid },
//       { 
//         branch, 
//         branchSelectedAt: new Date()
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }

//     res.json({
//       status: 'success',
//       message: `Branch ${branch} selected successfully. Your request is pending pastor approval.`,
//       data: {
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           branch: user.branch,
//           approvalStatus: user.approvalStatus
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Branch selection error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Branch selection failed',
//       error: error.message
//     });
//   }
// };

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
  const { uid, email, name, photoURL, provider } = req.body;
  
  console.log('🔐 Google login request:', { uid, email, name });

  try {
    if (!uid || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Firebase UID and email are required'
      });
    }

    // ⭐ Find existing user first
    let existingUser = await User.findOne({
      $or: [
        { firebaseUID: uid },
        { email: email }
      ]
    });

    if (existingUser) {
      // ⭐ EXISTING USER - Update their info and return complete data
      console.log('🔄 Existing user found, updating info');
      
      existingUser.firebaseUID = uid;
      existingUser.name = name || existingUser.name;
      existingUser.photoURL = photoURL || existingUser.photoURL;
      existingUser.lastLogin = new Date();
      
      await existingUser.save();
      
      console.log('✅ Existing user updated:', {
        id: existingUser._id,
        email: existingUser.email,
        branch: existingUser.branch,
        approvalStatus: existingUser.approvalStatus
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Google login successful - existing user',
        data: {
          user: {
            id: existingUser._id,
            firebaseUID: existingUser.firebaseUID,
            email: existingUser.email,
            name: existingUser.name,
            photoURL: existingUser.photoURL,
            branch: existingUser.branch, // ⭐ Important!
            approvalStatus: existingUser.approvalStatus, // ⭐ Important!
            userType: 'user',
            loginMethod: 'google',
            isNewUser: false // ⭐ Flag for frontend
          }
        }
      });
    } else {
      // ⭐ NEW USER - Create with pending status
      console.log('🆕 New user, creating account');
      
      const newUser = new User({
        firebaseUID: uid,
        email: email,
        name: name || 'Google User',
        photoURL: photoURL,
        // ⭐ Don't set branch yet - they need to select it
        approvalStatus: 'pending',
        loginMethod: 'google',
        lastLogin: new Date()
      });
      
      await newUser.save();
      
      console.log('✅ New user created:', newUser._id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Google login successful - new user',
        data: {
          user: {
            id: newUser._id,
            firebaseUID: newUser.firebaseUID,
            email: newUser.email,
            name: newUser.name,
            photoURL: newUser.photoURL,
            branch: null, // ⭐ No branch yet
            approvalStatus: 'pending',
            userType: 'user',
            loginMethod: 'google',
            isNewUser: true // ⭐ Flag for frontend
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Google login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Google login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const selectBranch = async (req, res) => {
  const { branch, firebaseUID, email, name } = req.body;
  
  console.log('🏢 Branch selection request:', { 
    branch, 
    firebaseUID, 
    email, 
    name,
    origin: req.headers.origin 
  });

  try {
    // Validate branch selection
    if (!branch || !['branch1', 'branch2'].includes(branch)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid branch selection required (branch1 or branch2)'
      });
    }

    // ⭐ Validate user identification data
    if (!firebaseUID && !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Firebase UID or email required to identify user'
      });
    }
    
    // ⭐ Find user by Firebase UID first, then by email
    let query = {};
    if (firebaseUID) {
      query = { firebaseUID: firebaseUID };
      console.log('🔍 Looking for user by Firebase UID:', firebaseUID);
    } else {
      query = { email: email };
      console.log('🔍 Looking for user by email:', email);
    }
    
    // Update user's branch information
    const updatedUser = await User.findOneAndUpdate(
      query,
      { 
        branch: branch,
        approvalStatus: 'pending',
        needsBranchSelection: false,
        updatedAt: new Date(),
        // Update name if provided (for Google users)
        ...(name && { name: name })
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    if (!updatedUser) {
      console.error('❌ User not found with query:', query);
      return res.status(404).json({
        status: 'error',
        message: 'User not found. Please login again.',
        debug: { searchQuery: query }
      });
    }
    
    console.log('✅ User branch updated successfully:', {
      id: updatedUser._id,
      email: updatedUser.email,
      branch: updatedUser.branch
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Branch selected successfully',
      data: {
        user: {
          id: updatedUser._id,
          firebaseUID: updatedUser.firebaseUID,
          email: updatedUser.email,
          name: updatedUser.name,
          photoURL: updatedUser.photoURL,
          branch: updatedUser.branch,
          approvalStatus: updatedUser.approvalStatus,
          userType: updatedUser.userType,
          needsBranchSelection: updatedUser.needsBranchSelection
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Branch selection error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Branch selection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getStatus = async (req, res) => {
  try {
    // Get Firebase UID from request (you'll need to implement auth middleware)
    // For now, we'll use email from request body
    const { firebaseUID, email } = req.body;
    
    console.log('👤 Getting user status for:', { firebaseUID, email });

    if (!firebaseUID && !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Firebase UID or email required'
      });
    }

    // Find user in database
    const query = firebaseUID 
      ? { firebaseUID: firebaseUID }
      : { email: email };
    
    const user = await User.findOne(query);
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.json({
        status: 'success',
        message: 'User status retrieved',
        data: {
          needsSetup: true, // New user needs setup
          user: null
        }
      });
    }

    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      branch: user.branch,
      approvalStatus: user.approvalStatus
    });

    return res.json({
      status: 'success',
      message: 'User status retrieved',
      data: {
        needsSetup: false,
        user: {
          id: user._id,
          firebaseUID: user.firebaseUID,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          branch: user.branch,
          approvalStatus: user.approvalStatus,
          userType: user.userType,
          needsBranchSelection: !user.branch,
          loginMethod: user.loginMethod
        }
      }
    });
  } catch (error) {
    console.error('❌ Get user status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get user status'
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
  googleLogin,
  getStatus
};
