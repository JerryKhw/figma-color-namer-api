import express, { json } from "express";
import cors from "cors";
import { initEnv } from "#util";

import nearestColor from 'nearest-color';
import colorNameList from 'color-name-list' assert { type: "json" };

import { body, validationResult } from 'express-validator';

const colors = colorNameList.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});
const nearest = nearestColor.from(colors);

const env = initEnv();

const app = express();

app.use(json());
app.use(cors());

app.get("/", (_, res) => {
    res.send("figma-color-namer-api");
})

app.post("/v1", body('colors').notEmpty().isArray(), body('colors.*.hex').notEmpty().isString(), body('colors.*.opacity').notEmpty().isNumeric(), (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        res.status(400).send(
            {
                "message": "bad_request",
            }
        );
        return;
    }

    let colors = [];

    colors = req.body.colors.reduce((list, color) => {
        if (
            list.findIndex(
                ({ hex, opacity }) => hex === color.hex && opacity === color.opacity
            ) === -1
        ) {
            list.push(color);
        }
        return list;
    }, []);

    let newColors = [];

    colors.forEach(color => {
        try {
            let { name } = nearest(color.hex)
            while (true) {
                const colorName = name.toLowerCase().replaceAll(" ", "_").replace("/", "");

                const index = newColors.findIndex(({ hex, name }) => color.hex == hex && colorName == name)

                if (index != -1) {
                    if (color.opacity == 1) {
                        newColors.push(
                            {
                                "hex": color.hex,
                                "opacity": color.opacity,
                                "name": colorName,
                            }
                        )
                    } else {
                        newColors.push(
                            {
                                "hex": color.hex,
                                "opacity": color.opacity,
                                "name": colorName + "_" + Math.round(color.opacity * 100) + "%",
                            }
                        )
                    }
                    break;
                } else {
                    if (newColors.map((color) => color.name).includes(colorName)) {
                        const names = name.split("/");

                        if (names.length > 1) {
                            name = names[0] + "/" + (parseInt(names[names.length - 1]) + 1);
                        } else {
                            name = names[0] + "/1";
                        }
                    } else {
                        if (color.opacity == 1) {
                            newColors.push(
                                {
                                    "hex": color.hex,
                                    "opacity": color.opacity,
                                    "name": colorName,
                                }
                            )
                        } else {
                            newColors.push(
                                {
                                    "hex": color.hex,
                                    "opacity": color.opacity,
                                    "name": colorName + "_" + Math.round(color.opacity * 100) + "%",
                                }
                            )
                        }
                        break;
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    });

    if (newColors.length == 0) {
        res.status(404).send(
            {
                "message": "not_found_colors",
            }
        );
        return;
    }

    res.status(200).send(
        {
            "message": "success",
            "data": newColors,
        }
    );
});

app.listen(env.port);
