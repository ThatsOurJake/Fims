import { Schema, model } from 'mongoose';
import Ajv from 'ajv';

const inventoryItemSchema = new Schema({
  barcode: { type: String, required: true, unique: true, },
  quantity: Schema.Types.Number,
  // Contains like weight, volume
  attributes: Object,
  item: new Schema({
    title: { type: String, required: true, },
    genericTitle: String,
    attributes: Object,
  }),
});

const inventoryItemModel = model('inventoryItems', inventoryItemSchema);

export const validateInventoryItem = async input => {
  const validator = new Ajv();

  const isValid = await validator.validate({
    type: 'object',
    properties: {
      barcode: {
        type: 'string',
      },
      quantity: {
        type: 'number'
      },
      attributes: {
        type: 'object'
      }
    },
    required: ['barcode' ]
  }, input);

  return {
    isValid,
    errors: validator.errors,
  }
};

export const updateInventoryItem = async newInventoryItem => {
  const { barcode, quantity, attributes } = newInventoryItem;

  const itemToUpdate = await inventoryItemModel.findOne({ barcode });

  if (!itemToUpdate) {
    return;
  }

  await inventoryItemModel.updateOne({ barcode }, {
    ...itemToUpdate.toObject(),
    quantity,
    attributes,
  });
};

export default inventoryItemModel;
