import { sequelize } from "./src/config/database.js";
import { GameAccount, User } from "./src/models/index.js";

async function test() {
  try {
    await sequelize.authenticate();
    const res = await GameAccount.findAndCountAll({
      limit: 20,
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["id", "username", "level"],
        },
        {
          model: User,
          as: "seller",
          attributes: ["id", "username", "level"],
        }
      ]
    });
    console.log("SUCCESS:", res.count);
  } catch (e) {
    console.error("ERROR:", e);
  }
  process.exit(0);
}

test();
