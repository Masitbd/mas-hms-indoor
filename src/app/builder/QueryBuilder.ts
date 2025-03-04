import mongoose, { FilterQuery, Query } from "mongoose";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm && searchTerm.trim() !== "") {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: "i" },
            } as FilterQuery<T>)
        ),
      });
    }
    return this;
  }

  filter(): this {
    const queryObj = { ...this.query };

    const excludeFields = ["searchTerm", "page", "limit", "sort", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    if (queryObj.courseFilter) {
      const courseFilter = queryObj.courseFilter;

      delete queryObj.courseFilter;

      if (mongoose.Types.ObjectId.isValid(courseFilter as string)) {
        queryObj["courses.course"] = new mongoose.Types.ObjectId(
          courseFilter as string
        );
      } else if (Array.isArray(courseFilter)) {
        queryObj["courses.course"] = {
          $in: courseFilter
            .filter((id): id is string => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id)),
        };
      }
    }

    this.modelQuery = this.modelQuery.find(queryObj as mongoose.FilterQuery<T>);
    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort as string);
    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 100;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(",")?.join(" ") || "-__v";

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  async countTotal(): Promise<PaginationMeta> {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 100;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
