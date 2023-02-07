
const { User } = require('../models'),
  md5 = require('md5'),
  jsonwebtoken = require('jsonwebtoken'),
  { sendMail } = require('../lib/external-services'),
  { transaction } = require('objection')


module.exports = {
  standardLogin: async (email, password) => {
    if (!email || !password) {
      throw {
        success: false,
        message: "Email or Password missing.",
        status: 400
      };
    }
    email = email.trim().toLowerCase();
    password = password.trim();
    const user = await User.query().findOne({
      username: email,
      password: md5(password)
    }).eager('currentRole')
    if (!user) {
      throw {
        message: 'Email and password does not match',
        statusCode: 401
      }
    }
    return {
      token: jsonwebtoken.sign({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        id: user.id,
        current_role: user.currentRole,
      },
        process.env.JWT_SECRET_KEY,
      )
    }
    try {

    } catch (e) {
      throw {
        message: e.error.message,
        statusCode: e.statusCode
      }
    }

  },
  async createUser(userBody, ) {
    let password = userBody.password
    if (userBody.password) {
      userBody.password = md5(userBody.password)
    }
    const wasFoundUser = await User.query().findOne({ email: userBody.email.trim() })
    if (wasFoundUser) {
      throw {
        message: `An user is already associated with this email`,
        statusCode: 400
      }
    }
    const user = await transaction(
      User,
      async (User) => {
        var newUser = await User.query().insert({
          ...userBody
        })

        return newUser
      }
    )
    sendMail(
      "welcome",
      userBody.email,
      "Welcome to QuipDealio!", {
      email: userBody.username,
      password: password,
      website: 'https://quipdealio.com/qd'
    })

    return {
      token: jsonwebtoken.sign({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        id: user.id,
      },
        process.env.JWT_SECRET_KEY),
      ...user.safeValues(),
    };

  },
  async ResetPassword(userBody, ) {
    if (!userBody.key) {
      throw {
        message: 'Reset Key is not provided',
        statusCode: 400
      }
    }
    if (!userBody.password) {
      throw {
        message: 'Password is not provided',
        statusCode: 400
      }
    }
    if (userBody.password) {
      userBody.password = md5(userBody.password)
    }
    const user = await User.query().findOne({ reset_token: userBody.key })
    if (!user) {
      throw {
        message: 'Invalid user token',
        statusCode: 400
      }
    }
    const patchUser = await User.query().patchAndFetchById(user.id, {
      reset_token: null,
      password: userBody.password
    })
    return {
      token: jsonwebtoken.sign({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        id: user.id,
      },
        process.env.JWT_SECRET_KEY),
      ...user.safeValues(),
    };

  },
  async ForgotPassword(userBody, ) {
    if (!userBody.email) {
      throw {
        message: 'Email is not provided',
        statusCode: 400
      }
    }
    const user = await User.query().findOne({ email: userBody.email })
    if (!user) {
      throw {
        message: 'User not found',
        statusCode: 400
      }
    }
    const key = md5((new Date()).toString())
    const patchUser = await User.query().patchAndFetchById(user.id, {
      reset_token: key,
    })
    let url = process.env.NODE_ENV === 'production' ? `https://quipdealio.com/qd/reset-password?q=${key}` : `http://localhost:8000/reset-password?q=${key}`
    sendMail(
      "forgotPassword",
      userBody.email,
      "Your Password Reset Notification", {
      name: user.first_name,
      token: patchUser.reset_token,
      url,
    }
    )
    return {
      message: 'An email has been sent with password reset link.',
      success: true
    };

  },
}