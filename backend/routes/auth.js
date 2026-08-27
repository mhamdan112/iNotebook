const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const secret = "hamdanisasecretkey";
var fetchuser = require('../middleware/fetchuser');
const fetchFirebaseUser = require('../middleware/fetchFirebaseUser');

//Route 1: Create a user using post"/api/auth/createUser" endpoint. No login required
router.post('/createUser', [
   body('email', 'Enter a valid email').isEmail(),
   body('name', 'Name must be at least 3 characters long').isLength({ min: 3 }),
   body('password', 'Password must be at least 5 characters long').isLength({ min: 5 })

], async (req, res) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   const existingUser = await User.findOne({ email: req.body.email });
   if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
   }
   //adding salt and hashing the password
   const salt = await bcrypt.genSalt(10);
   const secPass = await bcrypt.hash(req.body.password, salt);
   //creating a new user
   User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass
   }).then(user => {
      //creating jwt token for the user
      const data = {
         user: {
            id: user.id
         }
      }
      const authToken = jwt.sign(data, secret);
      console.log(authToken);
      res.json({ authToken, success: true });
      console.log('User added:', user);
   })
});


//Route 2: Authenticate a user using post"/api/auth/login" endpoint. No login required
router.post('/login', [
   body('email', 'Enter a valid email').isEmail(),
   body('password', 'Password cannot be blank').exists()

], async (req, res) => {
   //checking for errors in the request body
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   //destructuring email and password from the request body
   const { email, password } = req.body;
   try {
      let user = await User.findOne({ email });
      if (!user) {
         return res.status(400).json({ error: "Please try to login with correct credentials" });
      }
      const comparePassword = await bcrypt.compare(password, user.password);
      if (!comparePassword) {
         return res.status(400).json({ error: "Please try to login with correct credentials" });
      }
      const data = {
         user: {
            id: user.id
         }
      }
      const authToken = jwt.sign(data, secret);
      res.json({ authToken, success: true });
      console.log({ authToken });

   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");

   }

})
//Router to get user details on post"/api/auth/getuser" endpoint login required
router.post('/getuser', fetchuser, async (req, res) => {
   try {
      userid = req.user.id;
      const user = await User.findById(userid).select("-password");
      res.send(user);

   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");

   }
})

//Route: Authenticate or create user from Firebase token on post"/api/auth/firebase-login" endpoint. No login required
router.post('/firebase-login', fetchFirebaseUser, async (req, res) => {
   try {
      const { uid, email, name } = req.firebaseUser || {};

      if (!email) {
         return res.status(400).json({ success: false, error: 'Email is required for login' });
      }

      let user = await User.findOne({ email });

      if (!user) {
         const placeholderPassword = await bcrypt.hash(Math.random().toString(36).slice(-12), 10);
         user = await User.create({
            name: name || email.split('@')[0],
            email,
            password: placeholderPassword
         });
      }

      const data = { user: { id: user.id } };
      const authToken = jwt.sign(data, secret);
      res.json({ authToken, success: true });
   } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
   }
});
module.exports = router