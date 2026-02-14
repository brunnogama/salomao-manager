try {
    const str = "some string";
    // @ts-ignore
    str.map(s => s);
} catch (e) {
    console.log("String map error:", e.message);
}

try {
    const obj = { key: "value" };
    // @ts-ignore
    obj.map(s => s);
} catch (e) {
    console.log("Object map error:", e.message);
}

try {
    const num = 123;
    // @ts-ignore
    num.map(s => s);
} catch (e) {
    console.log("Number map error:", e.message);
}

try {
    const n = null;
    // @ts-ignore
    n.map(s => s);
} catch (e) {
    console.log("Null map error:", e.message);
}

try {
    const u = undefined;
    // @ts-ignore
    u.map(s => s);
} catch (e) {
    console.log("Undefined map error:", e.message);
}
