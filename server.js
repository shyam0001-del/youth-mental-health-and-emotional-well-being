const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/MindMitra")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Multer Memory Storage (Store files in MongoDB)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    social: [String],
    certificate: [{
        data: Buffer,
        contentType: String
    }],
    specialization: String,
    status: {
        type: String,
        default: "pending"
    }
});

const User = mongoose.model("users", UserSchema);

// Register
app.post("/register", upload.array("certificate"), async (req, res) => {
    try {
        let data = req.body;

        if(req.files && req.files.length > 0){
            data.certificate = req.files.map(f => ({
                data: f.buffer,
                contentType: f.mimetype
            }));
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

// Login (UNCHANGED)
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

// Pending users
app.get("/pending", async (req, res) => {
    const users = await User.find({
        role: { $in: ["ngo", "specialist"] },
        status: "pending"
    });

    res.json(users);
});

// Serve Certificate
app.get("/certificate/:id/:index", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const index = parseInt(req.params.index);

        if(user && user.certificate && user.certificate[index]){
            res.set('Content-Type', user.certificate[index].contentType);
            res.send(user.certificate[index].data);
        } else {
            res.status(404).send('Certificate not found');
        }
    } catch (err) {
        res.status(500).send('Error');
    }
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

// View certificate from MongoDB
app.get("/certificate/:id/:index", async (req, res) => {
    const user = await User.findById(req.params.id);
    const cert = user.certificate[req.params.index];

    res.contentType(cert.contentType);
    res.send(cert.data);
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});