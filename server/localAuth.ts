import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import MemoryStore from 'memorystore';

const MemStore = MemoryStore(session);

export function setupAuth(app: Express) {
  const store = new MemStore({ checkPeriod: 86400000 });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret',
      resave: false,
      saveUninitialized: false,
      store,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user || null);
  });

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) return done(null, false, { message: 'Invalid credentials' });
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    })
  );

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true });
  });

  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        id: nanoid(),
        email,
        passwordHash,
        firstName,
        lastName,
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ success: true });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};
