import app from './src/app.js';
import { initializeDatabase } from './src/database/db.js';
import { config } from './src/config/env.js';

async function startServer() {
  try {
    // 1. Initialize DB (Connect, verify tables exist/create them, and insert default roles and admin seed)
    await initializeDatabase();

    // 2. Start Listening
    const PORT = config.server.port || 5000;
    app.listen(PORT, () => {
      console.log('✔ Server Ready');
      console.log(`Server is running in ${config.server.env} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
