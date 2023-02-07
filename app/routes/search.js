let {
    getSearch
} = require('../controllers/Search')

module.exports = (router) => {
    router.get('/', async (req, res) => {

        try {
            var playlists = await getSearch(
                req.query,
                req.query.page,
                req.query.perPage,
                req.user.id
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

        let response = formatResponse(playlists)
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
