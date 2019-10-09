import KoaRouter from 'koa-router';
import get from 'lodash.get';

import baseItemModel from '../models/baseItem';
import inventoryItemsModel from '../models/inventoryItem';

/*
  {
    GET: 'collectionName',
    WHERE: [{
      key: 'barcode',
      condition: 'EQUALS',
      value: 'xxxx-xxxx-xxxx'
    }],
    RETURN: ['attributes']
  }
*/

const router = new KoaRouter({
  prefix: '/query'
});

const getCollection = name => {
  switch(name.toLowerCase()) {
    case 'baseitems':
      return baseItemModel;
    case 'inventoryitems':
      return inventoryItemsModel;
    default:
      return null;
  }
}

router.post('/', async ctx => {
  const body = ctx.request.body;

  if (!body.GET) {
    return ctx.throw(400, 'Must provide "GET" and a collection name');
  }

  let collection = getCollection(body.GET)

  if (!collection) {
    return ctx.throw(400, 'Invalid collection name');
  }

  const query = collection.find({});

  if (body.WHERE) {
    body.WHERE.forEach(({
      key, condition, value
    }) => {
      switch (condition.toLowerCase()) {
        case 'equals': {
          query.or({ [key]: value});
          break;
        }
        default:
          break;
      }
    });
  }

  if (body.RETURN) {
    query.select(body.RETURN.join(' '));
  } else if (body.SUM) {
    query.select(body.SUM.join(' '));
  }

  const queryResult = await query.exec();

  let result = queryResult;

  if (body.SUM) {
    let totalSum = 0;
    body.SUM.forEach(path => {
      try {
        const inputs = result.map(item => get(item, path));
        const sum = inputs.reduce((a,b) => (a + (b || 0)), 0);
        totalSum += sum;
      } catch (error) {
        return ctx.throw(400, `${body.SUM} is not a valid option to sum on`);
      }
    });

    result = [ totalSum ];
  }

  ctx.body = result;
});

export default router;
