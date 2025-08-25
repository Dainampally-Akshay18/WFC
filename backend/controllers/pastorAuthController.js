// pastorAuthController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Pastor = require('../models/Pastor');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const AUTO_UPGRADE_LEGACY_PW = (process.env.AUTO_UPGRADE_LEGACY_PW === 'true'); // false by default
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

console.log('🔑 JWT_SECRET loaded:', Boolean(JWT_SECRET));
console.log('🔧 AUTO_UPGRADE_LEGACY_PW:', AUTO_UPGRADE_LEGACY_PW);
console.log('🔢 BCRYPT_SALT_ROUNDS:', BCRYPT_SALT_ROUNDS);

// Utility: normalize email
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

// --- Signup ---
const signup = async (req, res) => {
  let success = false;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }

  try {
    const { name, email, password, title, adminLevel } = req.body || {};

    // Basic input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success,
        error: 'Name, email and password are required'
      });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success,
        error: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if pastor exists
    const existing = await Pastor.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success, error: 'Pastor with this email already exists' });
    }

    console.log('🔐 Signup: Hashing password for:', normalizedEmail);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const pastor = await Pastor.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
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

    const data = {
      pastor: {
        id: pastor.id,
        email: pastor.email,
        adminLevel: pastor.adminLevel,
        userType: 'pastor'
      }
    };

    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '24h' });
    success = true;

    console.log('✅ Signup: Pastor created successfully:', pastor.email);
    res.status(201).json({
      success,
      authtoken,
      pastor: {
        id: pastor.id,
        name: pastor.name,
        email: pastor.email,
        title: pastor.title,
        adminLevel: pastor.adminLevel,
        permissions: pastor.permissions
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error && error.message ? error.message : error);
    res.status(500).json({ success: false, error: 'Internal server error occurred' });
  }
};

// --- Login ---
const login = async (req, res) => {
  let success = false;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }

  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    console.log('🔍 Login attempt for email:', normalizedEmail);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success, error: 'Email and password are required' });
    }

    // Fetch with password (schema must set select:false for password normally)
    let pastor = await Pastor.findOne({ email: normalizedEmail, isActive: true }).select('+password');

    console.log('👤 Pastor found:', !!pastor);

    if (!pastor) {
      // Do not reveal whether email exists
      return res.status(400).json({ success, error: 'Invalid credentials' });
    }

    // Defensive checks on stored password
    const stored = pastor.password;
    if (!stored || typeof stored !== 'string') {
      console.error('❌ Pastor password field is missing or invalid for:', normalizedEmail);
      return res.status(500).json({ success, error: 'Password storage error' });
    }

    const trimmedStored = stored.trim();
    const trimmedInput = (typeof password === 'string' ? password.trim() : '');

    console.log('🔄 Comparing passwords...');
    console.log('📝 Input password length:', trimmedInput.length);
    console.log('📝 Stored hash length:', trimmedStored.length);
    console.log('🔎 Stored hash prefix (first 4 chars):', trimmedStored.substring(0, 4));

    // If stored password appears to be plain text (not bcrypt hash) and AUTO_UPGRADE_LEGACY_PW true,
    // allow single-time migration by checking equality, hashing stored plaintext and saving.
    const looksLikeBcrypt = trimmedStored.startsWith('$2');
    if (!looksLikeBcrypt) {
      console.warn('⚠️ Stored password does not look like bcrypt hash for:', normalizedEmail);
      if (AUTO_UPGRADE_LEGACY_PW) {
        // Compare directly (legacy plaintext)
        if (trimmedStored === trimmedInput) {
          console.log('🔁 Legacy plaintext match detected - upgrading to bcrypt hash for:', normalizedEmail);
          const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
          const newHashed = await bcrypt.hash(trimmedInput, salt);
          pastor.password = newHashed;
          await pastor.save();
          // proceed as if match succeeded
        } else {
          console.log('❌ Legacy plaintext mismatch for:', normalizedEmail);
          return res.status(400).json({ success, error: 'Invalid credentials' });
        }
      } else {
        console.log('❌ Stored password not bcrypt and AUTO_UPGRADE_LEGACY_PW disabled');
        return res.status(500).json({ success, error: 'Password stored in unexpected format. Please reset your password.' });
      }
    }

    // If we reached here and stored is bcrypt format, run bcrypt.compare
    const passwordCompare = await bcrypt.compare(trimmedInput, pastor.password);
    console.log('✅ Password comparison result:', passwordCompare);

    if (!passwordCompare) {
      console.log('❌ Password mismatch for email:', normalizedEmail);

      // Additional debug: test hashing the provided password with new salt - this only checks bcrypt correctness
      try {
        const testHash = await bcrypt.hash(trimmedInput, BCRYPT_SALT_ROUNDS);
        const testCompare = await bcrypt.compare(trimmedInput, testHash);
        console.log('🧪 Self-test bcrypt (hash->compare) result:', testCompare);
      } catch (e) {
        console.error('🧪 Bcrypt self-test failed:', e && e.message ? e.message : e);
      }

      // Don't leak whether email exists
      return res.status(400).json({ success, error: 'Invalid credentials' });
    }

    // Update last login and save
    pastor.lastLogin = new Date();
    await pastor.save();

    // Prepare JWT
    const data = {
      pastor: {
        id: pastor.id,
        email: pastor.email,
        adminLevel: pastor.adminLevel,
        userType: 'pastor'
      }
    };
    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '24h' });
    success = true;

    console.log('🎉 Login successful for:', normalizedEmail);

    res.status(200).json({
      success,
      authtoken,
      pastor: {
        id: pastor.id,
        name: pastor.name,
        email: pastor.email,
        title: pastor.title,
        adminLevel: pastor.adminLevel,
        permissions: pastor.permissions
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error && error.message ? error.message : error);
    res.status(500).json({ success: false, error: 'Internal server error occurred' });
  }
};

