import { Schema, model } from 'mongoose';
import Ajv from 'ajv';
import { forEachSeries } from 'p-iteration';

import inventoryItemModel from './inventoryItem';

const baseItemSchema = new Schema({
  barcode: { type: String, required: true, unique: true, },
  title: { type: String, required: true, },
  // Flour, Milk, Chocolate, Ice Cream
  genericTitle: String,
  // Contains like brand name, total weight, total volume, flavour...
  attributes: Object
});

const baseItemModel = model('baseItems', baseItemSchema);

export const validateBaseItem = async (input) => {
  const validator = new Ajv();

  const isValid = await validator.validate({
    type: 'object',
    properties: {
      barcode: {
        type: 'string',
      },
      title: {
        type: 'string'
      },
      genericTitle: {
        type: 'string'
      },
      attributes: {
        type: 'object'
      }
    },
    required: ['barcode', 'title']
  }, input);

  return {
    isValid,
    errors: validator.errors,
  }
};

export const updateBaseItem = async newBaseItem => {
  const { barcode } = newBaseItem;

  await baseItemModel.updateOne({ barcode }, newBaseItem);

  const itemsToUpdate = await inventoryItemModel.find({ barcode });

  await forEachSeries(itemsToUpdate, async itemToUpdate => {
    await inventoryItemModel.findByIdAndUpdate(itemToUpdate.id, {
      ...itemToUpdate.toObject(),
      item: newBaseItem
    }, {
      useFindAndModify: true,
    });
  });
};

export default baseItemModel;
