/**
 * Represents a type of bug that can be introduced into code.
 */
export interface BugType {
  /** Unique identifier for this bug type */
  id: string;
  /** Category grouping for the bug */
  category: string;
  /** Human-readable name */
  name: string;
  /** Description of how to implement this bug */
  description: string;
  /** Code examples showing how to implement */
  examples: string[];
  /** Sample symptom description from a tester's perspective */
  sampleSymptom: string;
}

/**
 * Comprehensive list of bug types that can be introduced into code.
 * Each bug type has examples and descriptions to guide the AI.
 */
export const BUG_TYPES: BugType[] = [
  // === STRING/TEXT CORRUPTION ===
  {
    id: "string-reverse",
    category: "STRING_CORRUPTION",
    name: "Reverse String Order",
    description: "Reverse the characters in a string using split('').reverse().join('')",
    examples: [
      "user.name.split('').reverse().join('')",
      "title.split('').reverse().join('')",
    ],
    sampleSymptom: "In the user profile: All names appear backwards. 'John Smith' shows as 'htimS nhoJ'.",
  },
  {
    id: "string-uppercase",
    category: "STRING_CORRUPTION",
    name: "Force Uppercase/Lowercase",
    description: "Convert entire strings to uppercase or lowercase when they should preserve case",
    examples: [
      "user.name.toUpperCase()",
      "description.toLowerCase()",
    ],
    sampleSymptom: "On the product page: All product names are in ALL CAPS when they should be normal case.",
  },
  {
    id: "string-remove-spaces",
    category: "STRING_CORRUPTION",
    name: "Remove All Spaces",
    description: "Remove all spaces from strings using replace or split/join",
    examples: [
      "text.replace(/ /g, '')",
      "sentence.split(' ').join('')",
    ],
    sampleSymptom: "In the description field: All text runs together with no spaces. 'Hello World' shows as 'HelloWorld'.",
  },
  {
    id: "string-slice-start",
    category: "STRING_CORRUPTION",
    name: "Slice Off First Characters",
    description: "Use .slice(1) or .slice(2) to cut off the beginning of strings",
    examples: [
      "name.slice(1)",
      "title.slice(2)",
    ],
    sampleSymptom: "In the search bar: The first letter of every search is being cut off. Typing 'Apple' searches for 'pple'.",
  },
  {
    id: "string-slice-end",
    category: "STRING_CORRUPTION",
    name: "Slice Off Last Characters",
    description: "Use .slice(0, -2) or .slice(0, -3) to cut off the end of strings",
    examples: [
      "label.slice(0, -2)",
      "text.slice(0, -3)",
    ],
    sampleSymptom: "In the labels: The last few characters are cut off. 'Description' shows as 'Descript'.",
  },
  {
    id: "string-wrong-encoding",
    category: "STRING_CORRUPTION",
    name: "Wrong Encoding/Decoding",
    description: "Apply encodeURIComponent or escape when it shouldn't be applied",
    examples: [
      "encodeURIComponent(user.name)",
      "escape(title)",
    ],
    sampleSymptom: "On the display: Text shows weird encoding. 'Hello World' shows as 'Hello%20World'.",
  },
  {
    id: "string-wrong-concat",
    category: "STRING_CORRUPTION",
    name: "Wrong String Concatenation",
    description: "Concatenate strings in wrong order or with wrong separator",
    examples: [
      "`${lastName} ${firstName}` instead of `${firstName} ${lastName}`",
      "parts.join('-') instead of parts.join(' ')",
    ],
    sampleSymptom: "On the user card: Names appear as 'Smith John' instead of 'John Smith'.",
  },

  // === DATA DISAPPEARING ===
  {
    id: "array-slice-end",
    category: "DATA_DISAPPEARING",
    name: "Slice Off Last Items",
    description: "Use .slice(0, -2) before .map() to hide the last few items",
    examples: [
      "items.slice(0, -2).map(...)",
      "data.slice(0, -3).forEach(...)",
    ],
    sampleSymptom: "On the product list: The last 2 items are completely missing. We have 10 products but only 8 show up.",
  },
  {
    id: "array-filter-half",
    category: "DATA_DISAPPEARING",
    name: "Filter Out Half Items",
    description: "Add a filter that only shows every other item using index modulo",
    examples: [
      ".filter((_, i) => i % 2 === 0)",
      ".filter((item, idx) => idx % 2 !== 0)",
    ],
    sampleSymptom: "In the item grid: Half the items are completely blank. Every other card shows as empty.",
  },
  {
    id: "array-return-empty",
    category: "DATA_DISAPPEARING",
    name: "Return Empty Array",
    description: "Return an empty array [] before or instead of the actual data",
    examples: [
      "return []; // items.map(...)",
      "if (true) return [];",
    ],
    sampleSymptom: "On the dashboard: The list is completely empty even though we have data in the database.",
  },
  {
    id: "array-wrong-filter",
    category: "DATA_DISAPPEARING",
    name: "Always-False Filter Condition",
    description: "Use a filter condition that's always false, removing all items",
    examples: [
      ".filter(item => item.id !== item.id)",
      ".filter(() => false)",
    ],
    sampleSymptom: "On the page: All items have disappeared. The list that should have 50 items shows nothing.",
  },
  {
    id: "destructure-wrong",
    category: "DATA_DISAPPEARING",
    name: "Wrong Destructuring",
    description: "Destructure with wrong property names causing data to be undefined",
    examples: [
      "const { nme, emial } = user; // typos",
      "const { data: items } = response; // wrong property",
    ],
    sampleSymptom: "On the form: All the pre-filled values are missing. Fields that should have user data are empty.",
  },

  // === ALL ITEMS SAME VALUE ===
  {
    id: "same-id-all",
    category: "SAME_VALUE",
    name: "Use First Item's ID For All",
    description: "Inside a map, use array[0].id instead of item.id for all items",
    examples: [
      "items.map(item => ({ ...item, id: items[0].id }))",
      "data.map(() => ({ id: data[0].id }))",
    ],
    sampleSymptom: "In the user cards: Every single card shows the same ID (#1001). All 50 users display the same ID.",
  },
  {
    id: "same-text-all",
    category: "SAME_VALUE",
    name: "Use First Item's Text For All",
    description: "Use the first item's text/name for all items in a list",
    examples: [
      "items.map(() => items[0].name)",
      "data.map(item => ({ ...item, title: data[0].title }))",
    ],
    sampleSymptom: "When viewing comments: Every comment shows the exact same text - the first comment's text is repeated for all.",
  },
  {
    id: "cache-outside-loop",
    category: "SAME_VALUE",
    name: "Cache Value Outside Loop",
    description: "Store a value outside a loop and reuse it for all iterations",
    examples: [
      "const name = items[0].name; items.map(item => ({ ...item, name }))",
      "let value = getFirst(); for(...) { use(value); }",
    ],
    sampleSymptom: "On the list: All items show identical values. The first item's data is duplicated across every row.",
  },
  {
    id: "wrong-closure",
    category: "SAME_VALUE",
    name: "Closure Captures Wrong Value",
    description: "Use var instead of let in a loop, or capture wrong variable in closure",
    examples: [
      "for(var i = 0; i < items.length; i++) { setTimeout(() => use(i), 100) }",
      "items.forEach((_, i) => { callbacks.push(() => items[i]) })",
    ],
    sampleSymptom: "In the click handlers: Every button performs the same action - they all act like the last button.",
  },

  // === DATA SHOWING AS UNDEFINED/NULL ===
  {
    id: "property-typo",
    category: "UNDEFINED_NULL",
    name: "Property Name Typo",
    description: "Access property with a typo causing undefined",
    examples: [
      "item.nme instead of item.name",
      "user.emial instead of user.email",
    ],
    sampleSymptom: "On the dashboard: All the user names are showing as 'undefined'. The email loads fine but names are blank.",
  },
  {
    id: "return-undefined",
    category: "UNDEFINED_NULL",
    name: "Return Undefined Instead of Data",
    description: "Return undefined or null instead of the actual data",
    examples: [
      "return undefined; // return data;",
      "return null;",
    ],
    sampleSymptom: "After loading: The entire content area is blank. Data exists but nothing displays.",
  },
  {
    id: "delete-before-use",
    category: "UNDEFINED_NULL",
    name: "Delete Property Before Use",
    description: "Delete a property from an object before it gets accessed",
    examples: [
      "delete user.name; // then later: display(user.name)",
      "obj.data = undefined; // then use obj.data",
    ],
    sampleSymptom: "On the profile page: Key information is missing. The name field shows nothing even though we set it.",
  },
  {
    id: "wrong-optional-chain",
    category: "UNDEFINED_NULL",
    name: "Remove Needed Optional Chaining",
    description: "Remove ?. where it's needed, causing null pointer crashes",
    examples: [
      "user.address.street instead of user?.address?.street",
      "data.items.length instead of data?.items?.length",
    ],
    sampleSymptom: "After loading the page: App crashes with white screen. Console shows 'Cannot read property of null' error.",
  },
  {
    id: "wrong-nullish",
    category: "UNDEFINED_NULL",
    name: "Wrong Nullish Coalescing",
    description: "Use ?? when should use || or vice versa, or use wrong fallback",
    examples: [
      "value ?? 'default' when value could be empty string",
      "count || 0 when 0 is valid",
    ],
    sampleSymptom: "On the form: Default values aren't appearing correctly. Empty fields should show placeholder text but don't.",
  },

  // === CALCULATION/DISPLAY BUGS ===
  {
    id: "off-by-one-length",
    category: "CALCULATION",
    name: "Wrong Length Calculation",
    description: "Use length - 2 or length + 1 instead of just length",
    examples: [
      "items.length - 2",
      "count + 1",
    ],
    sampleSymptom: "On the counter display: Shows '3 items' but there are clearly 5 items on screen. The count is always 2 less.",
  },
  {
    id: "return-zero",
    category: "CALCULATION",
    name: "Return Zero Instead of Calculation",
    description: "Return 0 instead of the calculated price/total",
    examples: [
      "return 0; // return total;",
      "return 0; // return price * quantity;",
    ],
    sampleSymptom: "On the pricing page: All prices show $0.00. Items ranging from $10-$500 all display as zero.",
  },
  {
    id: "wrong-math-op",
    category: "CALCULATION",
    name: "Wrong Math Operation",
    description: "Use wrong math operator (+ instead of *, - instead of +, etc.)",
    examples: [
      "price + quantity instead of price * quantity",
      "total - tax instead of total + tax",
    ],
    sampleSymptom: "In the cart: The total price calculation is completely wrong. Buying 5 items at $10 shows $15 instead of $50.",
  },
  {
    id: "wrong-comparison",
    category: "CALCULATION",
    name: "Wrong Comparison Operator",
    description: "Use < when should be > or <= when should be >=",
    examples: [
      "if (count < max) instead of if (count > max)",
      "while (i <= 0) instead of while (i >= 0)",
    ],
    sampleSymptom: "On the pagination: Clicking 'Next' goes backwards, and 'Previous' goes forwards. Navigation is completely reversed.",
  },
  {
    id: "wrong-rounding",
    category: "CALCULATION",
    name: "Wrong Rounding Method",
    description: "Use Math.floor when should use Math.ceil or vice versa",
    examples: [
      "Math.floor(total) instead of Math.ceil(total)",
      "Math.round(value) instead of Math.floor(value)",
    ],
    sampleSymptom: "In the quantity display: Values are always rounded incorrectly. 4.9 items shows as 4 instead of 5.",
  },

  // === RENDERING/DISPLAY BUGS ===
  {
    id: "invert-condition",
    category: "RENDERING",
    name: "Invert Conditional Rendering",
    description: "Add ! to invert a condition, or remove ! where it's needed",
    examples: [
      "!isVisible && <Component /> instead of isVisible && <Component />",
      "condition ? null : <Item /> instead of condition ? <Item /> : null",
    ],
    sampleSymptom: "When viewing the list: Items that should be visible are hidden, and hidden items are showing.",
  },
  {
    id: "map-to-foreach",
    category: "RENDERING",
    name: "Change map to forEach",
    description: "Replace .map() with .forEach() causing undefined return",
    examples: [
      "items.forEach(item => <Item />) instead of items.map(...)",
    ],
    sampleSymptom: "On the list page: The entire list is blank. The container exists but no items render inside.",
  },
  {
    id: "wrong-sort",
    category: "RENDERING",
    name: "Wrong Sort Direction",
    description: "Use a - b when should be b - a, or sort by wrong property",
    examples: [
      ".sort((a, b) => a.date - b.date) instead of b.date - a.date",
      ".sort((a, b) => a.name - b.name) // strings don't subtract",
    ],
    sampleSymptom: "On the feed: Newest items appear at the bottom instead of the top. The sort order is completely reversed.",
  },
  {
    id: "wrong-index",
    category: "RENDERING",
    name: "Use Wrong Array Index",
    description: "Use i+1, i-1, or [1] instead of [0] to access wrong element",
    examples: [
      "items[1] instead of items[0]",
      "array[index + 1] instead of array[index]",
    ],
    sampleSymptom: "On the detail view: It's showing the next item's info, not the one I clicked. Everything is offset by 1.",
  },

  // === ASYNC/PROMISE BUGS ===
  {
    id: "missing-await",
    category: "ASYNC",
    name: "Missing Await Keyword",
    description: "Remove await from an async function call",
    examples: [
      "const data = fetchData(); // missing await",
      "const result = processAsync(); // shows [object Promise]",
    ],
    sampleSymptom: "On the dashboard: Instead of data, I see '[object Promise]' displayed as text.",
  },
  {
    id: "wrong-promise-method",
    category: "ASYNC",
    name: "Promise.all vs Promise.allSettled",
    description: "Use Promise.all when should use Promise.allSettled or race",
    examples: [
      "Promise.all([...]) // fails if any promise rejects",
      "Promise.race([...]) // only returns first result",
    ],
    sampleSymptom: "When loading the page: Sometimes the whole page fails to load if any single request has an issue.",
  },

  // === FORM/INPUT BUGS ===
  {
    id: "input-truncate",
    category: "FORM",
    name: "Truncate Input Value",
    description: "Apply slice or substring to input values",
    examples: [
      "e.target.value.slice(0, 5)",
      "input.substring(0, input.length - 1)",
    ],
    sampleSymptom: "In the text input: I can only type 5 characters. Anything longer gets cut off immediately.",
  },
  {
    id: "input-clear",
    category: "FORM",
    name: "Clear Input on Change",
    description: "Reset the input value instead of updating it",
    examples: [
      "setValue('') instead of setValue(e.target.value)",
      "setInput(null)",
    ],
    sampleSymptom: "In the form: Every time I type something, the field clears itself. I can't enter any text.",
  },
  {
    id: "validation-invert",
    category: "FORM",
    name: "Invert Validation Logic",
    description: "Make validation reject valid input and accept invalid input",
    examples: [
      "if (email.includes('@')) return 'Invalid'",
      "if (!isNaN(value)) return 'Must be a number'",
    ],
    sampleSymptom: "On the form: Valid emails are rejected and gibberish is accepted. Validation seems backwards.",
  },
  {
    id: "wrong-event",
    category: "FORM",
    name: "Wrong Event Handler",
    description: "Attach handler to wrong event (onClick instead of onChange)",
    examples: [
      "onClick={handleChange} instead of onChange={handleChange}",
      "onSubmit instead of onClick for a button",
    ],
    sampleSymptom: "In the dropdown: Selecting an option doesn't do anything. I have to click somewhere else for it to register.",
  },

  // === LOGIC BUGS ===
  {
    id: "boolean-flip",
    category: "LOGIC",
    name: "Flip Boolean Value",
    description: "Change true to false or false to true",
    examples: [
      "isEnabled = false instead of isEnabled = true",
      "return !valid instead of return valid",
    ],
    sampleSymptom: "On the settings page: The toggle says 'ON' but the feature is disabled. The display is opposite of reality.",
  },
  {
    id: "wrong-ternary",
    category: "LOGIC",
    name: "Swap Ternary Branches",
    description: "Swap the true and false branches of a ternary",
    examples: [
      "condition ? errorState : successState // swapped",
      "isActive ? 'inactive' : 'active'",
    ],
    sampleSymptom: "In the status display: Active items show as 'Inactive' and vice versa. The status labels are swapped.",
  },
  {
    id: "wrong-logical-op",
    category: "LOGIC",
    name: "Wrong Logical Operator",
    description: "Use && when should use || or vice versa",
    examples: [
      "if (a && b) instead of if (a || b)",
      "condition1 || condition2 instead of condition1 && condition2",
    ],
    sampleSymptom: "On the filter: Items only show when ALL filters match instead of ANY. Finding items is nearly impossible.",
  },

  // === TYPE COERCION BUGS ===
  {
    id: "string-concat-number",
    category: "TYPE",
    name: "String Concatenation Instead of Addition",
    description: "Concatenate string + number causing '510' instead of 15",
    examples: [
      "'5' + 10 // results in '510'",
      "quantity + price // if quantity is string",
    ],
    sampleSymptom: "In the total: The price shows $510.00 instead of $15.00. The math seems way off.",
  },
  {
    id: "wrong-parse",
    category: "TYPE",
    name: "Wrong parseInt/parseFloat Usage",
    description: "Use parseInt without radix or on wrong value",
    examples: [
      "parseInt(value) // missing radix, could be octal",
      "parseFloat('abc') // results in NaN",
    ],
    sampleSymptom: "On the quantity input: Entering '08' or '09' gives weird results. The numbers seem to parse incorrectly.",
  },

  // === DATA PIPELINE BUGS (for medium/high stress) ===
  {
    id: "pipeline-normalizer",
    category: "PIPELINE",
    name: "Add Buggy Normalizer Function",
    description: "Create a 'normalizer' helper function that subtly corrupts data as it passes through",
    examples: [
      "function normalizeData(item) { return { ...item, name: item.name.slice(1) }; }",
      "const normalize = (data) => ({ ...data, id: data.id + 1 });",
    ],
    sampleSymptom: "Throughout the app: Data looks slightly wrong everywhere. Names are missing first letter, IDs are off by 1.",
  },
  {
    id: "pipeline-formatter",
    category: "PIPELINE",
    name: "Add Buggy Formatter Function",
    description: "Create a 'formatter' helper that introduces bugs during data transformation",
    examples: [
      "function formatForDisplay(items) { return items.slice(0, -1); }",
      "const prepareData = (arr) => arr.map(() => arr[0]);",
    ],
    sampleSymptom: "On every list: The last item is always missing, or all items show the same data.",
  },
  {
    id: "pipeline-validator",
    category: "PIPELINE",
    name: "Add Buggy Validator Function",
    description: "Create a 'validator' that incorrectly filters or modifies valid data",
    examples: [
      "function validateItems(items) { return items.filter(i => i.id !== i.id); }",
      "const checkData = (data) => data.isValid ? null : data;",
    ],
    sampleSymptom: "After validation: Valid items are being rejected. Good data disappears during processing.",
  },
  {
    id: "pipeline-chain",
    category: "PIPELINE",
    name: "Create Multi-Step Bug Pipeline",
    description: "Chain multiple transformation functions where one corrupts the data mid-pipeline",
    examples: [
      "const process = (items) => items.map(validate).map(normalize).map(format);",
      "data |> validate |> transform |> display // one step has the bug",
    ],
    sampleSymptom: "Data corruption happens somewhere in the processing. The raw data is fine but displayed data is wrong.",
  },
];

