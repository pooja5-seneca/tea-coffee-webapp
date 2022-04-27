//#region COMMENT HEADER
/* Author: Group 1
   Date: April 1,2022
   Title: Project Phase 3
*/
//#endregion

//#region Server Setup
var express = require("express");
var app = express();
var HTTP_PORT = process.env.PORT || 8081;

//body parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

//cookie parser
var cookieParser = require("cookie-parser");
app.use(cookieParser());

const Sequelize = require("sequelize");
const clientSessions = require("client-sessions");

//#region CONNECT TO THE DATABASE
var sequelize = new Sequelize(
  "da0rg01ri3pfsj",
  "mrnohuyjzbaahe",
  "0bbb43a19ee6ffd1fba8dea290ec2f7eaa733ced8eea3bdd587d139b3725458b",
  {
    host: "ec2-34-233-157-9.compute-1.amazonaws.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

sequelize
  .authenticate()
  .then(function () {
    console.log("Connection to database has been established successfully.");
  })
  .catch(function (err) {
    console.log("Unable to connect to the database:", err);
  });

//#endregion

//#region call Models
const UserModel = require("./models/UserModel.js");
const User = UserModel(sequelize, Sequelize);

const ProductModel = require("./models/ProductModel");
const Product = ProductModel(sequelize, Sequelize);

const CategoryModel = require("./models/CategoryModel");
const Category = CategoryModel(sequelize, Sequelize);

Category.hasOne(Product, {
  foreignKey: {
    name: "category_id",
    field: "category_id",
  },
});

//#endregion
require("dotenv").config();

function OnHttpStart() {
  console.log("****************************************");
  console.log("Express server started successfully");
  console.log("Link: http://localhost:" + HTTP_PORT);
  console.log("****************************************");
}

app.use(express.static("views"));
app.use(express.static("public"));

const { engine } = require("express-handlebars");

// added custome helper
app.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        let liClass =
          url == app.locals.activeRoute ? "nav-item active" : "nav-item";
        return (
          `<li class="` +
          liClass +
          `" >
                  <a class="nav-link" href="` +
          url +
          `">` +
          options.fn(this) +
          `</a>
                </li>`
        );
      },
      for: function (from, to, incr, block) {
        var accum = "";
        for (var i = from; i <= to; i += incr) accum += block.fn(i);
        return accum;
      },
      sum: function (a, b) {
        return parseInt(a) + b;
      },
      notEqual: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");

        if (lvalue == rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");

        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
    },
  })
);

app.set("view engine", ".hbs");

// added the property 'activeRoute' to 'app.locals' whenever the route changes,
//ie: if our route is '/products', the app.locals.activeRoute value will be '/products'
app.use((req, res, next) => {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
  next();
});

app.use(
  clientSessions({
    cookieName: "session",
    secret: "cap805-cto",
    duration: 10 * 60 * 1000,
    activeDuration: 10 * 60 * 1000, //automatic logout time
  })
);

//#region Multer

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./views/images/",
  filename: function (req, file, cb) {
    cb(null, "New" + file.originalname);
  },
});
const upload = multer({ storage: storage });
//#endregion

//#region General Pages
app.get("/", (req, res) => {
  //getting 4 products of tea category and are bestseller
  let teaProducts = "";
  Product.findAll({
    where: {
      category_id: [1, 2, 3],
      bestseller: true,
    },
    limit: 4,
    raw: true,
  })
    .then((data) => {
      teaProducts = data;
      //getting 4 products of coffe category and are bestseller
      return Product.findAll({
        where: {
          category_id: [4, 5],
          bestseller: true,
        },
        limit: 4,
        raw: true,
      });
    })
    .then((data) => {
      res.render("home", {
        layout: false,
        user: req.session.user,
        finalData: {
          teaProducts,
          coffeeProducts: data,
        },
      });
    })
    .catch((err) => {
      console.log(
        "No results returned for product with product ID " + req.params.prodID
      );
      console.log(err);
    });
});

