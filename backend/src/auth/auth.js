import jwt from "jsonwebtoken";
import { errorResponse } from "../response/response.js";

export const auth = (req, res, next) => {
  const token = req.headers["authorization"]?.split("Bearer ")[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return errorResponse(res, 401, "Unauthorized", {});
        // FIX: removed res.redirect() after errorResponse - headers already sent
      }
      req.user = decoded;
      next();
    });
  } else {
    return errorResponse(res, 401, "Unauthorized", {});
    // FIX: removed res.redirect() - can't redirect an API call after sending JSON
  }
};
