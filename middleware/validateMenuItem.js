const { body, validationResult } = require('express-validator');

const menuItemRules = [
  body('name').isString().withMessage('Name must be a string.').bail()
    .trim().isLength({ min: 3 }).withMessage('Name needs at least 3 characters.'),
  body('description').isString().withMessage('Description must be a string.').bail()
    .trim().isLength({ min: 10 }).withMessage('Description needs at least 10 characters.'),
  body('price').custom((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0
  ).withMessage('Price must be a number greater than 0.'),
  body('category').isString().withMessage('Category must be a string.').bail()
    .isIn(['appetizer', 'entree', 'dessert', 'beverage'])
    .withMessage('Category must be appetizer, entree, dessert, or beverage.'),
  body('ingredients').isArray({ min: 1 })
    .withMessage('Ingredients must be an array with at least one ingredient.'),
  body('ingredients.*').isString().withMessage('Each ingredient must be a string.')
    .bail().trim().notEmpty().withMessage('Ingredients cannot be blank.'),
  body('available').optional({ values: 'undefined' }).isBoolean({ strict: true })
    .withMessage('Available must be a boolean.'),
];

function validateMenuItem(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Correct the menu item fields and try again.',
        details: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      },
    });
  }
  next();
}

module.exports = { menuItemRules, validateMenuItem };
