const express = require("express");
const jsonwebtoken = require("jsonwebtoken");
const db = require("./db");
const bcrypt = require("bcrypt");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Invalid request" });
    }

    try {
        const user = await db.User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jsonwebtoken.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // Token expires in 1 hour
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Invalid request" });
    }

    if (password.length < 8 || password.length > 32) {
        return res
            .status(400)
            .json({ message: "Password must be 8-32 characters long" });
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res
            .status(400)
            .json({ message: "Username must contain only letters and numbers" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
    }

    if (username.length < 4 || username.length > 32) {
        return res.status(400).json({
            message: "Username must be between 4 and 32 characters long",
        });
    }

    try {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        await db.User.create({ username, email, password: hash, salt });
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        if(error.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json({ message: "User already exists" });
        }
        res.status(400).json({ message: error.message });
    }
});

app.get("/groups", async (req, res) => {
    const groups = await db.Group.findAll();
    res.json(groups.map((group) => group.name));
});

// Auth Middleware
app.use((req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token is required" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
});

app.get("/protected", (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});

app.post("/groups", async (req, res) => {
    const { name, budget } = req.body;

    if (!name || !budget) {
        return res.status(400).json({ message: "Invalid request" });
    }

    const user = await db.User.findByPk(req.user.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if(name.length < 4 || name.length > 32) {
        return res.status(400).json({ message: "Name must be between 4 and 32 characters long" });
    }

    if(budget < 0) {
        return res.status(400).json({ message: "Budget must be a positive number" });
    }

    const userGroups = await user.getGroups();
    if(userGroups.length >= 5) {
        return res.status(400).json({ message: "You have reached the limit of groups" });
    }

    try {
        await db.Group.create({ name, budget, ownerId: req.user.id });
        const group = await db.Group.findOne({ where: { name } });
        await user.addGroup(group);
        res.status(201).json({ message: "Group created successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});



    




app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
