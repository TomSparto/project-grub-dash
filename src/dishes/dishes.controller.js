const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
  }
  res.locals.dish = foundDish;
  next();
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function validateDataFields(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (!name) {
    return next({
      status: 400,
      message: "A 'name' field is required",
    });
  }
  if (!description) {
    return next({
      status: 400,
      message: "A 'description' field is required",
    });
  }
  if (!image_url) {
    return next({
      status: 400,
      message: "A 'image_url' field is required",
    });
  }
  if (!price) {
    return next({
      status: 400,
      message: "A 'price' field is required",
    });
  }
  if (price <= 0) {
    return next({
      status: 400,
      message: "The 'price' field needs to be greater than 0",
    });
  }
  if (typeof price !== "number") {
    next({
      status: 400,
      message: "The 'price' field needs to be an integer",
    });
  }
  next();
}

function validateIdMatch(req, res, next) {
  const dishId = req.params.dishId;
  const { data: { id } = {} } = req.body;
  if (dishId !== id) {
    if (id === "" || id === null || id === undefined) {
      next();
    }
    return next({
      status: 400,
      message: `Body id does not match route id: ${id}, ${dishId}`,
    });
  }
  next();
}

function update(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const dish = { ...res.locals.dish, name, description, image_url, price };
  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [validateDataFields, create],
  update: [dishExists, validateDataFields, validateIdMatch, update],
};
