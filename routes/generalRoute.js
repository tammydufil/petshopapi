const {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  markAsDelivered,
  getUserOrderStats,
} = require("../controllers/orderscontroller");
const {
  addCategory,
  deleteCategory,
  getAllCategories,
  createProduct,
  getAllProducts,
  deleteProduct,
  updateProductStatus,
  updateProduct,
} = require("../controllers/productcontroller");
const {
  login,
  register,
  validateAdmin,
  getAllUsers,
  deleteUser,
  makeUserAdmin,
} = require("../controllers/usercontroller");

const router = require("express").Router();

// user Routes
router.post("/login", login);
router.post("/register", register);
router.get("/validateAdmin", validateAdmin);
router.put("/makeAdmin/:userId", makeUserAdmin);

router.get("/getAllUsers", getAllUsers);
router.delete("/deleteUser/:id", deleteUser);

// user Routes End

//Product Category controllers
router.post("/addCategory", addCategory);
router.delete("/deleteCategory/:id", deleteCategory);
router.get("/getAllCategories", getAllCategories);
// Product Category controllers end

// Productcontrollers
router.post("/createProduct", createProduct);
router.get("/getAllProducts", getAllProducts);
router.delete("/deleteProduct/:id", deleteProduct);
router.put("/updateProductStatus/:id", updateProductStatus);
router.put("/updateProduct/:id", updateProduct);
// Product controllers end

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "ngn",
      payment_method_types: ["card", "link"], // Apple Pay, Link and Card as supported methods
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error); // Log the error for troubleshooting
    res.status(500).json({ error: error.message });
  }
});

// Node.js (Express)
router.post("/create-checkout-session", async (req, res) => {
  const { cart, customerDetails } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "pay_by_bank", "paypal", "amazon_pay"], // Keep card for general payments

    mode: "payment",
    line_items: cart.map((item) => ({
      price_data: {
        currency: "ngn",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    })),
    customer_email: customerDetails.email,
    success_url: "http://localhost:5173/postcheckout",
    cancel_url: "http://localhost:5173/checkout",
  });

  res.json({ url: session.url });
});

router.post("/createOrder", createOrder);

router.get("/getOrders", getAllOrders);
router.get("/orders/user/:userid", getOrdersByUser);
router.put("/orders/:id/delivered", markAsDelivered);
router.put("/orders/:id/delivered", markAsDelivered);
router.get("/user/:userid/stats", getUserOrderStats);

module.exports = router;
