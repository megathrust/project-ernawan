import session from "express-session";
import memorystore from "memorystore";

class SessionConfig {
    static getConfig() {
        const MemoryStoreInstance = memorystore(session);

        return {
            secret: process.env.SECRET_APP,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 86400000,
                secure: process.env.SECURE_APP === 'true',  // Pastikan ini berupa boolean
                httpOnly: false,  // Tambahan keamanan
            },            
            store: new MemoryStoreInstance({
                checkPeriod: 86400000,
            }),
        }
    }
}

export default SessionConfig;
