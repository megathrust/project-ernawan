import express from 'express';
import dotenv from 'dotenv';
import expressEjsLayouts from 'express-ejs-layouts';
import flash from 'connect-flash';
import session from 'express-session';

import HomeRoutes from './routes/homeRoutes.js';
import AuthRoutes from './routes/authRoutes.js';
import Database from './config/config.database.js';
import { UserModel } from './models/userModels.js';
import { AuthService } from './services/AuthServices.js';
import FlashMiddleware from './services/FlashServices.js';
import SessionConfig from './services/SessionServices.js';
import passport from 'passport';
import PassportService from './services/PassportServices.js';
import { PackageModel } from './models/packageModels.js';
import AdminRoutes from './routes/adminRoutes.js';

dotenv.config();

class App {
  constructor() {
    this.app = express();
    this.database = new Database();
    this.userModel = new UserModel(this.database.getPool());
    this.authService = new AuthService(this.userModel);
    this.passportService = new PassportService(this.userModel);
    this.packageModel = new PackageModel(this.database.getPool());
    
    this.initalizeMiddlewares();
    this.initalizeRoutes();
    this.initializeDatabase();
  }

  initalizeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(session(SessionConfig.getConfig())); // Harus sebelum flash
    this.app.use(flash());
    this.app.use(FlashMiddleware.handle);
    
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(this.passportService.initialize());
    this.app.use(this.passportService.sessionMiddleware());

    this.app.use(express.static('public'));
    this.app.use(expressEjsLayouts);
    this.app.set('view engine', 'ejs');
    this.app.use(this.authService.checkIsAdmin);
  }

  initalizeRoutes() {
    this.app.use('/', HomeRoutes); 
    this.app.use('/auth', AuthRoutes(this.userModel, this.authService));
    this.app.use('/admin', AdminRoutes(this.userModel, this.packageModel));
    this.app.use((req, res) => {
      res.status(404).send('Not Found');
    });
  }

  async initializeDatabase() {
    try {
      await this.database.connect();
      await this.database.initializeDatabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      process.exit(1);
    }
  }

  start() {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

try {
  const app = new App();
  app.start();
} catch (error) {
  console.error(error);
}