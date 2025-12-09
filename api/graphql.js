import { graphqlHTTP } from 'express-graphql';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import graphqlSchema from '../graphql/schema.js';
import graphqlResolver from '../graphql/resolvers.js';
import auth from '../middleware/auth.js';

dotenv.config();

if (!mongoose.connections[0].readyState) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));
}

 
export default async function handler(req, res) {
  
  await auth(req, res, () => {});

  
  return graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,  
    context: { isAuth: req.isAuth, userId: req.userId },
    customFormatErrorFn: (err) => ({
      message: err.message || 'An error occurred.',
      status: err.originalError?.code || 500,
      data: err.originalError?.data || null,
    }),
  })(req, res);
}
