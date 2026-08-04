const firebaseAdmin = require('../firebaseAdmin');

const fetchFirebaseUser = async (req, res, next) => {
  const authHeader = req.header('authorization') || req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Please authenticate using a valid token' });
  }

  try {
    const auth = firebaseAdmin.getAuth();
    if (!auth) {
      return res.status(500).json({ error: 'Firebase Admin not configured on server' });
    }
    const decoded = await auth.verifyIdToken(token);
    req.firebaseUser = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Please authenticate using a valid token' });
  }
};

module.exports = fetchFirebaseUser;
