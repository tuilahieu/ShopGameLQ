import { recommendAccounts } from "../services/shop-assistant.service.js";

export const ASSISTANT_TOOLS = Object.freeze([{
  name: "search_accounts",
  description: "Tìm tài khoản Liên Quân đang bán theo giá và khuyến mãi. Trả tối đa 4 thẻ có link chi tiết.",
  parameters: {
    type: "object",
    properties: {
      budget: { type: "integer", description: "Giá mong muốn tính bằng VND; bỏ qua nếu khách chưa nói giá" },
      underBudget: { type: "boolean", description: "Chỉ chọn acc có giá không vượt ngân sách" },
      saleOnly: { type: "boolean", description: "Chỉ chọn acc đang giảm giá" },
    },
  },
}]);

export async function executeAssistantTool(name, args = {}) {
  if (name !== "search_accounts") throw new Error("Unknown assistant tool");
  const budget = Number.isSafeInteger(args.budget) && args.budget >= 10_000 && args.budget <= 100_000_000
    ? args.budget : null;
  return recommendAccounts({
    budget,
    underBudget: args.underBudget === true,
    saleOnly: args.saleOnly === true,
  });
}
