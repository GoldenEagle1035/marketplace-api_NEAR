let {
    getNominationVotes,
    getNominationVote,
    createNominationVote,
    deleteNominationVote,
    editNominationVote
} = require('../controllers/NominationVotes')

module.exports = (router) => {

    router.get('/', async (req, res) => {

        try {
            var nominationvotes = await getNominationVotes(
                req.query,
                req.query.page,
                req.query.perPage,
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

        let response = formatResponse(nominationvotes)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })

    router.get('/:id', async (req, res) => {
        try {
            var nominationvote = await getNominationVote(req.params.id, req.query)
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

        let response = formatResponse(nominationvote)
        let status = response.status || 200
        delete response.status


        return res.status(status || 200).json({
            ...response
        })

    })

    router.post('/', async (req, res) => {
        try {
            var nominationvote = await createNominationVote(req.body, req.user.id)
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

        let response = formatResponse(nominationvote)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })

    router.patch('/:id', async (req, res) => {
        try {
            var nominationvote = await editNominationVote(req.params.id, req.body)
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

        let response = formatResponse(nominationvote)
        let status = response.status || 200
        delete response.status


        return res.status(status || 200).json({
            ...response
        })

    })

    router.delete('/:id', async (req, res) => {
        try {
            var nominationvote = await deleteNominationVote(req.params.id)
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

        return res.json(formatResponse(nominationvote))

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
