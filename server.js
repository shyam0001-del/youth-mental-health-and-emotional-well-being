const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/MindMitra")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    social: [String],
    certificate: String,
    specialization: String,
    status: {
        type: String,
        default: "pending"
    }
});

const User = mongoose.model("users", UserSchema);

// Register with file upload
app.post("/register", upload.single("certificate"), async (req, res) => {
    try {
        let data = req.body;

        if(req.file){
            data.certificate = req.file.filename;
        }

        if(typeof data.social === "string"){
            data.social = JSON.parse(data.social);
        }

        const user = new User(data);

        if(user.role === "user"){
            user.status = "approved";
        }

        await user.save();
        res.send("Registered Successfully");

    } catch (err) {
        console.log(err);
        res.send("Error Registering User");
    }
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if(!user){
        res.send("Invalid Email or Password");
        return;
    }

    if((user.role === "ngo" || user.role === "specialist") && user.status !== "approved"){
        res.send("Waiting for Admin Approval");
        return;
    }

    res.send(user.role);
});

// Pending users for admin
app.get("/pending", async (req, res) => {
    const users = await User.find({
        role: { $in: ["ngo", "specialist"] },
        status: "pending"
    });

    res.json(users);
});

// Approve
app.post("/approve", async (req, res) => {
    const { id } = req.body;

    await User.findByIdAndUpdate(id, {
        status: "approved"
    });

    res.send("Approved");
});

// Reject
app.post("/reject", async (req, res) => {
    const { id } = req.body;

    await User.findByIdAndDelete(id);
    res.send("Rejected");
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});