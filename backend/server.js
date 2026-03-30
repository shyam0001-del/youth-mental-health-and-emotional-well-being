const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { Mistral } = require("@mistralai/mistralai");

dotenv.config();

const app = express();
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/MindMitra";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, JPEG, PNG files are allowed"));
    }
  },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "ngo", "specialist", "admin"],
      required: true,
    },
    social: { type: [String], default: [] },
    certificate: [
      {
        data: Buffer,
        contentType: String,
      },
    ],
    specialization: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const ChatMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const MoodSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mood: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
const MoodSnapshot = mongoose.model("MoodSnapshot", MoodSnapshotSchema);

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
}

function analyzeMoodFromMessages(messages) {
  const text = messages.map((m) => m.text.toLowerCase()).join(" ");

  let mood = "neutral";
  let summary = "User appears generally stable based on recent conversation.";

  const stressWords = ["stress", "stressed", "pressure", "overwhelmed", "burden"];
  const anxietyWords = ["anxious", "anxiety", "panic", "worried", "fear", "nervous"];
  const sadnessWords = ["sad", "lonely", "empty", "cry", "hopeless", "down"];
  const positiveWords = ["happy", "good", "better", "calm", "relaxed", "hopeful"];

  const countHits = (words) => words.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);

  const stressScore = countHits(stressWords);
  const anxietyScore = countHits(anxietyWords);
  const sadnessScore = countHits(sadnessWords);
  const positiveScore = countHits(positiveWords);

  if (sadnessScore >= stressScore && sadnessScore >= anxietyScore && sadnessScore > positiveScore) {
    mood = "low";
    summary = "Recent chat suggests sadness, loneliness, or emotional heaviness.";
  } else if (anxietyScore >= stressScore && anxietyScore > positiveScore) {
    mood = "anxious";
    summary = "Recent chat suggests worry, nervousness, or anxiety-related distress.";
  } else if (stressScore > positiveScore) {
    mood = "stressed";
    summary = "Recent chat suggests stress, overload, or pressure.";
  } else if (positiveScore > 0) {
    mood = "improving";
    summary = "Recent chat suggests calmness, hope, or emotional improvement.";
  }

  return { mood, summary };
}

function getFallbackReply(message, moodResult) {
  const text = message.toLowerCase();

  if (text.includes("sad") || text.includes("lonely") || moodResult.mood === "low") {
    return "I'm sorry you're feeling this way. You do not have to handle it alone. Try taking one small step right now: drink some water, sit comfortably, and tell me what is making today feel hardest.";
  }

  if (text.includes("anxious") || text.includes("panic") || text.includes("worried") || moodResult.mood === "anxious") {
    return "It sounds like your mind is under pressure. Try this: inhale for 4 seconds, hold for 4, exhale for 6. Do that three times. Then tell me the main thing worrying you most right now.";
  }

  if (text.includes("stress") || text.includes("overwhelmed") || moodResult.mood === "stressed") {
    return "You sound overwhelmed. Let’s shrink the problem. What are the top 3 things bothering you right now? Start with the smallest one.";
  }

  if (text.includes("happy") || text.includes("better") || moodResult.mood === "improving") {
    return "I'm glad you're feeling a bit better. Hold onto that. What helped you feel this way today? We can use that as part of your support pattern.";
  }

  return "I'm here with you. Tell me a little more about what happened today and how it affected you.";
}

