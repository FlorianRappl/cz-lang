import { tokenize, parse, interpret } from "./index";

describe("Tokenizer", () => {
  it("Can identify a number with a single digit", () => {
    const result = tokenize("2");

    expect(result).toEqual([
      {
        payload: "2",
        position: 0,
        type: "number",
      },
    ]);
  });

  it("Can identify a non-integer number", () => {
    const result = tokenize("2,4");

    expect(result).toEqual([
      {
        payload: "2,4",
        position: 0,
        type: "number",
      },
    ]);
  });

  it("Can identify a number with multiple digits", () => {
    const result = tokenize("234");

    expect(result).toEqual([
      {
        payload: "234",
        position: 0,
        type: "number",
      },
    ]);
  });

  it("Can identify the + operator", () => {
    const result = tokenize("+");

    expect(result).toEqual([
      {
        payload: "+",
        position: 0,
        type: "operator",
      },
    ]);
  });

  it("Can tokenize the 2+13 expression", () => {
    const result = tokenize("2+13");

    expect(result).toEqual([
      {
        payload: "2",
        position: 0,
        type: "number",
      },
      {
        payload: "+",
        position: 1,
        type: "operator",
      },
      {
        payload: "13",
        position: 2,
        type: "number",
      },
    ]);
  });

  it("Can tokenize the 132 + 134 expression", () => {
    const result = tokenize("132 + 134");

    expect(result).toEqual([
      {
        payload: "132",
        position: 0,
        type: "number",
      },
      {
        payload: "+",
        position: 4,
        type: "operator",
      },
      {
        payload: "134",
        position: 6,
        type: "number",
      },
    ]);
  });
});

describe("Parser", () => {
  it("Can parse a single number", () => {
    const result = parse("23");
    expect(result).toEqual({
      type: "number",
      value: 23,
    });
  });

  it("Can parse a simple addition", () => {
    const result = parse("23+17");
    expect(result).toEqual({
      type: "add",
      left: { type: "number", value: 23 },
      right: { type: "number", value: 17 },
    });
  });

  it("Can parse a simple addition with floating point numbers", () => {
    const result = parse("23,2+17,4");
    expect(result).toEqual({
      type: "add",
      left: { type: "number", value: 23.2 },
      right: { type: "number", value: 17.4 },
    });
  });
});

describe("Interpreter", () => {
  it("Can eval a single number", () => {
    const result = interpret("23");
    expect(result).toEqual(23);
  });

  it("Can eval a simple addition", () => {
    const result = interpret("23+17");
    expect(result).toEqual(40);
  });

  it("Can eval a simple multiplication", () => {
    const result = interpret("2*6");
    expect(result).toEqual(12);
  });

  it("Can eval multiple additions", () => {
    const result = interpret("23+17+5+9+11");
    expect(result).toEqual(65);
  });

  it("Can eval multiple multiplications", () => {
    const result = interpret("2*3*3");
    expect(result).toEqual(18);
  });

  it("Can eval addition and multiplication (1)", () => {
    const result = interpret("2+3*4");
    expect(result).toEqual(14);
  });

  it("Can eval addition and multiplication (2)", () => {
    const result = interpret("1+2*3");
    expect(result).toEqual(7);
  });

  it("Can eval addition and multiplication (3)", () => {
    const result = interpret("1*2+3");
    expect(result).toEqual(5);
  });

  it("Can eval addition and power", () => {
    const result = interpret("1+2^3");
    expect(result).toEqual(9);
  });

  it("Can eval addition and power in reverse", () => {
    const result = interpret("1^2+3");
    expect(result).toEqual(4);
  });

  it("Can eval a simple power", () => {
    const result = interpret("2^10");
    expect(result).toEqual(1024);
  });

  it("Can eval addition and multiplication with floats", () => {
    const result = interpret("1,1+2*3,5");
    expect(result).toEqual(8.1);
  });
});
