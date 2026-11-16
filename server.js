const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const { menuItemRules, validateMenuItem } = require('./middleware/validateMenuItem');

function createApp() {
  const app = express();
  app.use(requestLogger);
  app.use(express.json());

  const menu = [{
    id: 1,
    name: 'Garden Pasta',
    description: 'Pasta with fresh vegetables and tomato sauce.',
    price: 14.5,
    category: 'entree',
    ingredients: ['pasta', 'tomato', 'zucchini'],
    available: true,
  }];
  let nextId = 2;

  function findMenuItem(req, res, next) {
    const id = /^[1-9]\d*$/.test(req.params.id) ? Number(req.params.id) : null;
    const item = menu.find((item) => item.id === id);
    if (!item) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Menu item not found. Check the item ID.' },
      });
    }
    res.locals.menuItem = item;
    next();
  }

  function menuItemData(body) {
    return {
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      ingredients: body.ingredients,
      available: body.available ?? true,
    };
  }

  app.get('/api/menu', (req, res) => {
    res.status(200).json(menu);
  });

  app.get('/api/menu/:id', findMenuItem, (req, res) => {
    res.status(200).json(res.locals.menuItem);
  });

  app.post('/api/menu', menuItemRules, validateMenuItem, (req, res) => {
    const item = { id: nextId++, ...menuItemData(req.body) };
    menu.push(item);
    res.status(201).location(`/api/menu/${item.id}`).json(item);
  });

  app.put('/api/menu/:id', findMenuItem, menuItemRules, validateMenuItem, (req, res) => {
    const item = res.locals.menuItem;
    Object.assign(item, menuItemData(req.body));
    res.status(200).json(item);
  });

  app.delete('/api/menu/:id', findMenuItem, (req, res) => {
    const item = res.locals.menuItem;
    menu.splice(menu.findIndex((entry) => entry.id === item.id), 1);
    res.status(200).json({ message: 'Menu item deleted.', item });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Endpoint not found. Check the request URL.' },
    });
  });

  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Send a valid JSON request body.' },
      });
    }
    res.status(error.status || 500).json({
      error: { code: 'REQUEST_ERROR', message: 'Unable to process this request.' },
    });
  });
  return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Tasty Bites API listening at http://localhost:3000/api/menu');
  });
}