app.get("/about", (req, res) => {
  res.render("about", { layout: false });
});

app.get("/contact", (req, res) => {
  res.render("contact", { user: req.session.user, layout: false });
});

app.get("/register", (req, res) => {
  res.render("registration", { layout: false });
});

app.post("/register", (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const address = req.body.address;
  const email = req.body.email;
  const password = req.body.password;
  const phone_number = req.body.phone_number;

  // synchronize the Database with our models and automatically add the
  // table if it does not exist

  sequelize.sync().then(function () {
    // create a new "User" and add it to the database
    User.create({
      first_name: firstName,
      last_name: lastName,
      address: address,
      email_id: email,
      pass_word: password,
      phone_number: phone_number,
      user_created_on: new Date(),
      user_role: "customer",
    })
      .then(function (User) {
        // you can now access the newly created User via the variable User
        console.log("success!");
      })
      .catch(function (error) {
        console.log("something went wrong!");
        console.log(error);
      });
  });
  res.redirect("/login");
});
/////Added by Pooja
app.get("/shoppingCart", async (req, res) => {
  console.log("sssssssssssssssssss" + req.cookies.productsAddedToCart.length);
  if (req.cookies.productsAddedToCart) {
    console.log("productsAddedToCart", req.cookies.productsAddedToCart);
    const frequency = (product_id) => {
      let count = 0;
      req.cookies.productsAddedToCart.forEach((element) => {
        if (element.product_id == product_id) {
          let qty = parseInt(element.quantity);
          count = count + qty;
        }
      })
      return count;
    }
    var cart = [];
    let flag = true;
    let subtotal = 0;
    for (let i = 0; i < req.cookies.productsAddedToCart.length; i++) {
      let data = await Product.findOne({
        where: {
          product_id: req.cookies.productsAddedToCart[i].product_id
        },
        raw: true,
      })
      if (cart.length == 0) {
        data.count = frequency(data.product_id);
        data.total = (data.count * data.unit_price).toFixed(2);
        subtotal = subtotal + parseFloat(data.total);
        // console.log('aaaaaaaaaa ' + data.product_id + "      " + data.count);
        cart.push(data);

      } else {
        for (let i = 0; i < cart.length; i++) {
          if (data.product_id == cart[i].product_id) {
            flag = false;
            break;
          } else {
            flag = true
          }
        }
        if (flag) {
          data.count = frequency(data.product_id);
          data.total = (data.count * data.unit_price).toFixed(2);
          subtotal = subtotal + parseFloat(data.total);
          //console.log('aaaaaaaaaa' + data.product_id + "      " + data.count);
          cart.push(data);
        }
      }

    }
    res.render("shoppingCart",
      { layout: false, cartData: cart, subtotal: subtotal }
    );

  } else {
    console.log("cart is empty");
  }
});
/////Added by Pooja
app.get("/product/delete/:prodID", async (req, res) => {
  console.log("Product to be deleted+++++++++++" + req.params.prodID);
  console.log("In start " + req.cookies.productsAddedToCart.length);
  if (req.cookies.productsAddedToCart) {
    //console.log("productsAddedToCart", req.cookies.productsAddedToCart);
    const frequency = (product_id) => {
      let count = 0;
      req.cookies.productsAddedToCart.forEach((element) => {
        if (element.product_id == product_id) {
          let qty = parseInt(element.quantity);
          count = count + qty;
        }
      })
      return count;
    }
    var cart = [];
    let flag = true;
    for (let i = 0; i < req.cookies.productsAddedToCart.length; i++) {
      let data = {}
      if (cart.length == 0) {
        data.product_id = req.cookies.productsAddedToCart[i].product_id;
        let quantity = frequency(req.cookies.productsAddedToCart[i].quantity);
        data.quantity = quantity.toString();
        cart.push(data);

      } else {
        for (let j = 0; j < cart.length; j++) {
          if (req.cookies.productsAddedToCart[i].product_id == cart[j].product_id) {
            flag = false;
            break;
          } else {
            flag = true
          }
        }
        if (flag) {
          data.product_id = req.cookies.productsAddedToCart[i].product_id;
          let quantity = frequency(req.cookies.productsAddedToCart[i].quantity);
          data.quantity = quantity.toString();
          cart.push(data);
        }
      }

    }
    console.log("11111111111111111111111 " + cart);
    let updatedCart = []
    cart.forEach((element) => {
      if (element.product_id != req.params.prodID) {
        updatedCart.push(element)
      }
    })
    console.log("11111111111112222222222222 " + updatedCart);
    res.clearCookie('productsAddedToCart');
    console.log("xxxxxxxxxxxxxxxxxxxx11 " + req.cookies.productsAddedToCart);
    res.cookie("productsAddedToCart", updatedCart);

    console.log("bbbbbbbbbbbbbbbbbbb " + req.cookies.productsAddedToCart);
    req.cookies.productsAddedToCart.forEach((element1) => {
      console.log("gggggggggggggggggggggg" + element1.product_id);

    })
  }
  // res.render("shoppingCart",
  //   { layout: false, cartData: req.cookies.productsAddedToCart });
});

