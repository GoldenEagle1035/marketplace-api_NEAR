const crypto = require('crypto');

module.exports = (router) => {
    router.get('/sign', async (req, res) => {
        try {
            const originalUrl = 'https://buy-staging.moonpay.com?apiKey=pk_test_Atula0B14cvDEjG2VohLCsa2bmhInRk&currencyCode=eth&walletAddress=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae';

            var signature = crypto
                .createHmac('sha256', process.env.MOONPAY_SECRET_KEY)
                .update(new URL(originalUrl).search)
                .digest('base64');
            signature = { signature }
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

        let response = formatResponse(signature)
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
