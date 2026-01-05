import express from "express";
import { connection, collectionName } from "./dbconfig.js";
import cors from "cors";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.post("/login", async (req, res) => {
  const userData = req.body;
  if (userData.email && userData.password) {
    const db = await connection();
    const collection = await db.collection("users");
    const result = await collection.findOne({
      email: userData.email,
      password: userData.password,
    });
    if (result) {
      const userName = result.name;
      jwt.sign(userData, "Google", { expiresIn: "5d" }, (error, token) => {
        res.send({
          success: true,
          message: "login successful",
          username: userName,
          token,
        });
      });
    } else {
      res.send({
        success: false,
        message: "user not found",
      });
    }
  } else {
    res.send({
      success: false,
      message: "login failed",
    });
  }
});

app.post("/signup", async (req, res) => {
  const userData = req.body;
  if (userData.email && userData.password) {
    const db = await connection();
    const collection = await db.collection("users");

    const existingUser = await collection.findOne({ email: userData.email , password: userData.password });
    if (existingUser) {
      return res.status(409).send({

        success: false,
        message: "User already exists with this email. Please log in.",
        existinguser: existingUser,
      });
    }
    else{
        console.log("No existing user found, proceeding with signup.");
    }

    const result = await collection.insertOne(userData);
    if (result) {
      jwt.sign(userData, "Google", { expiresIn: "5d" }, (error, token) => {
        res.send({
          success: true,
          message: "signup successful",
          token,
        });
      });
    } else {
      res.send({
        success: false,
        message: "signup failed",
      });
    }
  }
});

app.post("/add-task", verifyJWT, async (req, res) => {
  try {
    const DB = await connection();
    const collection = await DB.collection(collectionName);
    const result = await collection.insertOne(req.body);

    if (result.acknowledged) {
      res.status(201).send({
        message: "Task added successfully",
        success: true,
        insertedId: result.insertedId,
      });
    } else {
      res.status(500).send({ message: "Failed to add task", success: false });
    }
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).send({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
});

app.get("/tasks", verifyJWT, async (req, res) => {
  const DB = await connection();
  const collection = await DB.collection(collectionName);

  try {
    const tasks = await collection.find().toArray();

    res.send({
      message: "Task List Fetched",
      success: true,
      result: tasks,
    });
  } catch (error) {
    console.error("Database fetch error:", error);
    res.status(500).send({
      message: "Error Occurred while fetching tasks",
      success: false,
      error: error.message,
    });
  }
});


app.get("/update/:id", verifyJWT, async (req, res) => {
  const db = await connection();
  const id = req.params.id;
  const collection = await db.collection(collectionName);
  const result = await collection.findOne({ _id: new ObjectId(id) });
  if (result) {
    res.send({ message: "Task updated successfully", success: true, result });
  } else {
    res.send({ message: "Failed to update task", success: false });
  }
});

app.put("/update-task", verifyJWT, async (req, res) => {
  const db = await connection();
  const collection = await db.collection(collectionName);
  const { _id, ...fields } = req.body;
  const update = { $set: fields };
  const result = await collection.updateOne({ _id: new ObjectId(_id) }, update);
  if (result) {
    res.send({ message: "task data updated", success: true, result });
  } else {
    res.send({ message: "error try after sometime", success: false });
  }
});

app.delete("/delete/:id", verifyJWT, async (req, res) => {
  const db = await connection();
  const id = req.params.id;
  const collection = await db.collection(collectionName);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result) {
    res.send({ message: "Task deleted successfully", success: true, result });
  } else {
    res.send({ message: "Failed to delete task", success: false });
  }
});

app.delete("/delete-multiple", verifyJWT, async (req, res) => {
  const db = await connection();
  const Ids = req.body;
  const deleteTasksIds = Ids.map((item) => new ObjectId(item));

  console.log(Ids);

  const collection = await db.collection(collectionName);
  const result = await collection.deleteMany({ _id: { $in: deleteTasksIds } });
  if (result) {
    res.send({ message: "Task deleted successfully", success: true, result });
  }
});

function verifyJWT(req, res, next) {
  console.log("verifyJWT", req.cookies["token"]);
  const token = req.cookies["token"];
  jwt.verify(token, "Google", (error, decoded) => {
    if (error) {
      return res.send({
        message: "Invalid Token",
        success: false,
      });
    }
    next();
    console.log(decoded);
  });
}

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
