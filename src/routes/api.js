import KoaRouter from 'koa-router';

import baseItemModel, { validateBaseItem, updateBaseItem } from '../models/baseItem';
import inventoryItemModel, { validateInventoryItem, updateInventoryItem } from '../models/inventoryItem';

const router = new KoaRouter({
  prefix: '/api'
});

router.get('/ping', (ctx => ctx.body = 'pong'))

router.post('/barcode', async ctx => {
  const { barcode } = ctx.request.body;

  if (!barcode) {
    return ctx.throw(400, 'Please provide a barcode');
  }

  // Find barcode inside baseItems
  const baseItem = await baseItemModel.findOne({ barcode });

  if (!baseItem) {
    // No send back 404
    return ctx.throw(404, 'Item not found');
  }

  // Yes search inventoryItems
  const inventoryItem = await inventoryItemModel.findOne({ barcode });

  if (!inventoryItem) {
    // No send partial content
    const { title, genericTitle, attributes } = baseItem.toObject();

    ctx.body = {
      barcode,
      item: {
        title,
        genericTitle,
        attributes,
      },
    };

    ctx.status = 206;

    return;
  }

  // Yes send 200 for editing
  const { quantity, attributes, item } = inventoryItem.toObject();

  ctx.body = {
    barcode,
    item: {
      ...item,
      _id: undefined,
    },
    properties: {
      quantity,
      attributes: attributes || {},
    },
  };
});

router.post('/item', async ctx => {
  const body = ctx.request.body;

  const { isValid, errors } = await validateBaseItem(body);

  // not validate, 400 with errors
  if (!isValid) {
    ctx.status = 400;
    ctx.body = errors.map(x => x.message);
    return;
  }

  const { barcode } = body;
  
  // find barcode
  if (await baseItemModel.exists({ barcode })) {
    return ctx.throw(400, 'Barcode already exists, please use PUT to update');
  }

  await baseItemModel.create(body);

  ctx.status = 201;
});

router.put('/item', async ctx => {
  const body = ctx.request.body;

  const { isValid, errors } = await validateBaseItem(body);

  // not validate, 400 with errors
  if (!isValid) {
    ctx.status = 400;
    ctx.body = errors.map(x => x.message);
    return;
  }

  const { barcode } = body;
  
  // find barcode
  if (!await baseItemModel.exists({ barcode })) {
    return ctx.throw(404);
  }

  await updateBaseItem(body);

  ctx.status = 200;
});

router.post('/inventory', async ctx => {
  const body = ctx.request.body;

  const { isValid, errors } = await validateInventoryItem(body);

  // not validate, 400 with errors
  if (!isValid) {
    ctx.status = 400;
    ctx.body = errors.map(x => x.message);
    return;
  }

  // Find barcode in baseItems
  const { barcode, quantity = 1, attributes = {} } = body;
  const baseItem = await baseItemModel.findOne({ barcode });

  // find barcode
  if (!baseItem) {
    return ctx.throw(400, 'No base item, please create a base item first');
  }

  // exists send 400 as it already exists, should be using put to update
  if (await inventoryItemModel.exists({ barcode })) {
    return ctx.throw(400, 'Inventory item already exists, please use PUT to update');
  }

  await inventoryItemModel.create({
    barcode,
    quantity,
    attributes,
    item: baseItem
  });

  ctx.status = 201;
});

router.put('/inventory', async ctx => {
  const body = ctx.request.body;

  const { isValid, errors } = await validateInventoryItem(body);

  // not validate, 400 with errors
  if (!isValid) {
    ctx.status = 400;
    ctx.body = errors.map(x => x.message);
    return;
  }

  const { barcode } = body;
  
  // find barcode
  if (!await inventoryItemModel.exists({ barcode })) {
    return ctx.throw(404);
  }

  await updateInventoryItem(body);

  ctx.status = 200;
});

router.get('/inventory', async ctx => {
  const inventory = await inventoryItemModel.find({
    quantity: { $gt: 0 }
  });

  ctx.body = inventory.map(inventoryItem => {
    const { item, quantity, barcode, attributes } = inventoryItem.toObject();

    return {
      barcode,
      item: {
        ...item,
      _id: undefined,
      },
      properties: {
        quantity,
        attributes,
      },
    };
  });
});

export default router;
