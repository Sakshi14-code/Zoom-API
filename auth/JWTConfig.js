const jwt = require('jsonwebtoken');
const config = require('../config/config');
const secret = config.jwtSecret;
const pool = require('../db/config');

// Routes to run auth on
const securedRoutes = [
    "/api/profile",
    "/api/booking",
    "/api/seats",
];

const userExists = async (id) => {
    const queryResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return (queryResult.rows.length > 0);
};

const verify = (token) => {
	try {
		const decoded = jwt.verify(token, secret);
		if(decoded === undefined || decoded == "") return false;
		return decoded.id;
	} catch (err) { return false; }
};

exports.AuthenticationHandler = async (req, res, next) => {
	// Only run auth on secured routes
    const pathParts = req.path.split("/", 3);
    if (!securedRoutes.includes(`/${pathParts[1]}/${pathParts[2]}`)) return next();

    // check header
    const header = req.headers.authorization;
    if (header === undefined || header === "") return res.status(401).json({ error: "No Authorization Header" });

    // check token
    const token = header.split(" ")[1];
    if (token === undefined || token === "") return res.status(401).json({ error: "No token provided" });

    const userId = verify(token);
    if(!userId || userId === undefined || userId == "") return res.status(500).send({ error: 'Failed to authenticate token.' });

    if (!(await userExists(userId))) return res.status(404).json({ error: "User not found" });

    req.UserID = userId;

    next();
}

exports.sign = id => {
	let token = jwt.sign({id: id}, secret);
    return token;
}