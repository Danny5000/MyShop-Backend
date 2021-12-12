class APIFilters {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    //Removing fields from the query
    const removeFields = ["sort", "fields", "q", "limit", "page"];
    removeFields.forEach((el) => delete queryCopy[el]);

    //Advanced filer using lt, lte, gt, gte
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  searchByQuery() {
    if (this.queryStr.q) {
      const qu = this.queryStr.q.split("-").join(" ");
      //Query the DB using a regex containing the query string
      this.query = this.query.find({
        name: { $regex: `\\b${qu}.*\\b`, $options: "i" },
      });
    }
    return this;
  }

  pagination() {
    //What is the page #? Default is page 1
    const page = parseInt(this.queryStr.page, 10) || 1;
    //What are the contents per page? Default is 10
    const limit = parseInt(this.queryStr.limit, 10) || 10;
    const skipResults = (page - 1) * limit;

    this.query = this.query.skip(skipResults).limit(limit);

    return this;
  }
}

module.exports = APIFilters;
