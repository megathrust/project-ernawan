import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

class PassportService {
  constructor(userModel) {
    this.userModel = userModel;
  }

  initialize() {
    this.configureLocalStrategy();
    this.configureSerialization();
    return passport.initialize(); // Mengembalikan middleware Passport
  }

  configureLocalStrategy() {
    passport.use(
      new LocalStrategy(async (username, password, done) => {
        try {
          const user = await this.userModel.findUserByUsername(username);
          if (!user) {
            return done(null, false, { message: 'User not found' });
          }

          const isValidPassword = await this.userModel.validatePassword(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Incorrect password' });
          }

          return done(null, user); // Jika berhasil login
        } catch (error) {
          return done(error);
        }
      })
    );
  }

  configureSerialization() {
    passport.serializeUser((user, done) => {
      done(null, user.id); // Menyimpan user ID ke session
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.userModel.findUserById(id);
        done(null, user); // Mengembalikan user berdasarkan ID
      } catch (error) {
        done(error);
      }
    });
  }

  sessionMiddleware() {
    return passport.session(); // Middleware untuk session Passport
  }
}

export default PassportService;