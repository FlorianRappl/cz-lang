// Stream von Zeichen ["2", "+", "3"]
// "2+13"
//  ^    Zahl: "2"
//   ^   Operator: "+"
//    ^^ Zahl: "13"
// 1. Stufe: Stream von Tokens [Number(2), Operator(+), Number(13)]
// ( ) + ( )  -- Add expression
// ^ 2        -- Number expression
//       ^ 13 -- Number expression
// 2. Stufe: Tree von Expressions / Statements
//
// 3. Stufe: Stream von Instruktionen zum Ausführen

class Walker<T> {
  public position: number;

  constructor(public source: ArrayLike<T>) {
    this.position = 0;
  }

  public get first() {
    return this.source[0];
  }

  public get last() {
    return this.source[this.source.length - 1];
  }

  public get current() {
    return this.source[this.position];
  }

  public get open() {
    return !this.end;
  }

  public get end() {
    return this.current === undefined;
  }

  public forward() {
    return this.source[++this.position];
  }

  public back() {
    return this.source[--this.position];
  }
}

class SourceWalker extends Walker<string> {}

class TokenWalker extends Walker<Token> {}

function isSpaceCharacter(c: string) {
  return c === " " || c === "\t" || c === "\n";
}

function isNumberCharacter(c: string) {
  if (c !== undefined) {
    const code = c.charCodeAt(0);
    return code >= 48 && code <= 57;
  }

  return false;
}

const operators = ["+", "-", "*", "/", "^"];

function isOperator(c: string) {
  return operators.includes(c);
}

function isParentheses(c: string) {
  return c === "(" || c === ")";
}

interface Token {
  payload: string;
  position: number;
  type: "number" | "operator" | "parentheses";
}

export function tokenize(source: string) {
  const sourceWalker = new SourceWalker(source);
  const tokens: Array<Token> = [];

  while (sourceWalker.open) {
    const currentCharacter = sourceWalker.current;

    if (isSpaceCharacter(currentCharacter)) {
      // empty on purpose for now
    } else if (isNumberCharacter(currentCharacter)) {
      const buffer: Array<string> = [];
      const position = sourceWalker.position;

      do {
        buffer.push(sourceWalker.current);
      } while (isNumberCharacter(sourceWalker.forward()));

      if (sourceWalker.current === ",") {
        if (!isNumberCharacter(sourceWalker.forward())) {
          sourceWalker.back();
        } else {
          buffer.push(",");

          do {
            buffer.push(sourceWalker.current);
          } while (isNumberCharacter(sourceWalker.forward()));
        }
      }

      tokens.push({
        payload: buffer.join(""),
        type: "number",
        position,
      });

      continue;
    } else if (isOperator(currentCharacter)) {
      tokens.push({
        payload: currentCharacter,
        type: "operator",
        position: sourceWalker.position,
      });
    } else if (isParentheses(currentCharacter)) {
      tokens.push({
        payload: currentCharacter,
        type: "parentheses",
        position: sourceWalker.position,
      });
    }

    sourceWalker.forward();
  }

  return tokens;
}

interface ParenthesesExpression {
  content: Expression;
  type: "parentheses";
}

interface NumberExpression {
  value: number;
  type: "number";
}

interface AddExpression {
  left: Expression;
  right: Expression;
  type: "add";
}

interface SubExpression {
  left: Expression;
  right: Expression;
  type: "sub";
}

interface MulExpression {
  left: Expression;
  right: Expression;
  type: "mul";
}

interface DivExpression {
  left: Expression;
  right: Expression;
  type: "div";
}

interface PowExpression {
  left: Expression;
  right: Expression;
  type: "pow";
}

type Expression =
  | AddExpression
  | MulExpression
  | SubExpression
  | DivExpression
  | PowExpression
  | NumberExpression
  | ParenthesesExpression;

export function parse(source: string) {
  const tokens = tokenize(source);
  const tokenWalker = new TokenWalker(tokens);
  const ast = parseExpression(tokenWalker);
  return ast;
}

export function parseExpression(tokenWalker: TokenWalker): Expression {
  return parseAdditive(tokenWalker);
}

export function parseAdditive(tokenWalker: TokenWalker): Expression {
  const left = parseMultiplication(tokenWalker);
  const current = tokenWalker.current;

  if (
    current?.type === "operator" &&
    (current.payload === "+" || current.payload === "-")
  ) {
    tokenWalker.forward();

    const right = parseAdditive(tokenWalker);

    return {
      left,
      right,
      type: current.payload === "+" ? "add" : "sub",
    };
  }

  return left;
}

export function parseMultiplication(tokenWalker: TokenWalker): Expression {
  const left = parsePower(tokenWalker);
  const current = tokenWalker.current;

  if (
    current?.type === "operator" &&
    (current.payload === "*" || current.payload === "/")
  ) {
    tokenWalker.forward();

    const right = parseMultiplication(tokenWalker);

    return {
      left,
      right,
      type: current.payload === "*" ? "mul" : "div",
    };
  }

  return left;
}

export function parsePower(tokenWalker: TokenWalker): Expression {
  const left = parseAtomic(tokenWalker);
  const current = tokenWalker.current;

  if (current?.type === "operator" && current.payload === "^") {
    tokenWalker.forward();

    const right = parsePower(tokenWalker);

    return {
      left,
      right,
      type: "pow",
    };
  }

  return left;
}

export function parseAtomic(tokenWalker: TokenWalker): Expression {
  const currentToken = tokenWalker.current;

  if (currentToken?.type === "number") {
    tokenWalker.forward();
    return {
      type: "number",
      value: Number(currentToken.payload.replace(",", ".")),
    };
  } else if (currentToken?.type === "parentheses") {
    if (currentToken.payload === "(") {
      tokenWalker.forward();
      const content = parseExpression(tokenWalker);

      if (
        tokenWalker.current?.type !== "parentheses" ||
        tokenWalker.current?.payload !== ")"
      ) {
        throw new Error(`Imbalanced brackets at position ${tokenWalker.current?.position ?? tokenWalker.last.position} detected!`);
      }

      tokenWalker.forward();

      return {
        type: "parentheses",
        content,
      };
    }
  }

  throw new Error(`Expected <number> found <${currentToken ?? "(empty)"}>.`);
}

export function interpret(source: string) {
  const expr = parse(source);

  return evalExpr(expr);
}

function evalExpr(expr: Expression) {
  switch (expr.type) {
    case "number":
      return expr.value;
    case "add":
      return evalExpr(expr.left) + evalExpr(expr.right);
    case "mul":
      return evalExpr(expr.left) * evalExpr(expr.right);
    case "div":
      return evalExpr(expr.left) / evalExpr(expr.right);
    case "sub":
      return evalExpr(expr.left) - evalExpr(expr.right);
    case "pow":
      return Math.pow(evalExpr(expr.left), evalExpr(expr.right));
    case "parentheses":
      return evalExpr(expr.content);
    default:
      // @ts-ignore
      throw new Error(`Unexpected expression <${expr.type}> detected`);
  }
}
