# How to set up the API server

**You must first download Node.js and MongoDB to run this project on your local machine**

## Create a .env file in the root directory with the following enviornment variables

### Follow the instructions below for setting up the enviornment variables

- PORT=3001
- NODE_ENV=development
- DB_LOCAL=mongodb://localhost:27017/MyShop
- API_URL=http://localhost:3001/api/v1
- WEBAPP_URL=http://localhost:3000

- JWT_SECRET=Enter a random string of characters
- JWT_EXPIRES_TIME=7d
- COOKIE_EXPIRES_TIME=7

- MAX_FILE_SIZE=2000000
- UPLOAD_PATH=./public/images

### Before launching the API server, you must register a Stripe account, navigate to your user panel and copy the Stripe secret key in the variable below.

#stripe
STRIPE_SECRET_KEY=Your Stripe secret key
STRIPE_REDIRECT_URL=http://localhost:3000/stripe/callback
STRIPE_SETTINGS_REDIRECT=http://localhost:3000/items-sold
STRIPE_SUCCESS_URL=http://localhost:3000/stripe/stripe-success
STRIPE_CANCEL_URL=http://localhost:3000/checkout

### This project uses Google's SMTP to send emails, if you choose, you can use another SMTP provider.

#EMAILS

- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_EMAIL=Your SMPT email
- SMTP_PASSWORD=Your SMTP email password
- SMTP_FROM_EMAIL=The "FROM" email.
- SMTP_FROM_NAME=MyShop

## How to set up the server

Install project dependencies by typing

```
npm i
```

in the console in the root directory of this project.

Then run the development server by typing in the console:

```
npm run dev to run the server in development mode
or
npm run prod to run the server in production mode
```
