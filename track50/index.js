import bcrypt from "bcrypt";
import crypto from "crypto";
import winston from 'winston';
import express from "express";
import { resolve } from "path";
import { config } from "dotenv";
import wshandler from "express-ws";
import bodyParser from "body-parser";
import session from "express-session";
import SocketManager from "cybe-socket";
import { compile } from "./views/compiler.js";
import { createClient } from "@supabase/supabase-js";

const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});
const dblogger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'db.log' }),
    ],
});

config();

const supabaseUrl = 'https://szsbniodkyekhktdjvjv.supabase.co';
const supabaseKey = process.env.DB_pwd;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = wshandler(express()).app;
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(session({
    secret: 'prod',
    saveUninitialized: true,
    resave: true
}));
app.use('/public', express.static('./public'));

function authpageRedirect() {
    return (req, res, next) => {
        if (req.session && req.session.user && req.session.user !== "") {
            return res.send("Already loggedin please go back")
        }
        next();
    };
}

function dashboardRedirect() {
    return (req, res, next) => {
        if (!req.session || !req.session.user || req.session.user === "") {
            return res.send("Not logged in go back to login page")
        }
        next();
    };
}

async function insert(Newdata, table = "users") {
    try {
        dblogger.debug(`Inserting ${JSON.stringify(Newdata)} to ${table}`);
        const { error } = await supabase.from(table).insert([Newdata]);

        if (error) {
            dblogger.error(`Error inseting user (insert(?,${table})): ${JSON.stringify(error)}`)
            console.error('Error inserting user:', error);
            return error;
        }

        return null;
    } catch (error) {
        dblogger.error(`Unexpected error (insert(?,${table})): ${JSON.stringify(error)}`)
        console.error('Unexpected error:', error);
        return error;
    }
}

