  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTE0NzkwZjVjMDdmNjAxOTQ3ODg2MWIiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwiaWF0IjoxNzc2Mzk1MDc4LCJleHAiOjE3NzYzOTU5Nzh9.33UdYg614xqP-zI_rxWI_CWSYFFYUdfUJwKE1juDXIU',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTE0NzkwZjVjMDdmNjAxOTQ3ODg2MWIiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwiaWF0IjoxNzc2Mzk1MDc4LCJleHAiOjE3NzY5OTk4Nzh9.4U5kM_FaiSrhC13HfFgG8SeSOap7B9GxFVu8Mu6qL-0'

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

