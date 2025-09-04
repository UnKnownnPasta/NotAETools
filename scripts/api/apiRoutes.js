import express from 'express';
import { fetchData } from '../../src/services/googleSheets.js';
import { updateFissures } from '../../scripts/api/fissures.controller.js';
import { getMerged } from '../../src/managers/stored/getMerged.js'
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

const baseLimitter = {
    windowMs: 10 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => {
      return req.headers['user-agent'] || 'anonymous';
    },
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({ error: 'Rate limit exceeded' });
      next();
    },
    standardHeaders: true,
    legacyHeaders: false,
};

const apiLimiter = rateLimit({
    ...baseLimitter,
    max: 50,
});

// Route to force an update
router.get('/forceupdate', apiLimiter, async (req, res) => {
    const token = decodeURIComponent(req.headers.token);
    if (token === process.env.SUPERTOKEN) {
        try {
            await fetchData();
            res.status(200).send('OK!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(403).send('403 Forbidden');
    }
});

// Heartbeat route
router.get('/heartbeat', (req, res) => {
    const badgeData = {
        schemaVersion: 1,
        label: 'status',
        message: 'operational',
        color: 'brightgreen'
    };
    res.status(200).json(badgeData);
});

// Endpoint for fissure updating
router.get('/fissure', async (request, res) => {
    // const authHeader = (request.headers["X-Source-Job"] || request.headers["x-source-job"]);
    
    // if (!authHeader || authHeader !== process.env.EXPECTED_AUTH_TOKEN) {
    //   console.error('Unauthorized request to API /fissure', authHeader);
    //   return res.status(401).send('401 Unauthorized');
    // }

    try {
      await updateFissures(process.env);
      return res.status(200).send('OK!');
    } catch (error) {
      console.error("Error updating fissures:", error);
      return res.status(500).send('500 Internal Server Error');
    }
})

router.get('/explorer', apiLimiter, async (req, res) => {
    res.json(await getMerged());
})


export default router;
