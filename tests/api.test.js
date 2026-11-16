const request = require('supertest');
const { createApp } = require('../server');

const validItem = {
  name: 'Chocolate Cake',
  description: 'Chocolate cake served with vanilla cream.',
  price: 7,
  category: 'dessert',
  ingredients: ['cocoa', 'flour', 'cream'],
};
let app;
let logger;

beforeEach(() => {
  app = createApp();
  logger = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logger.mockRestore());

test('GET returns all menu items and logs method, URL, timestamp and status', async () => {
  const response = await request(app).get('/api/menu').expect(200);
  expect(response.body).toHaveLength(1);
  const log = JSON.parse(logger.mock.calls[0][0]);
  expect(log).toMatchObject({ method: 'GET', url: '/api/menu', status: 200 });
  expect(Number.isNaN(Date.parse(log.timestamp))).toBe(false);
});

test('GET returns an item by ID', async () => {
  const response = await request(app).get('/api/menu/1').expect(200);
  expect(response.body.name).toBe('Garden Pasta');
});

test('POST creates an item, defaults available to true and logs its body', async () => {
  const response = await request(app).post('/api/menu').send(validItem).expect(201);
  expect(response.body).toEqual({ id: 2, ...validItem, available: true });
  expect(JSON.parse(logger.mock.calls[0][0]).body).toEqual(validItem);
  await request(app).get('/api/menu/2').expect(200);
});

test('POST respects available=false', async () => {
  const response = await request(app).post('/api/menu')
    .send({ ...validItem, available: false }).expect(201);
  expect(response.body.available).toBe(false);
});

test.each([
  ['name', 'ab'], ['name', 123], ['description', 'short'],
  ['price', -1], ['price', 0], ['price', '7'],
  ['category', 'snack'], ['ingredients', []], ['ingredients', 'flour'],
  ['ingredients', ['']], ['available', 'false'], ['available', null],
])('POST rejects invalid %s with 400', async (field, value) => {
  const response = await request(app).post('/api/menu')
    .send({ ...validItem, [field]: value }).expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details.some((error) => error.field.startsWith(field))).toBe(true);
  const menu = await request(app).get('/api/menu');
  expect(menu.body).toHaveLength(1);
});

test.each(['name', 'description', 'price', 'category', 'ingredients'])(
  'POST rejects missing %s', async (field) => {
    const body = { ...validItem };
    delete body[field];
    await request(app).post('/api/menu').send(body).expect(400);
  }
);

test('PUT replaces a menu item and keeps its ID', async () => {
  const response = await request(app).put('/api/menu/1')
    .send({ ...validItem, id: 99, available: false }).expect(200);
  expect(response.body).toEqual({ ...validItem, id: 1, available: false });
  const fetched = await request(app).get('/api/menu/1');
  expect(fetched.body).toEqual(response.body);
  expect(JSON.parse(logger.mock.calls[0][0]).method).toBe('PUT');
});

test('PUT rejects invalid data and keeps the original item', async () => {
  await request(app).put('/api/menu/1').send({ ...validItem, price: -1 }).expect(400);
  const response = await request(app).get('/api/menu/1');
  expect(response.body.name).toBe('Garden Pasta');
});

test('DELETE removes an item and returns 200', async () => {
  const response = await request(app).delete('/api/menu/1').expect(200);
  expect(response.body.item.id).toBe(1);
  await request(app).get('/api/menu/1').expect(404);
});

test.each(['get', 'put', 'delete'])('%s returns 404 for a missing item', async (method) => {
  const response = await request(app)[method]('/api/menu/999').send(validItem).expect(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
});

test('new IDs remain unique after deletion', async () => {
  await request(app).post('/api/menu').send(validItem).expect(201);
  await request(app).delete('/api/menu/1').expect(200);
  const response = await request(app).post('/api/menu').send(validItem).expect(201);
  expect(response.body.id).toBe(3);
});

test('malformed JSON returns a clear 400 error and is logged', async () => {
  const response = await request(app).post('/api/menu')
    .set('Content-Type', 'application/json').send('{"name":').expect(400);
  expect(response.body.error.code).toBe('INVALID_JSON');
  expect(JSON.parse(logger.mock.calls[0][0]).status).toBe(400);
});

test('unknown routes return a consistent JSON error', async () => {
  const response = await request(app).get('/wrong').expect(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
});
