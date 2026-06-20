import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const GameAccount = sequelize.define(
  "GameAccount",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    loai_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    buyer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    thong_tin: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    list_thong_tin: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    img: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    list_img: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    login: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    gia: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    ck: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    ngaymua: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "list_acc_game",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
