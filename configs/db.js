import mongoose from 'mongoose';
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database');
    console.log("DATABASE:", mongoose.connection.name);
    console.log("HOST:", mongoose.connection.host);
  } catch (error) {
    console.log(error);
  }
};
export default connectDB;