app.post("/addToCart", (req, res) => {

  const productToBeAddedToCart = {
    product_id: req.body.product_id,
    quantity: req.body.product_qty,
  };

  let cookieValue = [];
  // get cookie value if already present
  if (req.cookies.productsAddedToCart) {
    cookieValue = req.cookies.productsAddedToCart;
  }
  // push newly product which needs to be added into the cart
  cookieValue.push(productToBeAddedToCart);

  // set cookie
  res.cookie("productsAddedToCart", cookieValue);

  // redirect to shoppingCart page
  res.redirect("/shoppingCart");
});

//#endregion

//#region Authentication
app.get("/login", (req, res) => {
  res.render("login", { user: req.session.user, layout: false });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email == "" || password == "") {
    return res.render("login", {
      errorMsg: "Both fields are required",
      layout: false,
    });
  }

  User.findOne({ where: { email_id: email } }).then((user) => {
    if (!user) {
      // if could not find the email (no user match)
      res.render("login", {
        errorMsg: "Email does not match",
        layout: false,
      });
    } // if could find the email (user exist)
    else {
      // console.log(user.email_id, user.first_name, password, user.pass_word);

      if (password == user.pass_word) {
        //successful login
        let isAdmin = user.user_role == "administrator" ? true : false;
        req.session.user = {
          email: user.email_id,
          firstName: user.first_name,
          lastName: user.last_name,
          address: user.address,
          phone: user.phone_number,
          isAdmin: isAdmin,
        };
        // if the user logged in, redirect to user dashboard
        if (isAdmin) {
          res.redirect("/dashboardAdmin");
        } else {
          res.redirect("/dashboardUser");
        }
      } else {
        res.render("login", {
          errorMsg: "PASSWORD does not match",
          layout: false,
        });
      }
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.clearCookie('productsAddedToCart');
  res.redirect("/");
});

app.get("/forgotpassword", (req, res) => {
  res.render("forgotPassword", { layout: false });
});

//#endregion

//#region AuthorizedUsers
app.get("/dashboardUser", ensureLogin, (req, res) => {
  let teaProducts = "";
  Product.findAll({
    where: {
      category_id: [1, 2, 3],
      bestseller: true,
    },
    limit: 4,
    raw: true,
  })
    .then((data) => {
      teaProducts = data;
      return Product.findAll({
        where: {
          category_id: [4, 5],
          bestseller: true,
        },
        limit: 4,
        raw: true,
      });
    })
    .then((data) => {
      res.render("dashboardUser", {
        layout: false,
        user: req.session.user,
        finalData: {
          teaProducts,
          coffeeProducts: data,
        },
      });
    })
    .catch((err) => {
      console.log("No results returned");
      console.log(err);
    });
});

app.get("/profile", ensureLogin, (req, res) => {
  res.render("profile", { user: req.session.user, layout: false });
});

app.get("/shippingDetail", ensureLogin, (req, res) => {

  User.findOne({
    where: {
      email_id: req.session.user.email
    }
  }).then((data) => {
    const firstName = data.first_name;
    const lastName = data.last_name;
    const address = (data.address);
    var arraylist = address.split(",");

    const address1 = arraylist[0];
    const address2 = arraylist[1];
    const city = arraylist[2];
    const state = arraylist[3];

    let shippingAddress = {
      firstName,
      lastName,
      address1,
      address2,
      city,
      state
    };
    console.log("===========================" + shippingAddress.state);
    res.render("shippingDetail", {
      layout: false,
      data1: shippingAddress
    }
    );
  });
});

app.post("/shippingDetail", ensureLogin, (req, res) => {
  const inputFirstName = req.body.inputFirstName;
  const inputLastName = req.body.inputLastName;
  const inputAddress1 = req.body.inputAddress1;
  const inputAddress2 = req.body.inputAddress2;
  const inputCity = req.body.inputCity;
  const inputState = req.body.inputState;
  const inputZip = req.body.inputZip;
  let address;
  //console.log("22222222222222222222222222  " + inputZip);
  if (inputZip != null) {
    address = inputAddress1 + "," + inputAddress2 + "," + inputCity + "," + inputState + ", " + inputZip;
  }
  else {
    address = inputAddress1 + "," + inputAddress2 + "," + inputCity + "," + inputState;
  }
  User.update({
    address: address
  },
    {
      where: {
        email_id: req.session.user.email
      }
    }).then(data => {

      res.render("checkout", { shippingAddress: address, layout: false });
    });
});

app.get("/orders", (req, res) => {
  res.render("orderHistory", { shippingAddress: shippingAddress, layout: false });
});

app.get("/confirmOrder", (req, res) => {
  res.render("confirmOrder", { layout: false });
});

app.get("/checkout", ensureLogin, (req, res) => {
  res.render("checkout", { layout: false });
});

app.get("/editProfile", ensureLogin, (req, res) => {
  res.render("editProfile", { user: req.session.user, layout: false });
});
app.post("/editProfile", ensureLogin, (req, res) => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const address = req.body.address;
  const phone = req.body.phone;

  req.session.user = {
    //recreate session after editing profile
    email: email,
    firstName: firstName,
    lastName: lastName,
    address: address,
    phone: phone,
  };

  res.redirect("/profile");
});
//#endregion AdminPages

//#region AdminPages
app.get("/createProduct", ensureAdmin, (req, res) => {
  res.render("createProduct", { user: req.session.user, layout: false });
});

const validate = require("./utilities/validateProduct");

app.post("/createProduct", ensureAdmin, upload.single("photo"), (req, res) => {

  if (
    validate.checkPrice(req.body.unit_price) &&
    validate.checkDiscount(req.body.discount) &&
    validate.checkFile(req.file.filename)
  ) {
    sequelize.sync().then(function () {
      Product.create({
        product_name: req.body.product_name,
        description: req.body.description,
        image: "images/" + req.file.filename,
        unit_price: Number(req.body.unit_price),
        quantity_in_stock: parseInt(req.body.quantity),
        category_id: parseInt(req.body.category),
        bestseller: Boolean(req.body.bestseller),
        discount_percentage: Number(req.body.discount),
      })
        .then(function (product) {
          console.log("success!");
        })
        .catch(function (error) {
          console.log("something went wrong!");
          console.log(error);
        });
    });
    res.redirect("/productInDatabase");
  } else {
    let msg1_ = validate.checkPrice(req.body.unit_price)
      ? null
      : "Invalid Price";
    let msg2_ = validate.checkDiscount(req.body.discount)
      ? null
      : "Invalid Discount";
    let msg3_ = validate.checkFile(req.file.filename) ? null : "Invalid Image";
    res.render("createProduct", {
      user: req.session.user,
      data: { msg1: msg1_, msg2: msg2_, msg3: msg3_ },
      layout: false,
    });
  }
});

app.get("/updateProduct", ensureAdmin, (req, res) => {
  res.render("updateProduct", { user: req.session.user, layout: false });
});

app.post("/updateProduct", ensureAdmin, (req, res) => {
  var id_ = Number(req.body.product_id);
  var product = {};
  sequelize.sync().then(function () {
    Product.findOne({
      where: {
        product_id: id_,
      },
      raw: true,
    })
      .then(function (data) {
        product = data;
        Category.findOne({
          attributes: ["category_type"],
          where: {
            category_id: data.category_id,
          },
          raw: true,
        })
          .then(function (data_) {
            let category = data_;
            res.render("updateProduct", {
              user: req.session.user,
              data: { product, category },
              layout: false,
            });
          })
          .catch((err) => {
            console.log("No results returned");
          });
      })
      .catch((err) => {
        console.log("No results returned for product with product ID " + id_);
      });
  });
});

app.post("/update", ensureAdmin, upload.single("photo"), (req, res) => {
  let img = req.file ? "images/" + req.file.filename : req.body.photo;
  if (
    validate.checkPrice(req.body.unit_price) &&
    validate.checkDiscount(req.body.discount)
  ) {
    sequelize
      .sync()
      .then(function () {
        Product.update(
          {
            product_name: req.body.product_name,
            description: req.body.description,
            image: img,
            unit_price: Number(req.body.unit_price),
            quantity_in_stock: parseInt(req.body.quantity),
            category_id: parseInt(req.body.category),
            bestseller: Boolean(req.body.bestseller),
            discount_percentage: Number(req.body.discount),
          },
          {
            where: { product_id: Number(req.body.product_id) },
          }
        ).then(function () {
          console.log("Product is updated successfully");
          res.redirect("/productInDatabase");
        });
      })
      .catch(function (error) {
        console.log("Something went wrong!");
      });
  } else {
    let msg1_ = validate.checkPrice(req.body.unit_price)
      ? null
      : "Invalid Price";
    let msg2_ = validate.checkDiscount(req.body.discount)
      ? null
      : "Invalid Discount";

    var id_ = Number(req.body.product_id);
    var product = {};
    sequelize.sync().then(function () {
      Product.findOne({
        where: {
          product_id: id_,
        },
        raw: true,
      })
        .then(function (data) {
          product = data;
          Category.findOne({
            attributes: ["category_type"],
            where: {
              category_id: data.category_id,
            },
            raw: true,
          })
            .then(function (data_) {
              let category = data_;
              res.render("updateProduct", {
                user: req.session.user,
                data: { product, category, msg1: msg1_, msg2: msg2_ },
                layout: false,
              });
            })
            .catch((err) => {
              console.log("No results returned");
            });
        })
        .catch((err) => {
          console.log("No results returned for product with product ID " + id_);
        });
    });
  }
});

app.get("/deleteProduct", ensureAdmin, (req, res) => {
  res.render("deleteProduct", { user: req.session.user, layout: false });
});
app.get("/dashboardAdmin", ensureAdmin, (req, res) => {
  res.render("dashboardAdmin", { user: req.session.user, layout: false });
});

app.get("/productInDatabase", ensureAdmin, (req, res) => {
  var products = [];
  sequelize.sync().then(function () {
    Product.findAll({
      raw: true,
    })
      .then(function (data) {
        products = data;
        res.render("productInDatabase", {
          user: req.session.user,
          data: products,
          layout: false,
        });
      })
      .catch((err) => {
        console.log("No results returned");
      });
  });
});

//#endregion

//#region Products
const getPagination = (page, size) => {
  const limit = size ? size : 9;
  page--;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: products } = data;
  const currentPage = page ? page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, products, totalPages, currentPage };
};

