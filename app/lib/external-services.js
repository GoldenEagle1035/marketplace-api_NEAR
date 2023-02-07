const
  fs = require('fs'),
  path = require('path'),
  Handlebars = require('handlebars'),
  axios = require('axios')

module.exports = {
  sendMail(emailTemplate, email, subject, emailVars) {
    return new Promise((resolve, reject) => {
      fs.readFile(`${path.join(__dirname, '../emails')}/${emailTemplate}.html`, 'utf8', (err, data) => {
        if (err) return reject(err)
        // emailVars.url = process.env.SITE_FRONT
        var templateBody = data
        templateBody = Handlebars.compile(templateBody)
        templateBody = templateBody(emailVars)
        fs.readFile(`${path.join(__dirname, '../emails')}/emailBase.html`, 'utf8', (err, data) => {
          if (err) return reject(err)
          var email_body = data
          email_body = Handlebars.compile(email_body)
          email_body = email_body({ content: templateBody })
          // mailgun.messages().send({
          //   from: `${process.env.BUSINESS_NAME}<${process.env.NO_REPLY_ADDRESS}>`,
          //   to: email,
          //   subject: subject,
          //   html: email_body
          // }, (err, result) => {
          //   if (err) return reject(err)
          //   resolve(result)
          // })
        })
      })
    })
  }
}