async function find(username, table = "users") {
    try {
        dblogger.debug(`Finding user ${username} in ${table}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('username', username);

        if (error) {
            dblogger.error(`Error inseting user (find(${username},${table})): ${JSON.stringify(error)}`)
            console.error('Error finding user:', error);
            return [error, null];
        }

        return [null, data];
    } catch (error) {
        dblogger.error(`Unexpected error (find(${username},${table})): ${JSON.stringify(error)}`)
        console.error('Unexpected error:', error);
        return [error, null];
    }
}

app.get('/', (req, res) => {
    res.sendFile(resolve('./views/index.html'));
});

app.get('/dashboard', dashboardRedirect(), (req, res) => {
    res.sendFile(resolve('./views/dashboard.html'));
});

app.get('/login', authpageRedirect(), (req, res) => {
    res.sendFile(resolve("./views/login.html"));
});

app.get('/logout', dashboardRedirect(), (req, res) => {
    req.session.user = null;
    res.send("loggedout")
});

app.get('/signup', authpageRedirect(), (req, res) => {
    res.sendFile(resolve("./views/signup.html"));
});

app.get('/health', (req, res) => {
    res.status(200).send(`${process.uptime()}`);
});

app.ws('/track50', (ws, req) => {
    let data = {};
    let currenttime = Date.now();
    const handler = new SocketManager(ws, {
        onclose: () => {
            if (!data || !data.id) return;
            let totaltime = Date.now() - currenttime;
            dblogger.debug(`Finding user_id ${data.id} in table data`);
            supabase
                .from('data')
                .select('*')
                .eq('user_id', data.id).then((dat) => {
                    const existingData = dat.data;
                    const selectError = dat.error;
                    if (selectError) return;
                    if (existingData.length > 0) {
                        dblogger.debug(`Updating existinguser user_id ${data.id} in table data`);
                        supabase
                            .from('data')
                            .update({
                                session_time: existingData[0].session_time + totaltime,
                                session_number: existingData[0].session_number + 1
                            })
                            .eq('user_id', data.id).then(() => { })
                    } else {
                        dblogger.debug(`Inserting new user_id ${data.id} in table data`);
                        supabase
                            .from('data')
                            .insert({
                                client_id: data.id,
                                username: data.username,
                                browser_used: data.browser_used,
                                browser_catagory: data.browser_category,
                                session_number: 1,
                                session_time: totaltime,
                                ip_loc: data.loc
                            }).then(() => { }).catch(() => { })
                    }
                }).catch(console.error);
        }
    });

    handler.send("READY", "0");
    handler.on("PACKET", (dat) => {
        data = dat;
    })
})

app.get("/:username/track50.js", (req, res) => {
    if (req.params.username.length > 20) return res.end();
    res.setHeader('Content-Type', 'text/javascript')
    res.end(compile({
        username: {
            type: 'string',
            value: req.params.username
        }
    }))
});

app.post('/signup', authpageRedirect(), async (req, res) => {
    const { username, password, confirmation } = req.body;

    if (!username || username === "") {
        res.status(400).send("No username");
        return;
    }
    if (!password || password === "") {
        res.status(400).send("No password");
        return;
    }
    if (!confirmation || confirmation === "") {
        res.status(400).send("Confirmation doesn't exist");
        return;
    }
    if (password !== confirmation) {
        res.status(400).send("Password doesn't match");
        return;
    }

    const found = await find(username, 'user_reg')

    if (found[0]) {
        res.status(500).send(userError);
        return;
    }

    if (found[1].length == 1) {
        res.status(400);
        return res.send("Duplicate username")
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const userError = await insert({ username, password: hash }, 'user_reg');
    if (userError) {
        res.status(500).send(userError);
        return;
    }

    const dataError = await insert({ username, unique_visits: 0, avg_duration: 0.00, bounce_rate: '100%' }, 'user_reg_data');
    if (dataError) {
        res.status(500).send(dataError);
        return;
    }

    const [err, data] = await find(username, 'user_reg');
    if (err) {
        res.status(500).send(err);
        return;
    }

    req.session.user = data[0].username;
    res.send("/dashboard");
});

app.post('/login', authpageRedirect(), async (req, res) => {
    const { username, password } = req.body;

    if (!username || username === "") {
        res.status(400).send("No username");
        return;
    }
    if (!password || password === "") {
        res.status(400).send("No password");
        return;
    }

    try {
        dblogger.debug(`Finding exists from username ${username} in table user_reg`);
        const { data, error } = await supabase
            .from('user_reg')
            .select('*')
            .eq('username', username);

        if (error) {
            dblogger.error(`Unexpected error (login(${username},user_reg_data)): ${JSON.stringify(error)}`)
            res.status(500).send(`Unexpected error: ${JSON.stringify(error)}`);
            return;
        }

        if (data.length !== 1 || !await bcrypt.compare(password, data[0].password)) {
            res.status(400).send("invalid username and/or password");
            return;
        }

        req.session.user = data[0].username;
        res.send("/dashboard");
    } catch (error) {
        res.status(500).send(`Unexpected error: ${JSON.stringify(error)}`);
    }
});

app.get('/getlocations', dashboardRedirect(), async (req, res) => {
    dblogger.debug(`Finding getlocations from username ${req.session.user} in table data`);
    let { data, error } = await supabase
        .from('data')
        .select('ip_loc')
        .eq('username', req.session.user);

    if (error) {
        dblogger.error(`Unexpected error (login(${username},user_reg_data)): ${JSON.stringify(error)}`)
        res.status(500);
        res.send({ error });
    } else {
        const dat = []
        for (let i = 0; i < data.length; i++) {
            const element = data[i].ip_loc;
            dat.push({ loc: element.split("_") })
        }
        res.send(dat);
    }
});

app.get('/getlocationsall', async (req, res) => {
    let { data, error } = await supabase
        .from('data')
        .select('ip_loc')

    if (error) {
        res.status(500);
        res.send({ error });
    } else {
        const dat = []
        for (let i = 0; i < data.length; i++) {
            const element = data[i].ip_loc;
            dat.push({ loc: element.split("_") })
        }
        res.send(dat);
    }
});

app.get('/getinfo', dashboardRedirect(), async (req, res) => {
    dblogger.debug(`Finding getcategory from username ${req.session.user} in table data`);
    dblogger.debug(`Finding getmertrics from username ${req.session.user} in table data`);
    const { data, error } = await supabase
        .from('user_reg_data')
        .select('unique_visits,avg_duration,bounce_rate')
        .eq('username', req.session.user);
    const { data: cat, error: cate } = await supabase
        .from('data')
        .select('browser_catagory,created_at')
        .eq('username', req.session.user);

    if (error || cate) {
        dblogger.error(`Unexpected error (getmertrics(${req.session.user},user_reg_data)): ${JSON.stringify(error || cate)}`)
        res.status(500);
        res.send({ error });
    } else {
        res.send({ metrics: data[0], name: req.session.user, chart: cat });
    }
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', () => {
    console.warn('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.warn('HTTP server closed');
    });
});