let sortOptions = [
  {
    id: 1,
    value: "A-Z",
    order: ["product_name", "ASC"],
    active: true,
  },
  {
    id: 2,
    value: "Z-A",
    order: ["product_name", "DESC"],
    active: false,
  },
  {
    id: 3,
    value: "Price, Low to High",
    order: ["unit_price", "ASC"],
    active: false,
  },
  {
    id: 4,
    value: "Price, High to Low",
    order: ["unit_price", "DESC"],
    active: false,
  },
];

const makeAllSortOptionsNonActive = () => {
  sortOptions.forEach((sortOption) => {
    sortOption.active = false;
  });
};

const getProducts = (query) => {
  const { page, size, product_name, sort } = query;
  let condition = product_name
    ? {
      product_name: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("product_name")),
        "LIKE",
        "%" + product_name.toLowerCase() + "%"
      ),
    }
    : null;
  let order = ["product_id", "ASC"];
  if (sort > 1 && sort <= sortOptions.length) {
    order = sortOptions[sort - 1].order;
    makeAllSortOptionsNonActive();
    sortOptions[sort - 1].active = true;
  }

  const { limit, offset } = getPagination(page, size);

  return new Promise((resolve, reject) => {
    Product.findAndCountAll({
      where: condition,
      order: [order],
      limit,
      offset,
      raw: true,
    })
      .then((data) => {
        const response = getPagingData(data, page, limit, sort);
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

app.get("/products", (req, res) => {
  let allProductsResp = "";
  getProducts(req.query)
    .then((data) => {
      allProductsResp = data;
      // console.log(allProductsResp)
      return Category.findAll({ raw: true });
    })
    .then((data) => {
      res.render("productListing", {
        layout: false,
        finalData: {
          allProductsResp,
          allCategories: data,
          sortOptions,
        },
      });
    })
    .catch((err) => {
      console.log("No Products found: " + err);
    });
});

app.get("/products/:prodID", (req, res) => {
  let singleProduct = "";
  Product.findOne({
    where: {
      product_id: req.params.prodID,
    },
    raw: true,
  })
    .then((data) => {
      singleProduct = data;
      return Product.findAll({
        limit: 4,
        raw: true,
      });
    })
    .then((relatedProducts) => {
      res.render("productDetail", {
        layout: false,
        finalData: {
          singleProduct: singleProduct,
          relatedProducts: relatedProducts,
        },
      });
    })
    .catch((err) => {
      console.log(
        "No results returned for product with product ID " + req.params.prodID
      );
      console.log(err);
    });
});

// displaying products with pagination on search page
app.get("/search", (req, res) => {
  const query = req.query;
  const searchText = req.query.searchTerm
    ? req.query.searchTerm
    : req.body.searchTerm;

  if (searchText !== undefined) {
    query.product_name = searchText;
    getProducts(query)
      .then((data) => {
        res.render("productSearch", {
          layout: false,
          finalData: {
            searchText,
            filteredProductsResp: data,
          },
        });
      })
      .catch((err) => {
        console.log("No Products found: " + err);
      });
  } else {
    res.render("productSearch", {
      layout: false,
      finalData: {
        searchText: "",
        filteredProductsResp: [],
      },
    });
  }
});

//#endregion

app.use("*", (req, res) => {
  res.render("pageNotFound", { layout: false });
});

//#region Custom Functions and Startup
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    //if user session does not exist
    res.redirect("/login");
  } else {
    next(); //do whatever you want to do
  }
}

function ensureAdmin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else if (!req.session.user.isAdmin) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.listen(HTTP_PORT, OnHttpStart);
//#endregion
