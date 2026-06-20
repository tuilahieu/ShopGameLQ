import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    ten_web: DataTypes.STRING(255),
    logo: DataTypes.TEXT,
    favicon: DataTypes.TEXT,
    banner: DataTypes.TEXT,
    background: DataTypes.TEXT,

    fb_admin: DataTypes.STRING(255),
    sdt_admin: DataTypes.STRING(50),
    email: DataTypes.STRING(255),

    sepay_secret: DataTypes.TEXT,

    ck_ctv: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    thongbao: DataTypes.TEXT("long"),
    js_web: DataTypes.TEXT("long"),
  },
  {
    tableName: "setting",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
