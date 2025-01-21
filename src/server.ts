import 'dotenv/config'; 
import app from './app';
import db from './config/db';

const PORT = process.env.PORT || 3001;

// Initialize DB, then start the server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB init error:', err);
});
