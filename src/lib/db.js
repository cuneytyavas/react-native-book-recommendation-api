import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const res = await mongoose.connect(process.env.MONGO_URI);
    console.log(`DB connected ${res.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
