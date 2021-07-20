const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

// token we will send to the browser
User.byToken = async (token) => {
  try { // Verify function checks if the given token is valid - seeing if it matches the user's token
    const response = jwt.verify(token, process.env.JWT);
    // response = { userId: ... }
    const user = await User.findByPk(response.userId);
    if(user){
      // if the tokens match, send back user info
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

// getting user form db,
// if there is a user, send the token
User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username
    },
  });
  if (user) { // sign takes the data and secret, and returns a token
    // sign accepts data(payload), and a secret as arguments
    // the data in this case, if the user's id
    // process.env.JWT is our secret
    const isThereAMatch = await bcrypt.compare(password, user.password);
    if (isThereAMatch) {
    const token = await jwt.sign({userId: user.id}, process.env.JWT)
    // returning a token assigned to the user, info protection
    return token;
  }
}
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

// if the user changes the password then encrypt 
// reassign the user. Password to the hashed password
//re-assigning the user.password variable to a hashed version of what was inputted
User.addHook('beforeCreate', async(user)=> {
  if(user.changed('password')){
    const userInputtedPassword = user.password
    user.password = await bcrypt.hash(userInputtedPassword, 3);
  }
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
}
