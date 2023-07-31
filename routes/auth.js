const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const USER = mongoose.model("USER");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const { Jwt_secret } = require("../keys");
const requireLogin = require("../middlewares/requireLogin");



router.post("/signup", async (req, res) => {
    const { name, userName, email, password } = req.body;
  
    try {
      if (!name || !email || !userName || !password) {
        return res.status(422).json({ error: "Please add all the fields" });
      }
  
      const existingUser = await USER.findOne({ $or: [{ email: email }, { userName: userName }] });
      if (existingUser) {
        return res.status(422).json({ error: "User already exists with that email or userName" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 12);
  
      const newUser = new USER({
        name,
        email,
        userName,
        password: hashedPassword
      });
  
      await newUser.save();
  
      res.json({ message: "Registered successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "An error occurred during signup" });
    }
  });

router.post("/signin", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ error: "Please add email and password" })
    }
    USER.findOne({ email: email }).then((savedUser) => {
        if (!savedUser) {
            return res.status(422).json({ error: "Invalid email" })
        }
        bcrypt.compare(password, savedUser.password).then((match) => {
            if (match) {
                // return res.status(200).json({ message: "Signed in Successfully" })
                const token = jwt.sign({ _id: savedUser.id }, Jwt_secret)
                const { _id, name, email, userName } = savedUser

                res.json({ token, user: { _id, name, email, userName } })

                console.log({ token, user: { _id, name, email, userName } })
            } else {
                return res.status(422).json({ error: "Invalid password" })
            }
        })
            .catch(err => console.log(err))
    })
})

router.post("/googleLogin", (req, res) => {
    const { email_verified, email, name, clientId, userName, Photo } = req.body
    if (email_verified) {
        USER.findOne({ email: email }).then((savedUser) => {
            if (savedUser) {
                const token = jwt.sign({ _id: savedUser.id }, Jwt_secret)
                const { _id, name, email, userName } = savedUser
                res.json({ token, user: { _id, name, email, userName } })
                console.log({ token, user: { _id, name, email, userName } })
            } else {
                const password = email + clientId
                const user = new USER({
                    name,
                    email,
                    userName,
                    password: password,
                    Photo
                })

                user.save()
                    .then(user => {
                        let userId = user._id.toString()
                        const token = jwt.sign({ _id: userId }, Jwt_secret)
                        const { _id, name, email, userName } = user

                        res.json({ token, user: { _id, name, email, userName } })

                        console.log({ token, user: { _id, name, email, userName } })
                    })
                    .catch(err => { console.log(err) })

            }

        })
    }
})

module.exports = router;