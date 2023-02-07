let {
    getTransactions
} = require('../controllers/Transactions')

module.exports = (router) => {

    router.get('/', async (req, res) => {

        try {
            var transactions = await getTransactions(
                req.query,
                req.query.page,
                req.query.perPage,
                req.user
            )
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

        let response = formatResponse(transactions)
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
