import app from "./app.js";
import { connect } from "./config/db.js";
import * as dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 5000;

connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});