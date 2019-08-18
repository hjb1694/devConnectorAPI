const router = require('express').Router();
const {check, validationResult} = require('express-validator');
const db = require('../util/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/create', [
    check('firstName', 'First Name is Required').trim().isLength({min:2}),
    check('lastName', 'Last Name is Required').trim().isLength({min:2}),
    check('email').trim().isEmail(),
    check('password').isLength({min:6})
], async (req,res,next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).send({errors : errors.array()});
    }

    const {firstName, lastName, email, password} = req.body;

    try{ 

    let qry = `
    SELECT COUNT(*) AS count 
    FROM users 
    WHERE email = ?`;

    let [rows, fields] = await db.execute(qry, [email]);

    if(rows[0].count){

        return res.status(403).json({errors : [{msg : 'This email address already exists'}]});

    }

    qry = `
    INSERT INTO users(first_name, last_name, email, password)
    VALUES(?,?,?,?)
    `;

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    [rows, fields] = await db.query(qry, [firstName, lastName, email, hashedPassword]);


    jwt.sign(
        {userId : rows.insertId}, 
        process.env.JWT_SECRET, 
        {expiresIn : '1hr'}, 
        (err, token) => {
            if(err){
                throw new Error('There was an issue processing the auth token!');
            }

            res.status(200).header('auth-token', token).json({success : 'User has been created', token});

        }   
    )

    } catch(e) {

        res.status(500).json({errors : [{msg : `Sorry, there was a server error: ${e}`}]});

    }


});

router.post('/login', async (req,res,next) => {

    const {email, password} = req.body;

    try{

        let qry = `
        SELECT id, email, password
        FROM users 
        WHERE email = ?
        `;

        let [rows, fields] = await db.execute(qry, [email]);

        if(!rows.length){

            return res.status(403).send({error : 'Email could not be found!'});

        }

        const compared = await bcrypt.compare(password, rows[0].password);

        if(!compared){

            return res.status(403).send({error : 'Password is incorrect!'});

        }

        jwt.sign(
            {userId : rows[0].id},
            process.env.JWT_SECRET, 
            {expiresIn : '1hr'}, 
            (err, token) => {

                if(err){

                    throw new Error('Could not process token');

                }

                res.status(200).header('auth-token',token).json({token});

            }
        );

    }catch(e){

        res.status(500).json({error : `There was a server error! ${e}`});


    }


});


module.exports = router;