// --- Get profile ---
const getProfile = async (req, res) => {
  try {
    const pastorId = req.pastor && req.pastor.id;
    if (!pastorId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const pastor = await Pastor.findById(pastorId).select('-password');
    if (!pastor) return res.status(404).json({ success: false, error: 'Pastor not found' });

    res.status(200).json({ success: true, pastor });
  } catch (error) {
    console.error('❌ Get profile error:', error && error.message ? error.message : error);
    res.status(500).json({ success: false, error: 'Internal server error occurred' });
  }
};

// --- Update profile ---
const updateProfile = async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success, errors: errors.array() });

  try {
    const { name, bio, title } = req.body || {};
    const pastorId = req.pastor && req.pastor.id;
    if (!pastorId) return res.status(401).json({ success, error: 'Unauthorized' });

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = (typeof bio === 'string' ? bio.trim() : bio);
    if (title) updateData.title = title;

    const pastor = await Pastor.findByIdAndUpdate(pastorId, updateData, { new: true, runValidators: true }).select('-password');
    if (!pastor) return res.status(404).json({ success, error: 'Pastor not found' });

    success = true;
    res.status(200).json({ success, pastor });
  } catch (error) {
    console.error('❌ Update profile error:', error && error.message ? error.message : error);
    res.status(500).json({ success: false, error: 'Internal server error occurred' });
  }
};

// --- Change password ---
const changePassword = async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success, errors: errors.array() });

  try {
    const { currentPassword, newPassword } = req.body || {};
    const pastorId = req.pastor && req.pastor.id;
    if (!pastorId) return res.status(401).json({ success, error: 'Unauthorized' });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success, error: 'Current password and new password are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success, error: 'New password must be at least 6 characters long' });
    }

    const pastor = await Pastor.findById(pastorId).select('+password');
    if (!pastor) return res.status(404).json({ success, error: 'Pastor not found' });

    const valid = await bcrypt.compare(currentPassword, pastor.password);
    if (!valid) return res.status(400).json({ success, error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    pastor.password = hashedNewPassword;
    await pastor.save();

    success = true;
    console.log('✅ Password changed successfully for:', pastor.email);
    res.status(200).json({ success, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error && error.message ? error.message : error);
    res.status(500).json({ success: false, error: 'Internal server error occurred' });
  }
};

// --- Logout ---
const logout = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error && error.message ? error.message : error);
    res.status(500).json({ success: false, error: 'Internal server error occurred' });
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
