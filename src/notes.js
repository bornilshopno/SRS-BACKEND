// package.json=> scripts/start

import { version } from "react";

// if not works for dot

// previous

res
  .cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  })
  .send({ success: true });


// new version
res.cookie("jwt", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

res.json({ message: "Login successful", token });

// cusotomised
res.cookie("jwt", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
});

res.json({ message: "Login successful", token });


        app.get('api/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const currentUser = await userCollection.findOne(query);
           
            console.log(currentUser)
            res.send(currentUser);
        })
