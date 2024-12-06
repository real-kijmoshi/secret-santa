const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const uri = process.env.Postgres_URI;

if (!uri) {
    console.error("Postgres_URI is not defined in the environment variables.");
    process.exit(1);
}

// Initialize Sequelize instance
const sequelize = new Sequelize(uri, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false, // Adjust based on SSL setup
        },
    },
});

// Define User model
const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    salt: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Define Group model
const Group = sequelize.define("Group", {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    budget: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
});

// Associations
Group.belongsTo(User, { as: "owner" }); // A group has one owner (User)
User.hasMany(Group, { foreignKey: "ownerId" }); // A user can own multiple groups

Group.belongsToMany(User, { through: "GroupUsers" }); // Many-to-many relationship
User.belongsToMany(Group, { through: "GroupUsers" }); // Many-to-many relationship

// Authenticate and sync models
sequelize
    .authenticate()
    .then(() => {
        console.log("Connected to Postgres");
        return sequelize.sync({ alter: true }); // Sync models to the database
    })
    .then(() => {
        console.log("Database synced");
    })
    .catch((error) => {
        console.error("Error connecting to Postgres:", error.message);
        console.error("Details:", error);
    });

module.exports = { User, Group, sequelize };
