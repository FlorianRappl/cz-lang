import { interpret } from "./index";

const input = process.argv.pop();

if (!input) {
  console.error("No input specified!");
  process.exit(1);
}

try {
  console.log(interpret(input));
} catch (ex) {
  const message = ex.message;
  const [, pos] = /position (\d+)/.exec(message) || [];
  console.log(input);

  if (typeof pos === "string") {
    console.log(new Array(1 + +pos).join(" ") + "^");
  }

  console.error(message);
  process.exit(1);
}
