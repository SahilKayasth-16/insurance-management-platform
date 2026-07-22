import express from "express";

const app = express();

app.get("/", (_, res) => {
    res.json({
        message: "Insurance Management Platform API."
    });
});

export default app;