const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer.js");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const obj = {
      title: req.fields.title,
      description: req.fields.description,
      price: req.fields.price,
      creator: req.user
    };
    const offer = new Offer(obj);
    await offer.save();

    res.json({
      _id: offer._id,
      title: offer.title,
      description: offer.description,
      price: offer.price,
      created: offer.created,
      creator: {
        account: offer.creator.account,
        _id: offer.creator._id
      }
    });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// fonction qui va construire un objet de filtres, que l'on enverra ensuite dans le find()
const createFilters = req => {
  const filters = {};
  if (req.query.priceMin) {
    filters.price = {};
    filters.price.$gte = req.query.priceMin;
  }
  if (req.query.priceMax) {
    if (filters.price === undefined) {
      filters.price = {};
    }
    filters.price.$lte = req.query.priceMax;
  }

  if (req.query.title) {
    filters.title = new RegExp(req.query.title, "i");
  }
  return filters;
};

router.get("/offer/with-count", async (req, res) => {
  try {
    const filters = createFilters(req);
    const search = Offer.find(filters);

    if (req.query.sort === "price-asc") {
      // Ici, nous continuons de construire notre recherche
      search.sort({ price: 1 });
    } else if (req.query.sort === "price-desc") {
      // Ici, nous continuons de construire notre recherche
      search.sort({ price: -1 });
    }
    // limit : le nombre de résultats affichés
    // skip : Ignorer les X premiers
    if (req.query.page) {
      const page = req.query.page;
      const limit = 4;
      search.limit(limit).skip(limit * (page - 1));
    }
    const offers = await search.populate({
      path: "creator",
      select: "account"
    });
    res.json({ count: offers.length, offers: offers });
  } catch (error) {
    res.json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.find({ _id: id }).populate({
      path: "creator",
      select: "account"
    });
    res.json(offer);
  } catch (error) {
    res.json({ message: error.message });
  }
});

module.exports = router;
