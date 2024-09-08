/*
InventoryCategory (parent: null)
├── title: "Category"
├── items: [  // Directly associated items with the root category
│   ├── { name: "root-item-1" }
│   ├── { name: "root-item-2" }
│   └── { name: "root-item-3" }
├── subCategories: [  // Subcategories under root category
│   ├── InventoryCategory (parent: "Category")
│   │   ├── title: "sub-category-1"
│   │   ├── items: [  // Items under sub-category-1
│   │   │   ├── { name: "item-1" }
│   │   │   └── { name: "item-2" }
│   │   ├── subCategories: [  // Subcategories under sub-category-1
│   │   │   ├── InventoryCategory (parent: "sub-category-1")
│   │   │   │   ├── title: "sub-category-1-1"
│   │   │   │   ├── items: [  // Items under sub-category-1-1
│   │   │   │   │   ├── { name: "item-1-1" }
│   │   │   │   │   └── { name: "item-2-1" }
│   │   │   └── InventoryCategory (parent: "sub-category-1")
│   │   │       ├── title: "sub-category-1-2"
│   │   │       ├── items: [  // Items under sub-category-1-2
│   │   │       │   └── { name: "item-1-2" }
│   │   │       ]
│   │   ]
│   └── InventoryCategory (parent: "Category")
│       ├── title: "sub-category-2"
│       ├── items: [  // Items under sub-category-2
│       │   └── { name: "item-3" }
│       └── subCategories: []  // No further subcategories under sub-category-2
└── ]
*/

import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/polymorphic").then(() => {
  console.log("connected");
});

// Inventory Category Schema
const inventoryCategorySchema = new mongoose.Schema(
  {
    title: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
inventoryCategorySchema.virtual("items", {
  ref: "InventoryItem",
  localField: "_id",
  foreignField: "category",
});
inventoryCategorySchema.virtual("subCategories", {
  ref: "InventoryCategory",
  localField: "_id",
  foreignField: "parent",
});
const InventoryCategory = mongoose.model(
  "InventoryCategory",
  inventoryCategorySchema
);

// InventoryItem Schema
const inventoryItemSchema = new mongoose.Schema(
  {
    name: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);
const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

const main = async () => {
  // delete all data
  await InventoryCategory.deleteMany({});
  await InventoryItem.deleteMany({});

  // Creating a new InventoryCategory
  const category = new InventoryCategory({ title: "Category" });
  await category.save();

  // create 2 sub-categories under category
  const subCat1 = await InventoryCategory.create({
    title: "sub-category-1",
    parent: category._id,
  });
  const subCat2 = await InventoryCategory.create({
    title: "sub-category-2",
    parent: category._id,
  });

  // Creating 3 items in root category
  InventoryItem.create({
    name: "root-item-1",
    category: category._id,
  });
  InventoryItem.create({
    name: "root-item-2",
    category: category._id,
  });
  InventoryItem.create({
    name: "root-item-3",
    category: category._id,
  });

  // create 3 items under subCategory
  await InventoryItem.create({
    name: "item-1",
    category: subCat1._id,
  });
  await InventoryItem.create({
    name: "item-2",
    category: subCat1._id,
  });
  await InventoryItem.create({
    name: "item-3",
    category: subCat2._id,
  });

  // create 2 category under subCategory1
  const subCat1_1 = await InventoryCategory.create({
    title: "sub-category-1-1",
    parent: subCat1._id,
  });
  const subCat1_2 = await InventoryCategory.create({
    title: "sub-category-1-2",
    parent: subCat1._id,
  });

  // create 2 items under subCat1_1
  await InventoryItem.create({
    name: "item-1-1",
    category: subCat1_1._id,
  });
  await InventoryItem.create({
    name: "item-2-1",
    category: subCat1_1._id,
  });
  // create 2 items under subCat1_2
  await InventoryItem.create({
    name: "item-1-2",
    category: subCat1_2._id,
  });

  // get all categories
  const categories = await InventoryCategory.find({
    parent: { $exists: false },
  })
    .populate("items")
    .populate({
      path: "subCategories",
      populate: { path: "subCategories", populate: { path: "items" } },
    });

  console.log(JSON.stringify(categories, null, 2));
};

main();
