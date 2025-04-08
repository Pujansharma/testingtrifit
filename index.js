require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Debug environment variables
console.log('Environment Variables:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'exists' : 'missing',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'exists' : 'missing',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'exists' : 'missing'
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, done) => {
    console.log('Google Profile:', profile);
    return done(null, profile);
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log('Deserializing user:', user.id);
  done(null, user);
});

// Routes
app.get('/', (req, res) => {
  res.send('<h1>Home</h1><a href="/auth/google">Login with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Forces account selection
  })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/',
    failureMessage: true
  }),
  (req, res) => {
    console.log('Authentication successful');
    res.redirect('/profile');
  }
);

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    console.log('Not authenticated, redirecting');
    return res.redirect('/');
  }
  
  console.log('User profile:', req.user);
  res.send(`
    <h1>Profile</h1>
    <p>Welcome, ${req.user.displayName}!</p>
    <p>Email: ${req.user.emails?.[0]?.value || 'No email'}</p>
    ${req.user.photos?.[0]?.value ? `<img src="${req.user.photos[0].value}" alt="Profile" width="100">` : ''}
    <a href="/logout">Logout</a>
  `);
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { 
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    console.log('User logged out');
    res.redirect('/');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Something broke!');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});