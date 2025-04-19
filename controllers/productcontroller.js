const { sequelize } = require("../models"); // Adjust path to your sequelize instance
const cloudinary = require("cloudinary").v2;
const { QueryTypes } = require("sequelize");

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await sequelize.query(
      "INSERT INTO productcategories (name) VALUES (:name)",
      {
        replacements: { name },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    res.status(201).json({ message: "Category added successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Failed to add category", error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query("DELETE FROM productcategories WHERE id = :id", {
      replacements: { id },
      type: sequelize.QueryTypes.DELETE,
    });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category", error });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const [categories] = await sequelize.query(
      "SELECT id, name FROM productcategories WHERE 1"
    );
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    const cloudinaryResponse = await cloudinary.uploader.upload(image, {
      folder: "products",
    });

    await sequelize.query(
      `INSERT INTO products (name, description, price, image, available, category) VALUES (?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          name,
          description,
          price,
          cloudinaryResponse.secure_url,
          "available",
          category,
        ],
        type: QueryTypes.INSERT,
      }
    );

    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating product" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await sequelize.query(
      `SELECT id, name, description, price, image, available, category FROM products`,
      { type: QueryTypes.SELECT }
    );

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await sequelize.query(
      `SELECT image FROM products WHERE id = ?`,
      { replacements: [id], type: QueryTypes.SELECT }
    );

    if (product[0] && product[0].image) {
      const publicId = product[0].image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await sequelize.query(`DELETE FROM products WHERE id = ?`, {
      replacements: [id],
      type: QueryTypes.DELETE,
    });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await sequelize.query(`UPDATE products SET available = ? WHERE id = ?`, {
      replacements: [status, id],
      type: QueryTypes.UPDATE,
    });

    res.status(200).json({ message: "Product status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product status" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, available, category } = req.body;

    let updatedImageUrl = null;

    if (image) {
      const product = await sequelize.query(
        `SELECT image FROM products WHERE id = ?`,
        {
          replacements: [id],
          type: QueryTypes.SELECT,
        }
      );

      if (product[0]?.image) {
        const publicId = product[0].image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      const cloudinaryRes = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
      updatedImageUrl = cloudinaryRes.secure_url;
    }

    await sequelize.query(
      `UPDATE products SET name = ?, description = ?, price = ?, image = ?, available = ?, category = ? WHERE id = ?`,
      {
        replacements: [
          name,
          description,
          price,
          updatedImageUrl || null,
          available,
          category,
          id,
        ],
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product" });
  }
};

module.exports = {
  addCategory,
  deleteCategory,
  getAllCategories,
  createProduct,
  getAllProducts,
  deleteProduct,
  updateProductStatus,
  updateProduct,
};
