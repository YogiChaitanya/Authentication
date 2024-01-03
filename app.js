const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')
let db = null

const initiallizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running at https://yogichaitanyapncjfnjscpfvwof.drops.nxtwave.tech:3000/',
      )
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initiallizeDBAndServer()

// API 1
app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body

  const hasedPassword = await bcrypt.hash(password, 10)
  const checkTheUsername = `select * from user where username='${username}'`

  let dbUser = await db.get(checkTheUsername)

  if (dbUser === undefined) {
    let postNewUserQuery = `
    insert into 
      user(username,name,gender,location)
    values(
      '${username}',
      '${name}',
      '${hasedPassword}',
      '${gender}',
      '${location}';`

    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(postNewUserQuery)
      await db.run(newUserDetails)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2
app.post('/login', async (request, response) => {
  const {userName, password} = request.params
  const addUserQuery = `select * from user where username=${userName}&password=${password};`
  const dbUser = await db.run(addUserQuery)

  if (dbUser === undefined) {
    // Invalid User
    response.status(400)
    response.send('Invalid User')
  } else {
    // check the user password
    const checkThePassword = await compare(password, dbUser.password)
    if (checkThePassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.send(400)
      response.send('Invalid password')
    }
  }
})

// API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkForUserQuery = `select * from user where username='${username}'`
  const dbUser = await db.get(checkForUserQuery)

  // First we have to know whether the user exists in the database or not
  if (dbUser === undefined) {
    // user not registered
    response.status(400)
    response.send('User not registered')
  } else {
    // check for password
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      // check length of the new password
      const lengthOfNewPassword = newPassword.length
      if (lengthOfNewPassword < 5) {
        // password is too short
        response.status(400)
        response.send('Password is too short')
      } else {
        // update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        update user
        set password='${encryptedPassword}'
        where username='${username}'`
        await db.run(updatePasswordQuery)
        response.send('Password updated')
      }
    } else {
      // invalid password
      response.status(400)
      responsee.send('Invalid current password')
    }
  }
})

module.exports = app
