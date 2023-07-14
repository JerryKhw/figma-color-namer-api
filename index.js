import express from "express";
import { initEnv } from "#util";

import nearestColor from 'nearest-color';
import colorNameList from 'color-name-list' assert { type: "json" };

const colors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});
const nearest = nearestColor.from(colors);

const env = initEnv();

const app = express();

app.get("/", (req, res) => {
    if (!req.query.colors) {
        res.send("figma-color-namer-api");
        return;
    }

    const colors = req.query.colors.split(',')

    if (colors.lenght == 0) {
        res.send("figma-color-namer-api");
        return;
    }

    try {
        res.send(
            {
                "message": "success",
                "data": colors.map((color) => {
                    const { name } = nearest(color)

                    return {
                        "hex": color,
                        "name": name,
                    }
                })
            }
        );
    } catch (e) {
        res.send(
            {
                "message": "not_found_color",
            }
        );
    }

});

app.listen(env.port);
