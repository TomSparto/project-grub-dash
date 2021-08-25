const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
  next();
}

function create(req, res) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: [{ id, name, description, image_url, price, quantity }] = [],
    } = {},
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: [{ id, name, description, image_url, price, quantity }],
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function validateBodyFields(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  if (!deliverTo) {
    return next({
      status: 400,
      message: "A 'deliverTo' field is required",
    });
  }
  if (!mobileNumber) {
    return next({
      status: 400,
      message: "A 'mobileNumber' field is required",
    });
  }
  if (!dishes) {
    return next({
      status: 400,
      message: "A 'dishes' field is required",
    });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "The 'dishes' field needs to be an array",
    });
  }
  res.locals.dishes = dishes;
  res.locals.status = status;
  next();
}

function validateQuantity(req, res, next) {
  const dishes = res.locals.dishes;
  for ([index, dish] of dishes.entries()) {
    if (!dish.quantity) {
      return next({
        status: 400,
        message: `The dish at index ${index} is missing a 'quantity' field`,
      });
    }
    if (dish.quantity <= 0 || typeof dish.quantity !== "number") {
      return next({
        status: 400,
        message: `The dish at index ${index} has a 'quantity' field that is not an integer greater than 0`,
      });
    }
  }
  next();
}

function update(req, res) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: [{ id, name, description, image_url, price, quantity }] = [],
    } = {},
  } = req.body;
  const newOrder = {
    ...res.locals.order,
    deliverTo,
    mobileNumber,
    status,
    dishes: [{ id, name, description, image_url, price, quantity }],
  };
  res.json({ data: newOrder });
}

function validateStatus(req, res, next) {
  const status = res.locals.status;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status) {
    return next({
      status: 400,
      message: "A 'status' field is required",
    });
  }
  if (!validStatus.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, perparing, out-for-deliver, or delivered",
    });
  }
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function validateIdMatch(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id } = {} } = req.body;
  if (orderId !== id) {
    if (id === "" || id === null || id === undefined) {
      next();
    }
    return next({
      status: 400,
      message: `Body id does not match route id: ${id}, ${orderId}`,
    });
  }
  next();
}

function destroy(req, res) {
  const { id } = res.locals.order;
  const index = orders.findIndex((order) => order.id === id);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function statusIsPending(req, res, next) {
  const { status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [validateBodyFields, validateQuantity, create],
  update: [
    orderExists,
    validateBodyFields,
    validateQuantity,
    validateStatus,
    validateIdMatch,
    update,
  ],
  delete: [orderExists, statusIsPending, destroy],
};
