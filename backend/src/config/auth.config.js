// Authentication Configuration
// AUTH_MODE: 'DEV' - Uses localStorage simulation, 'PROD' - Full JWT authentication

module.exports = {
  // Auth mode determines authentication behavior
  // DEV: Relaxed auth for development, frontend can use localStorage
  // PROD: Full JWT authentication required
  authMode: process.env.AUTH_MODE || 'PROD',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'artdrive-dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: 'HS256'
  },
  
  // Password requirements
  password: {
    minLength: 6,
    requireUppercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  },
  
  // User roles
  roles: {
    PHOTOGRAPHER: 'photographer',
    EMPLOYER: 'employer',
    ADMIN: 'admin',
    JUDGE: 'judge'
  },
  
  // Role permissions
  permissions: {
    photographer: [
      'view_tournaments',
      'join_tournament',
      'upload_photos',
      'vote',
      'view_jobs',
      'apply_jobs',
      'message'
    ],
    employer: [
      'view_tournaments',
      'vote',
      'post_jobs',
      'view_applicants',
      'message',
      'hire_photographer'
    ],
    judge: [
      'view_tournaments',
      'vote',
      'judge_tournament'
    ],
    admin: [
      'all' // Full access
    ]
  }
};

