let { standardLogin, ResetPassword, ForgotPassword, createUser } = require('../controllers/Auth')

module.exports = (router) => {

    router.post('/login', async (req, res) => {

        try {
            var user = await standardLogin(
                req.body.email,
                req.body.password
            )
        } catch (error) {
            console.log(error.message)
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(user)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })
    router.post('/signup', async (req, res) => {

        try {
            var user = await createUser(
                req.body
            )
        } catch (error) {
            console.log(error.message)
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(user)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })
    router.post('/reset-password', async (req, res) => {

        try {
            var user = await ResetPassword(
                req.body,
            )
        } catch (error) {
            console.log(error.message)
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(user)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })
    router.post('/forgot-password', async (req, res) => {

        try {
            var user = await ForgotPassword(
                req.body,
            )
        } catch (error) {
            console.log(error.message)
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(user)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })
    return router
}

function formatResponse(result, isError = false) {
    if (isError === true) {
        return {
            message: result.error.message.message || result.error.message,
            success: false,
            status: result.error.statusCode || result.error.status
        }
    }
    return {
        ...result,
        success: result.success,
        status: 200
    }
}