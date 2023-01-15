const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');
const swaggerUi = require("swagger-ui-express"),
  swaggerDocument = require("./swagger.json");


app.get('/generate-email', (req, res) => {
    const inputs = {
        input1: req.query.input1,
        input2: req.query.input2,
        input3: req.query.input3,
        input4: req.query.input4,
        input5: req.query.input5,
    };
    const expression = req.query.expression;
    try {
        const email = generateEmail(inputs, expression);
        res.status(200).json({
            data: [{
                id: email,
                value: email
            }]
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function generateEmail(inputs, expression) {
    let email = "";
    const operations = {
        eachWordFirstChars: (input, n) => {
            let str= input.replace(/[a-z]/g, '');
            return (str.toLowerCase()).replace(/[^\w\s]/gi, '');
        },
        wordsCount: (input) => {
            return input.split(" ").length;
        },
        lastWords: (input, n) => {
            let words = input.split(" ");
            if (n < 0) {
                n = words.length + n;
            }
            return words.slice(-n).join(" ");
        },
    };


    let operationsRegExp = new RegExp(/([a-zA-Z]+)\(([^)]+)\)/);
    let inputRegExp = new RegExp(/input[0-9]+/);
    let parts = expression.split(" ~ ");
    parts.forEach(part => {
        let match = part.match(operationsRegExp);
        if (match) {
            let operation = operations[match[1]];
            let operationInputs = match[2].split(",");
            operationInputs = operationInputs.map(input => input.trim());
            let operationInputsValue = operationInputs.map(input => {
                if (inputRegExp.test(input)) {
                    return inputs[input];
                } else {
                    return input;
                }
            });
            email += operation(...operationInputsValue);
        } else {
            match = part.match(inputRegExp);
            if (match) {
                email += inputs[match[0]];
            } else {
                email += part;
            }
        }
    });
    //filter prohibited email characters
    email = email.replace(/[^a-zA-Z0-9._%+-@]/g, "");
    return email;
}


app.listen(8080, () => {
    console.log('Server started on port 8080');
});