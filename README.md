# Tasty Bites Restaurant API

Logan Runyan · Application Development I: Backend

Express API for managing restaurant menu items, with request logging and input validation using express-validator.

## Run

```sh
npm install
npm test
npm start
```

The API runs at http://localhost:3000. Menu data is stored in memory and resets when the server restarts. The starter template link was not supplied, so the starting collection contains a sample Garden Pasta item.

## Endpoints

| Method | Path | Success | Errors |
| --- | --- | --- | --- |
| GET | /api/menu | 200, menu array | |
| GET | /api/menu/:id | 200, menu item | 404 |
| POST | /api/menu | 201, created item | 400 |
| PUT | /api/menu/:id | 200, updated item | 400, 404 |
| DELETE | /api/menu/:id | 200, confirmation and deleted item | 404 |

POST and PUT require all fields below except available, which defaults to true.

```json
{
  "name": "Chocolate Cake",
  "description": "Chocolate cake served with vanilla cream.",
  "price": 7,
  "category": "dessert",
  "ingredients": ["cocoa", "flour", "cream"],
  "available": true
}
```

Name must be a string of at least 3 characters. Description must be a string of at least 10 characters. Price must be a JSON number greater than zero. Category must be appetizer, entree, dessert, or beverage. Ingredients must contain at least one nonblank string. Available must be a boolean when supplied.

Errors have an error object with a code and message. Validation errors also include a details array with field names and messages.

## Middleware and tests

- middleware/requestLogger.js records the timestamp, method, full URL, final status, and POST/PUT body for every request.
- middleware/validateMenuItem.js uses express-validator rules and a custom validation middleware to return consistent 400 errors.
- tests/api.test.js contains 30 tests covering CRUD behavior, validation, defaults, logging, malformed JSON, missing resources, and unique IDs.

## Postman documentation

[View the public Tasty Bites Restaurant API documentation](https://documenter.getpostman.com/view/60239161/2sBYHbqvVE)

The documentation includes all five endpoints, request bodies, and saved success and error responses. The importable collection is in postman/Tasty_Bites.postman_collection.json.