app.post("/register", (req, res) => {
  upload.array("certificate")(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File size must be less than 2MB" });
        }
        return res.status(400).json({ message: err.message });
      }

      if (err) {
        return res.status(400).json({ message: err.message });
      }

      let data = { ...req.body };

      if (!data.name || !data.email || !data.password || !data.role) {
        return res.status(400).json({ message: "Name, email, password and role are required" });
      }

      const allowedPublicRoles = ["user", "ngo", "specialist"];
      if (!allowedPublicRoles.includes(data.role)) {
        return res.status(400).json({ message: "Invalid role selected" });
      }

      data.email = data.email.toLowerCase().trim();

      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      if (req.files && req.files.length > 0) {
        data.certificate = req.files.map((file) => ({
          data: file.buffer,
          contentType: file.mimetype,
        }));
      }

      if (typeof data.social === "string") {
        try {
          data.social = JSON.parse(data.social);
        } catch {
          data.social = [data.social];
        }
      }

      if (!Array.isArray(data.social)) {
        data.social = [];
      }

      if (data.social.length > 5) {
        return res.status(400).json({ message: "Maximum 5 social links allowed" });
      }

      if (data.role === "specialist" && !data.specialization) {
        return res
          .status(400)
          .json({ message: "Specialization is required for specialist registration" });
      }

      data.password = await bcrypt.hash(data.password, 10);

      const user = new User(data);
      user.status = user.role === "user" ? "approved" : "pending";

      await user.save();

      return res.status(201).json({ message: "Registered Successfully" });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Error Registering User" });
    }
  });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    if (
      (user.role === "ngo" || user.role === "specialist") &&
      user.status !== "approved"
    ) {
      return res.status(403).json({ message: "Waiting for Admin Approval" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user._id,
      name: user.name,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

app.post("/chat", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const userId = req.user.userId;

    await ChatMessage.create({
      userId,
      sender: "user",
      text: message.trim(),
    });

    const recentMessages = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(12);

    const orderedMessages = [...recentMessages].reverse();

    const historyText = orderedMessages
      .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    let aiReply = "";

    try {
      const prompt = `
You are a supportive mental wellbeing assistant for students.
Be warm, short, practical, and safe.
Do not diagnose.
Encourage professional help if needed.

Conversation so far:
${historyText}

User message:
${message.trim()}
`;

      const response = await client.chat.complete({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
      });

      aiReply =
        response.choices?.[0]?.message?.content ||
        "I'm here for you. Tell me more about how you're feeling.";
    } catch (apiError) {
      console.error("Mistral API error, using fallback reply:", apiError.message);
      const moodPreview = analyzeMoodFromMessages(orderedMessages);
      aiReply = getFallbackReply(message.trim(), moodPreview);
    }

    await ChatMessage.create({
      userId,
      sender: "ai",
      text: aiReply,
    });

    const updatedMessages = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const moodResult = analyzeMoodFromMessages([...updatedMessages].reverse());

    await MoodSnapshot.create({
      userId,
      mood: moodResult.mood,
      summary: moodResult.summary,
    });

    return res.json({
      reply: aiReply,
      mood: moodResult,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ message: "Chat failed" });
  }
});

app.get("/chat-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await ChatMessage.find({ userId }).sort({ createdAt: 1 }).limit(100);
    const latestMood = await MoodSnapshot.findOne({ userId }).sort({ createdAt: -1 });

    return res.json({
      messages,
      latestMood,
    });
  } catch (error) {
    console.error("History error:", error);
    return res.status(500).json({ message: "Failed to load chat history" });
  }
});

app.get("/pending", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find(
      {
        role: { $in: ["ngo", "specialist"] },
        status: "pending",
      },
      {
        password: 0,
      }
    );

    return res.json(users);
  } catch (err) {
    console.error("Pending users error:", err);
    return res.status(500).json({ message: "Failed to fetch pending users" });
  }
});

app.get("/certificate/:id/:index", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id, index } = req.params;
    const fileIndex = Number(index);

    if (Number.isNaN(fileIndex)) {
      return res.status(400).json({ message: "Invalid certificate index" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.certificate || !user.certificate[fileIndex]) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    res.set("Content-Type", user.certificate[fileIndex].contentType);
    return res.send(user.certificate[fileIndex].data);
  } catch (err) {
    console.error("Certificate error:", err);
    return res.status(500).json({ message: "Error fetching certificate" });
  }
});

app.post("/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Approved" });
  } catch (err) {
    console.error("Approve error:", err);
    return res.status(500).json({ message: "Approval failed" });
  }
});

app.post("/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.body;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Rejected" });
  } catch (err) {
    console.error("Reject error:", err);
    return res.status(500).json({ message: "Rejection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});