/* 

*************************************************************************************************
Current-C: A SIMPLE CURRENCY CONVERTER APP WITH REAL-TIME DATA & CONVERSIONS
AUTHOUR: RYAN HADLEY (eagleTears)
*************************************************************************************************

This app uses the APILayer API to provide data regarding exchange rates, and quickly converts any of the major world currencies by returning the data within a HTML table.
Please note that this node.js app assumes ES module functionality, so you must ensure "type": "module" is added to package json file. 
To make the API request, I have imported 'node-fetch' to allow the JS fetch request method to be used for server-side scripting.

*/

// App setup

import express from "express"
import bodyParser from "body-parser"
import fetch from "node-fetch"
import config from "./config.js"

const app = express()
app.set("view engine", "ejs")

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

app.use(express.static("public"))

// Insert own API key from APILayer as the value inside this object literal

const myHeaders = {
  apikey: config.apikey
}

const requestOptions = {
  method: "GET",
  redirect: "follow",
  headers: myHeaders
}

/*
  ERROR HANDLER
  Function to handle errors that may occur in the rendering of the results ('conversion') page, or home page due to failure to connect with the API.
  It takes an 'error' parameter that is itself the value of any 'catch' function passed in, as well as the 'response' argument. 
  The latter allows the rendering of the error.ejs page. The error is stored in a var and then rendered on the error page to produce a more accurate, dynamic message.
*/

const handleError = (error, res) => {
  const errorMessage = error
  console.log(errorMessage)
  res.render("error", {
    errorMessage: errorMessage
  })
}

// Request the list of currencies from the API and render them as dropdown options (home page)

fetch("https://api.apilayer.com/exchangerates_data/symbols", requestOptions)
  .then((response) => response.json())
  .then((result) => {
    console.log("resolved")
    const currencyList = result.symbols
    app.get("/", (req, res) => {
      res.render("index", {
        currencyList: currencyList
      })
    })
  })
  .catch((error, res) => handleError(error, res))

/* 
  CONVERSION
  Once the user makes a POST request after selecting the currencies to convert, those values are stored and passed into the API conversion endpoint. 
  When that response is returned, the user's choices and resulting conversion are sent back to them inside a HTML table. 
  The rendered values of 'rate' and the 'conversion' use the toFixed method in order to reduce the decimals of those variables and make the output cleaner and more readable.
*/

app.post("/", (req, res) => {
  const amount = req.body.amount
  const fromCurrency = req.body.currency1
  const toCurrency = req.body.currency2

  fetch(
    `https://api.apilayer.com/exchangerates_data/convert?to=${toCurrency}&from=${fromCurrency}&amount=${amount}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      res.render("conversion", {
        amount: amount,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        date: result.date,
        rate: result.info.rate.toFixed(2),
        conversion: result.result.toFixed(2)
      })
    })
    .catch((error) => handleError(error, res))
})

// Allow user to return home from conversion page to enter another conversion

app.post("/conversion.ejs", (req, res) => {
  res.redirect("/")
})

// Redirect user back home if 'Try Again' is clicked on error page

app.post("/error.ejs", (req, res) => {
  res.redirect("/")
})

// Allow Heroku to define and set a port, but if none found use my localhost port (3000)

let port = process.env.PORT
if (port == null || port == "") port = 3000

app.listen(port, () => {
  console.log(`Server running: Port ${port}`)
})
