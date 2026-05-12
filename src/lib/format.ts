// NPR currency formatting. All "price" numbers in MOVIES are now NPR.
export const npr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-IN")}`;
