let {
    createNewNearAccount,
    LinkWallet,
    callFuncions,
    getOwner,
    sendMoney,
} = require('../controllers/Near'),
    { getNearPriceInUSD } = require('../lib/near')

module.exports = (router) => {
    router.post('/signup', async (req, res) => {
        try {
            var user = await createNewNearAccount(req.user)
        } catch (error) {
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
    router.post('/link', async (req, res) => {
        req.body.user = req.user
        try {
            var user = await LinkWallet(req.body)
        } catch (error) {
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
    router.get('/price', async (req, res) => {
        try {
            var price = await getNearPriceInUSD()
        } catch (error) {
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

        let response = formatResponse(price)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })
    router.post('/send', async (req, res) => {
        try {
            var price = await sendMoney(req.body, req.user)
        } catch (error) {
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

        let response = formatResponse(price)
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
            status: result.error.statusCode
        }
    }
    return {
        ...result,
        success: true,
        status: 200
    }
}
