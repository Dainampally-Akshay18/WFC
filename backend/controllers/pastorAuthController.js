// pastorAuthController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Pastor = require('../models/Pastor');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

console.log('🔑 JWT_SECRET loaded:', Boolean(JWT_SECRET));

// Utility functions
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

const generateToken = (pastorData) => {
  return jwt.sign(pastorData, JWT_SECRET, { expiresIn: '24h' });
};

const createPastorResponse = (pastor, token) => {
  return {
    success: true,
    authtoken: token,
    pastor: {
      id: pastor.id,
      name: pastor.name,
      email: pastor.email,
      title: pastor.title,
      adminLevel: pastor.adminLevel,
      permissions: pastor.permissions
    }
  };
};

// --- Signup ---
const signup = async (req, res) => {
  try {
    console.log('📝 Signup request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, title, adminLevel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = normalizeEmail(email);
    console.log(`📝 Creating new pastor: ${normalizedEmail}`);

    // Check if pastor already exists
    const existingPastor = await Pastor.findOne({ email: normalizedEmail });
    if (existingPastor) {
      console.log(`❌ Pastor already exists: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Pastor with this email already exists'
      });
    }

    // Create pastor with plain password - Mongoose pre-save hook will hash it
    console.log(`🔐 Creating pastor record for ${normalizedEmail} (Mongoose will hash password)`);
    
    const newPastor = await Pastor.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Plain password - Mongoose will hash this
      title: title || 'Pastor',
      adminLevel: adminLevel || 'pastor',
      permissions: {
        manageUsers: true,
        manageBothBranches: true,
        manageContent: true,
        manageSermons: true,
        createAdmins: adminLevel === 'super_admin'
      }
    });

    console.log(`✅ Pastor created successfully: ${normalizedEmail}`);
    console.log(`📝 Stored password format: ${newPastor.password.substring(0, 20)}...`);
    console.log(`📝 Stored password length: ${newPastor.password.length}`);

    const tokenData = {
      pastor: {
        id: newPastor.id,
        email: newPastor.email,
        adminLevel: newPastor.adminLevel,
        userType: 'pastor'
      }
    };

    const token = generateToken(tokenData);
    console.log(`✅ Token generated for ${normalizedEmail}`);

    return res.status(201).json(createPastorResponse(newPastor, token));

  } catch (error) {
    console.error('❌ Signup error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred'
    });
  }
};

// --- Login ---
const login = async (req, res) => {
  try {
    console.log('📝 Login request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const normalizedEmail = normalizeEmail(email);
    console.log(`🔍 Login attempt for: ${normalizedEmail}`);
    console.log(`📝 Input password length: ${password.length}`);

    // Find pastor
    const pastor = await Pastor.findOne({ 
      email: normalizedEmail, 
      isActive: true 
    }).select('+password');

    if (!pastor) {
      console.log(`❌ Pastor not found: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log(`✅ Pastor found: ${normalizedEmail}`);
    console.log(`📝 Stored password format: ${pastor.password.substring(0, 20)}...`);
    console.log(`📝 Stored password length: ${pastor.password.length}`);

    // Verify password using bcrypt
    console.log(`🔍 Verifying password with bcrypt for ${normalizedEmail}`);
    const isPasswordValid = await bcrypt.compare(password, pastor.password);
    console.log(`✅ Bcrypt verification result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log(`❌ Password verification failed for ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log(`✅ Password verified successfully for ${normalizedEmail}`);

    // Update last login
    pastor.lastLogin = new Date();
    await pastor.save();

    // Generate JWT token
    const tokenData = {
      pastor: {
        id: pastor.id,
        email: pastor.email,
        adminLevel: pastor.adminLevel,
        userType: 'pastor'
      }
    };

    const token = generateToken(tokenData);
    console.log(`✅ Token generated for ${normalizedEmail}`);
    console.log(`🎉 Login successful for ${normalizedEmail}`);

    return res.json(createPastorResponse(pastor, token));

  } catch (error) {
    console.error('❌ Login error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred'
    });
  }
};

// --- Get Profile ---
const getProfile = async (req, res) => {
  try {
    const pastorId = req.pastor?.id;
    
    if (!pastorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const pastor = await Pastor.findById(pastorId).select('-password');
    
    if (!pastor) {
      return res.status(404).json({
        success: false,
        error: 'Pastor not found'
      });
    }

    console.log(`✅ Profile retrieved for ${pastor.email}`);
    return res.json({
      success: true,
      pastor
    });

  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred'
    });
  }
};

// --- Update Profile ---
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const pastorId = req.pastor?.id;
    const { name, bio, title } = req.body;

    if (!pastorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio?.trim() || bio;
    if (title) updateData.title = title;

    console.log(`📝 Updating profile for pastor ID: ${pastorId}`);

    const updatedPastor = await Pastor.findByIdAndUpdate(
      pastorId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedPastor) {
      return res.status(404).json({
        success: false,
        error: 'Pastor not found'
      });
    }

    console.log(`✅ Profile updated successfully for ${updatedPastor.email}`);
    return res.json({
      success: true,
      pastor: updatedPastor
    });

  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred'
    });
  }
};

// --- Change Password ---
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const pastorId = req.pastor?.id;
    const { currentPassword, newPassword } = req.body;

    if (!pastorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const pastor = await Pastor.findById(pastorId).select('+password');
    
    if (!pastor) {
      return res.status(404).json({
        success: false,
        error: 'Pastor not found'
      });
    }

    console.log(`📝 Changing password for ${pastor.email}`);

    // Verify current password
    console.log(`🔍 Verifying current password for ${pastor.email}`);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, pastor.password);
    console.log(`✅ Current password verification result: ${isCurrentPasswordValid}`);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password - Mongoose pre-save hook will hash it
    console.log(`🔐 Updating password for ${pastor.email} (Mongoose will hash it)`);
    pastor.password = newPassword; // Plain password - Mongoose will hash this
    await pastor.save();

    console.log(`✅ Password changed successfully for ${pastor.email}`);

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred'
    });
  }
};

// --- Logout ---
const logout = async (req, res) => {
  try {
    console.log('📝 Logout request received');
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred'
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};