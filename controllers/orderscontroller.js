const nodemailer = require("nodemailer");
const { sequelize } = require("../models"); // Adjust based on your project structure
const { QueryTypes } = require("sequelize");

const transporter = nodemailer.createTransport({
  host: "betsphere.com.ng",
  port: 465,
  secure: true,
  auth: {
    user: "test@betsphere.com.ng",
    pass: "Adegboyega1",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const createOrder = async (req, res) => {
  const {
    firstname,
    lastname,
    address,
    city,
    email,
    phone,
    items,
    amount_paid,
    userid,
  } = req.body;

  console.log(email);

  const paymentstatus = "Paid";
  const deliverystatus = "Pending";
  const payment_mode = "Online";

  try {
    const transporter = nodemailer.createTransport({
      host: "betsphere.com.ng",
      port: 465,
      secure: true,
      auth: {
        user: "test@betsphere.com.ng",
        pass: "Adegboyega1",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const itemTable = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₦ ${Number(item.price).toLocaleString()}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    const infoTable = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
        <tr><th>Full Name</th><td>${firstname} ${lastname}</td></tr>
        <tr><th>Email</th><td>${email}</td></tr>
        <tr><th>Phone</th><td>${phone}</td></tr>
        <tr><th>Address</th><td>${address}</td></tr>
        <tr><th>City</th><td>${city}</td></tr>
        <tr><th>Payment Mode</th><td>${payment_mode}</td></tr>
        <tr><th>Payment Status</th><td>${paymentstatus}</td></tr>
        <tr><th>Delivery Status</th><td>${deliverystatus}</td></tr>
        <tr><th>Amount Paid</th><td>₦ ${Number(
          amount_paid
        ).toLocaleString()}</td></tr>
      </table>
    `;

    const mailOptions = {
      from: '"Luvthypet" <test@betsphere.com.ng>',
      to: email,
      subject: "Order Confirmation - Thank you for your purchase, Luvthypet",
      html: `
        <p>Hello ${firstname},</p>
        <p>We have received your order and it is currently being processed.</p>
        <p>We will notify you via email when your delivery status changes.</p>
        <h4>Payment Status: ${paymentstatus}</h4>
        <h4>Ordered Items:</h4>
        ${itemTable}
        <h4>Your Order Information:</h4>
        ${infoTable}
        <p>Thank you for shopping with us!</p>
        <h1>Luvthypet</h1>
      `,
    };

    // Send email with await, ensuring it is completed before proceeding
    const emailInfo = await transporter.sendMail(mailOptions);
    console.log("Email sent:", emailInfo);

    // Proceed to add the order to the database
    const sql = `
      INSERT INTO orders 
      (firstname, lastname, address, city, email, phone, paymentstatus, deliverystatus, items, payment_mode, amount_paid, userid) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sequelize.query(sql, {
      replacements: [
        firstname,
        lastname,
        address,
        city,
        email,
        phone,
        paymentstatus,
        deliverystatus,
        JSON.stringify(items),
        payment_mode,
        amount_paid,
        userid,
      ],
    });

    // Send success response after both email and order are successfully created
    return res
      .status(200)
      .json({ message: "Order placed and email sent successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = "";
    const replacements = {};

    if (startDate && endDate) {
      whereClause = "WHERE date BETWEEN :startDate AND :endDate";
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    const orders = await sequelize.query(
      `
      SELECT id, firstname, lastname, address, city, email, phone, paymentstatus, deliverystatus, items, payment_mode, amount_paid, userid, date
      FROM orders
      ${whereClause}
      ORDER BY date DESC
    `,
      {
        type: QueryTypes.SELECT,
        replacements,
      }
    );

    res.status(200).json(orders); // Returns array directly
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ message: "Failed to get orders", error });
  }
};

const getOrdersByUser = async (req, res) => {
  const { userid } = req.params;
  try {
    const [orders] = await sequelize.query(
      `
      SELECT id, firstname, lastname, address, city, email, phone, paymentstatus, deliverystatus, items, payment_mode, amount_paid, userid, date
      FROM orders
      WHERE userid = ?
    `,
      { replacements: [userid] }
    );
    res.status(200).json({ orders });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Failed to get user orders", error });
  }
};

const markAsDelivered = async (req, res) => {
  const { id } = req.params;
  try {
    const [orderResult] = await sequelize.query(
      `SELECT * FROM orders WHERE id = ?`,
      { replacements: [id] }
    );

    const order = orderResult[0];
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await sequelize.query(
      `UPDATE orders SET deliverystatus = 'delivered' WHERE id = ?`,
      { replacements: [id] }
    );

    await transporter.sendMail({
      from: '"Luvthypet" <test@betsphere.com.ng>', // ✅ Use a valid email
      to: order.email,
      subject: "Your Order Has Been Delivered",
      html: `
        <h2>Hi ${order.firstname},</h2>
        <p>Your order with ID <b>${order.id}</b> has been marked as <b>Delivered</b>.</p>
        <p>Thank you for shopping with us, Luvthypet!</p>
      `,
    });

    res
      .status(200)
      .json({ message: "Order marked as delivered and email sent" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to mark order as delivered", error });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  markAsDelivered,
};
