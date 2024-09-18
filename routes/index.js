import userRoutes from './user/userRoutes.js';
import passwordRoutes from './password/passwordRoutes.js';
import noteRoutes from './note/noteRoutes.js'
import authRoutes from './auth/authRoutes.js'
import paymentRoutes from './payment/paymentRoutes.js'

const connectRouter = (server) => {
  server.use('/auth', authRoutes);
  server.use('/users', userRoutes);
  server.use('/passwords', passwordRoutes);
  server.use('/notes', noteRoutes);
  server.use('/payment', paymentRoutes);

  return server;
};

export { connectRouter };