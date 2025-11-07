// Example service (for now, no real DB insert)
export async function createUser({ name, email, password }) {
  // Normally you'd insert into MongoDB here
  return { id: Date.now(), name, email };
}

export async function verifyUser(email, password) {
  // Normally you'd fetch and compare from DB
  return { id: 1, email };
}
