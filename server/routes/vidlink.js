const express = require('express');
const { getResilientSources } = require('../utils/sourceDiscovery');
const router = express.Router();

router.get('/source/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const { s, e } = req.query;

    console.log(`[API] Source request: ${type} ${id} (S:${s} E:${e})`);

    try {
        const data = await getResilientSources(id, type, s, e);
        res.json(data);
    } catch (error) {
        console.error(`[API] All providers failed for ${id}:`, error.message);
        res.status(404).json({ error: "No stream found after exploring all resilient providers." });
    }
});

module.exports = router;
