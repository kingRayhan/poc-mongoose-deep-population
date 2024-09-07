/**
InventoryCategory
├── title: "Electronics"
├── items: [  // Directly associated items with InventoryCategory
│   ├── { name: "Smartphone" }
│   └── { name: "Tablet" }
├── subCategories: [  // Subcategories related to InventoryCategory
│   ├── InventorySubCategory
│   │   ├── title: "Laptops"
│   │   ├── parent: "InventoryCategory" (ref to Electronics)
│   │   └── items: [  // Items related to this SubCategory
│   │       ├── { name: "MacBook Pro" }
│   │       └── { name: "Dell XPS" }
│   │   ]
│   └── InventorySubCategory
│       ├── title: "Smartphones"
│       ├── parent: "InventoryCategory" (ref to Electronics)
│       └── items: [
│           ├── { name: "iPhone 14" }
│           └── { name: "Samsung Galaxy S23" }
│       ]
└── ]
*/

import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/polymorphic").then(() => {
  console.log("connected");
});

// Inventory Category Schema
const inventoryCategorySchema = new mongoose.Schema(
  { title: String },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
inventoryCategorySchema.virtual("subCategories", {
  ref: "InventorySubCategory",
  localField: "_id",
  foreignField: "parent",
});
inventoryCategorySchema.virtual("items", {
  ref: "InventoryItem",
  localField: "_id",
  foreignField: "category",
});
const InventoryCategory = mongoose.model(
  "InventoryCategory",
  inventoryCategorySchema
);
const InventorySubCategorySchema = new mongoose.Schema(
  {
    title: String,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryCategory",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: false,
  }
);
InventorySubCategorySchema.virtual("items", {
  ref: "InventoryItem",
  localField: "_id",
  foreignField: "category",
});
const InventorySubCategory = mongoose.model(
  "InventorySubCategory",
  InventorySubCategorySchema
);

// InventoryItem Schema
const inventoryItemSchema = new mongoose.Schema(
  {
    name: String,
    categoryType: {
      type: String,
      required: true,
      enum: ["InventoryCategory", "InventorySubCategory"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "categoryType", // Dynamically reference either InventoryCategory or InventorySubCategory
      required: true,
    },
  },
  { timestamps: true }
);
const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

const main = async () => {
  // delete all data
  await InventoryCategory.deleteMany({});
  await InventorySubCategory.deleteMany({});
  await InventoryItem.deleteMany({});

  // Creating a new InventoryCategory
  const category = new InventoryCategory({ title: "Category" });
  await category.save();

  // Creating a new InventorySubCategory
  const subCategory = new InventorySubCategory({
    title: "sub-category-1",
    parent: category._id,
  });
  await subCategory.save();

  // Creating a new InventoryItem
  InventoryItem.create({
    name: "root-item-1",
    categoryType: "InventoryCategory",
    category: category._id,
  });
  InventoryItem.create({
    name: "root-item-2",
    categoryType: "InventoryCategory",
    category: category._id,
  });
  InventoryItem.create({
    name: "root-item-3",
    categoryType: "InventoryCategory",
    category: category._id,
  });

  // create 2 items under subCategory
  InventoryItem.create({
    name: "item-1",
    categoryType: "InventorySubCategory",
    category: subCategory._id,
  });
  InventoryItem.create({
    name: "item-2",
    categoryType: "InventorySubCategory",
    category: subCategory._id,
  });

  // get all categories
  const categories = await InventoryCategory.find()
    .populate("items")
    .populate({
      path: "subCategories",
      populate: { path: "items" },
    });
  console.log(JSON.stringify(categories, null, 2));
};

main();
