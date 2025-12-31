import { generateText } from "ai";

/** Stress level configuration */
type StressLevel = "low" | "medium" | "high";

interface StressConfig {
  bugCountMin: number;
  bugCountMax: number;
  subtlety: string;
  description: string;
}

const STRESS_CONFIGS: Record<StressLevel, StressConfig> = {
  low: {
    bugCountMin: 1,
    bugCountMax: 2,
    subtlety: "relatively obvious",
    description: "The bugs should be somewhat noticeable - things like obvious operator mistakes, clear logic inversions, or simple typos in variable names. A junior developer should be able to spot them with careful review. Keep the code structure simple and don't add extra abstraction layers.",
  },
  medium: {
    bugCountMin: 2,
    bugCountMax: 3,
    subtlety: "subtle but findable",
    description: "The bugs should require careful code review to find - off-by-one errors, missing awaits that cause Promise objects to be used as values, edge case failures. A mid-level developer should need to trace through the logic to find them. You SHOULD add 1-2 'data layer' helper functions that data passes through before being used - mimicking technical debt where someone added abstraction layers 'for future flexibility'. The bug can be hidden in these intermediate functions. All bugs must be deterministic and reproducible.",
  },
  high: {
    bugCountMin: 2,
    bugCountMax: 3,
    subtlety: "deviously subtle",
    description: "The bugs should be very hard to find but ALWAYS reproducible - subtle state mutations, edge cases with specific inputs, cascading errors where one bug masks another. Even senior developers should need debugging tools and careful analysis. You MUST add multiple 'data layer' functions that pipe data through 2-4 transformation steps before it reaches its destination - realistic 'legacy code' technical debt where data flows through normalizers, formatters, validators, mappers, etc. Hide bugs deep in these pipelines where a developer must trace the entire data flow to find them. This should mimic real legacy codebases with accumulated abstractions. IMPORTANT: All bugs must be 100% deterministic - no race conditions or timing-dependent issues.",
  },
};

/**
 * Represents a type of bug that can be introduced into code.
 */
interface BugType {
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
  /** Priority level - high impact bugs are more visible to users */
  priority: "high" | "medium" | "low";
}

/**
 * Comprehensive list of bug types that can be introduced into code.
 * Each bug type has examples and descriptions to guide the AI.
 */
const BUG_TYPES: BugType[] = [
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "high",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "high",
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
    priority: "medium",
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
    priority: "medium",
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
    priority: "medium",
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
    priority: "medium",
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
    priority: "high",
  },
];

/**
 * Selects random bug types ensuring variety across categories.
 * Uses Fisher-Yates shuffle for true randomness.
 * 
 * @param count - Number of bug types to select
 * @param stressLevel - Stress level affects which priorities are preferred
 * @returns Array of randomly selected bug types
 */
function selectRandomBugTypes(count: number, stressLevel: StressLevel): BugType[] {
  // Filter by priority based on stress level
  let priorityFilter: BugType["priority"][];
  switch (stressLevel) {
    case "low":
      priorityFilter = ["high"]; // Only obvious bugs for low stress
      break;
    case "medium":
      priorityFilter = ["high", "medium"];
      break;
    case "high":
      priorityFilter = ["high", "medium", "low"];
      break;
  }

  // Get all applicable bugs
  const applicableBugs = BUG_TYPES.filter(bug => priorityFilter.includes(bug.priority));
  
  // Shuffle using Fisher-Yates
  const shuffled = [...applicableBugs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Select bugs ensuring category variety
  const selected: BugType[] = [];
  const usedCategories = new Set<string>();

  // First pass: pick one from each category
  for (const bug of shuffled) {
    if (selected.length >= count) break;
    if (!usedCategories.has(bug.category)) {
      selected.push(bug);
      usedCategories.add(bug.category);
    }
  }

  // Second pass: if we still need more, allow category repeats
  for (const bug of shuffled) {
    if (selected.length >= count) break;
    if (!selected.includes(bug)) {
      selected.push(bug);
    }
  }

  return selected;
}

/**
 * Formats selected bug types into a prompt instruction for the AI.
 * 
 * @param bugTypes - The bug types to format
 * @returns Formatted string describing the bugs to introduce
 */
function formatBugInstructions(bugTypes: BugType[]): string {
  return bugTypes.map((bug, index) => {
    const examples = bug.examples.map(ex => `    - ${ex}`).join("\n");
    return `BUG ${index + 1}: ${bug.name} (${bug.category})
  Description: ${bug.description}
  Examples:
${examples}
  Expected symptom: "${bug.sampleSymptom}"`;
  }).join("\n\n");
}

/**
 * Uses AI to introduce subtle but nasty breaking changes to code.
 * The changes should be realistic bugs that require debugging skills to find and fix.
 * 
 * Requires ANTHROPIC_API_KEY environment variable to be set.
 * 
 * @param content - Original file content
 * @param filename - Name of the file
 * @param context - Optional context about what specific areas to focus bugs on (max 200 chars)
 * @param stressLevel - Stress level: "low", "medium", or "high"
 * @param targetBugCount - Optional specific number of bugs to introduce (overrides stress level bug count)
 * @returns Modified content with AI-generated breaking changes, descriptions, and user-facing symptoms
 */
export async function introduceAIStress(
  content: string,
  filename: string,
  context?: string,
  stressLevel: StressLevel = "medium",
  targetBugCount?: number
): Promise<{ content: string; changes: string[]; symptoms: string[] }> {
  // Dynamic import to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let anthropic: any;
  try {
    const anthropicModule = await import("@ai-sdk/anthropic");
    anthropic = anthropicModule.anthropic;
  } catch {
    console.warn("@ai-sdk/anthropic not installed, using fallback stress");
    return fallbackStress(content, filename, context, stressLevel);
  }

  const config = STRESS_CONFIGS[stressLevel];

  // Calculate bug count
  const bugCount = targetBugCount !== undefined 
    ? targetBugCount 
    : Math.floor(Math.random() * (config.bugCountMax - config.bugCountMin + 1)) + config.bugCountMin;
  
  // RANDOMIZE: Select specific bug types before calling AI
  const selectedBugs = selectRandomBugTypes(bugCount, stressLevel);
  const bugInstructions = formatBugInstructions(selectedBugs);
  
  // Build optional focus area instruction
  const focusInstruction = context 
    ? `\n\nFOCUS AREA: The user wants to specifically test: "${context}"\nTry to apply the bugs in areas related to this focus when possible.`
    : "";
  
  const prompt = `You are a stress engineer introducing specific bugs into code for a debugging training game.

STRESS LEVEL: ${stressLevel.toUpperCase()}
${config.description}

YOU MUST INTRODUCE EXACTLY THESE ${bugCount} BUG(S):

${bugInstructions}

${focusInstruction}

CRITICAL RULES:
1. Introduce EXACTLY the bugs listed above - do not substitute or add different bugs
2. Each bug description tells you WHAT to do and gives examples - follow them closely
3. Do NOT add comments that reveal bug locations (no "// bug here" or hints)
4. Do NOT make syntax errors that IDEs would catch immediately
5. Bugs must be DETERMINISTIC - same behavior every time with same input
6. You MAY add helper functions to hide bugs (especially for medium/high stress)
7. The code must still compile/parse correctly

THE SCENARIO - A careless developer:
Imagine the code was written by a sloppy developer who:
- Never writes tests or double-checks their work
- Copies and pastes code without understanding it
- Makes "quick fixes" that break other things
- Gets confused by their own code
- Makes typos and doesn't proofread

Here is the code to modify:

FILENAME: ${filename}
\`\`\`
${content}
\`\`\`

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "modifiedCode": "the complete modified code with bugs introduced",
  "changes": ["technical description of bug 1", "technical description of bug 2"],
  "symptoms": ["Detailed bug report 1", "Detailed bug report 2"]
}

IMPORTANT about "symptoms": Write these like bug reports from a QA tester who sees the UI, not the code:
- Format: "[Location/Action]: [What went wrong]. Expected [X] but got [Y]."
- Do NOT mention variable names, function names, or line numbers
- Describe what the user SEES, not what the code does

The modifiedCode must be the COMPLETE file content. Do not truncate or summarize.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
    });

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.modifiedCode || !parsed.changes) {
      throw new Error("Invalid AI response structure");
    }

    return {
      content: parsed.modifiedCode,
      changes: parsed.changes,
      symptoms: parsed.symptoms || selectedBugs.map(b => b.sampleSymptom),
    };
  } catch (error) {
    console.error("AI stress generation failed:", error);
    // Fallback to basic stress if AI fails
    return fallbackStress(content, filename, context, stressLevel, targetBugCount);
  }
}

/**
 * Generates detailed bug report descriptions from technical change descriptions.
 * Used as a fallback when AI doesn't provide symptoms.
 * 
 * @param changes - Array of technical change descriptions
 * @returns Array of detailed bug report descriptions
 */
function generateFallbackSymptoms(changes: string[]): string[] {
  const symptomTemplates = [
    "On the main list page: The last 2 items are completely missing. We have 10 items but only 8 show up on screen.",
    "In the search bar: The first letter of every search is being cut off. Typing 'Apple' searches for 'pple' instead.",
    "On the cards/list view: Every single item shows the same ID number. All 50 items display 'ID: 1001' even though they should be unique.",
    "In the user profile section: All names are showing as 'undefined'. The other fields load fine but names are blank.",
    "After loading the page: App crashes with white screen. Console shows 'Cannot read property of null' error.",
    "On the dashboard: All totals and prices show $0.00. We have items worth hundreds of dollars but everything displays as zero.",
    "In the item grid: Half the items are completely blank. Every other card (items 2, 4, 6, 8...) shows as empty.",
    "When viewing the list: Items that should be visible are hidden, and hidden items are showing. The display logic is completely inverted.",
    "On the counter display: Shows '3 items' but there are clearly 5 items on screen. The count is always 2 less than actual.",
    "In the text fields: The last few characters are cut off from every label. 'Description' shows as 'Descript', 'Username' shows as 'Userna'.",
  ];
  
  // Pick random symptoms based on number of changes
  const numSymptoms = Math.min(changes.length, 3);
  shuffleArray(symptomTemplates);
  return symptomTemplates.slice(0, numSymptoms);
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 * 
 * @param array - Array to shuffle
 * @returns The shuffled array (same reference)
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Represents a stress mutation that can be applied to code.
 */
interface StressMutation {
  name: string;
  /** Check if this mutation can be applied */
  canApply: (content: string) => boolean;
  /** Apply the mutation and return the modified content */
  apply: (content: string) => string;
  /** Description of what the mutation does */
  description: string;
}

/**
 * Fallback stress function if AI is unavailable.
 * Randomly selects and applies mutations based on stress level.
 * 
 * @param content - Original file content
 * @param filename - Name of the file being modified
 * @param _context - Optional context (unused in fallback, but accepted for API compatibility)
 * @param stressLevel - Stress level determines number of bugs to apply
 * @param targetBugCount - Optional specific number of bugs to introduce (overrides stress level bug count)
 * @returns Modified content, list of changes made, and user-facing symptoms
 */
function fallbackStress(content: string, filename: string, _context?: string, stressLevel: StressLevel = "medium", targetBugCount?: number): { content: string; changes: string[]; symptoms: string[] } {
  const changes: string[] = [];
  let modifiedContent = content;
  const ext = filename.split(".").pop()?.toLowerCase();
  
  // Get bug count based on stress level
  const config = STRESS_CONFIGS[stressLevel];
  
  // Define all possible mutations for TypeScript/JavaScript
  // PRIORITY: High-impact, visually noticeable bugs first
  const jsMutations: StressMutation[] = [
    // === HIGH IMPACT: String/Text Corruption ===
    {
      name: "sliceOffFirstChar",
      canApply: (c) => /\.\w+\s*[,\)\}]/.test(c) && /name|title|label|text|value|query|search|input/i.test(c),
      apply: (c) => {
        // Find a string property and slice off first character
        const match = c.match(/(\.\w*(name|title|label|text|value|query|search|input)\w*)/i);
        if (match) {
          return c.replace(match[1], match[1] + ".slice(1)");
        }
        return c;
      },
      description: "Added .slice(1) to a text field, cutting off the first character",
    },
    {
      name: "sliceOffLastChars",
      canApply: (c) => /\.\w+\s*[,\)\}]/.test(c) && /name|title|label|text|description/i.test(c),
      apply: (c) => {
        const match = c.match(/(\.\w*(name|title|label|text|description)\w*)/i);
        if (match) {
          return c.replace(match[1], match[1] + ".slice(0, -3)");
        }
        return c;
      },
      description: "Added .slice(0, -3) to a text field, cutting off the last 3 characters",
    },

    // === HIGH IMPACT: Data Disappearing ===
    {
      name: "hideLastItems",
      canApply: (c) => /\.map\s*\(/.test(c),
      apply: (c) => c.replace(/\.map\s*\(/, ".slice(0, -2).map("),
      description: "Added .slice(0, -2) before .map(), hiding the last 2 items",
    },
    {
      name: "filterOutHalfItems",
      canApply: (c) => /\.map\s*\(/.test(c) && !/\.filter\s*\(/.test(c),
      apply: (c) => c.replace(/\.map\s*\(/, ".filter((_, i) => i % 2 === 0).map("),
      description: "Added filter that only shows every other item (even indices)",
    },
    {
      name: "returnEmptyArray",
      canApply: (c) => /return\s+\w+\.map\s*\(/.test(c),
      apply: (c) => c.replace(/return\s+(\w+)\.map\s*\(/, "return []; $1.map("),
      description: "Return empty array before the actual mapped data",
    },

    // === HIGH IMPACT: All Items Same Value ===
    {
      name: "useFirstIdForAll",
      canApply: (c) => /\.map\s*\(\s*\(\s*(\w+)/.test(c) && /\.id|\.key|\.uuid/i.test(c),
      apply: (c) => {
        const itemMatch = c.match(/\.map\s*\(\s*\(\s*(\w+)/);
        if (itemMatch) {
          const itemVar = itemMatch[1];
          // Find the array being mapped
          const arrayMatch = c.match(/(\w+)\.map\s*\(/);
          if (arrayMatch) {
            const arrayName = arrayMatch[1];
            // Replace item.id with array[0].id
            return c.replace(new RegExp(`${itemVar}\\.id`, 'g'), `${arrayName}[0].id`);
          }
        }
        return c;
      },
      description: "Changed to use first item's ID for all items (all IDs now identical)",
    },

    // === HIGH IMPACT: Data Showing as Undefined ===
    {
      name: "wrongPropertyName",
      canApply: (c) => /\.(name|title|email|username)\b/.test(c),
      apply: (c) => {
        const props = ['name', 'title', 'email', 'username'];
        for (const prop of props) {
          if (c.includes(`.${prop}`)) {
            const typo = prop.slice(0, -1); // Remove last char: name -> nam
            return c.replace(new RegExp(`\\.${prop}\\b`), `.${typo}`);
          }
        }
        return c;
      },
      description: "Typo in property name causes undefined (e.g., .name → .nam)",
    },
    {
      name: "setPropertyToNull",
      canApply: (c) => /const\s+\w+\s*=\s*\{/.test(c),
      apply: (c) => {
        // Find an object and set a visible property to null
        const match = c.match(/(const\s+\w+\s*=\s*\{[^}]*)(name|title|value|data):\s*[^,}]+/);
        if (match) {
          return c.replace(match[0], match[1] + match[2] + ": null");
        }
        return c;
      },
      description: "Set a key property to null, causing undefined display",
    },

    // === HIGH IMPACT: Null Pointer / Crash ===
    {
      name: "removeOptionalChaining",
      canApply: (c) => c.includes("?."),
      apply: (c) => c.replace(/\?\./g, "."),
      description: "Removed all optional chaining (?. → .) causing null pointer crashes",
    },
    {
      name: "deletePropertyBeforeUse",
      canApply: (c) => /const\s+(\w+)\s*=\s*\{/.test(c) && /\.name|\.data|\.items/.test(c),
      apply: (c) => {
        const objMatch = c.match(/const\s+(\w+)\s*=\s*\{/);
        if (objMatch) {
          const objName = objMatch[1];
          // Add delete statement after the object
          return c.replace(objMatch[0], objMatch[0]).replace(
            new RegExp(`(const\\s+${objName}\\s*=\\s*\\{[^}]+\\};?)`),
            `$1\ndelete ${objName}.data;`
          );
        }
        return c;
      },
      description: "Deleted a property from object before it's accessed",
    },

    // === HIGH IMPACT: Calculation/Count Bugs ===
    {
      name: "wrongLengthCount",
      canApply: (c) => /\.length\b/.test(c) && !/\.length\s*[-+]/.test(c),
      apply: (c) => c.replace(/\.length\b/, ".length - 2"),
      description: "Changed .length to .length - 2, showing wrong item count",
    },
    {
      name: "returnZeroPrice",
      canApply: (c) => /price|total|amount|cost|sum/i.test(c) && /return\s+\w+/.test(c),
      apply: (c) => {
        const match = c.match(/return\s+(\w*(price|total|amount|cost|sum)\w*)/i);
        if (match) {
          return c.replace(match[0], "return 0");
        }
        return c;
      },
      description: "Return 0 instead of calculated price/total",
    },

    // === HIGH IMPACT: Map/forEach swap ===
    {
      name: "mapToForEach",
      canApply: (c) => /\.map\s*\(/.test(c) && /return.*\.map/.test(c),
      apply: (c) => c.replace(/\.map\s*\(/, ".forEach("),
      description: "Changed .map() to .forEach() - returns undefined instead of array",
    },

    // === MEDIUM IMPACT: Conditional/Logic bugs ===
    {
      name: "invertConditionalDisplay",
      canApply: (c) => /\?\s*</.test(c) || /&&\s*</.test(c),
      apply: (c) => {
        // Invert conditional rendering
        if (c.includes("? <")) {
          return c.replace(/(\w+)\s*\?\s*</, "!$1 ? <");
        }
        if (c.includes("&& <")) {
          return c.replace(/(\w+)\s*&&\s*</, "!$1 && <");
        }
        return c;
      },
      description: "Inverted conditional rendering - shows when should hide, hides when should show",
    },
    {
      name: "returnUndefinedFromFunction",
      canApply: (c) => /function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(c),
      apply: (c) => {
        // Add early return undefined at start of function
        const match = c.match(/(function\s+\w+[^{]*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/);
        if (match) {
          return c.replace(match[0], match[0] + "\n  return undefined;");
        }
        return c;
      },
      description: "Added early return undefined, function returns nothing",
    },

    // === LOWER PRIORITY: Operator bugs (only if needed) ===
    {
      name: "offByOneLessThan",
      canApply: (c) => /for\s*\([^;]+;\s*\w+\s*<\s*\w+/.test(c),
      apply: (c) => {
        const match = c.match(/for\s*\([^;]+;\s*\w+\s*<\s*\w+/);
        return match ? c.replace(match[0], match[0].replace(" < ", " <= ")) : c;
      },
      description: "Changed loop boundary from < to <= (off-by-one, may process extra item)",
    },
    {
      name: "zeroToOne",
      canApply: (c) => /\[\s*0\s*\]/.test(c),
      apply: (c) => c.replace(/\[\s*0\s*\]/, "[1]"),
      description: "Changed array index from [0] to [1], skipping first item",
    },
    {
      name: "removeAwait",
      canApply: (c) => /await\s+\w+\(/.test(c),
      apply: (c) => {
        const match = c.match(/await\s+\w+\(/);
        return match ? c.replace(match[0], match[0].replace("await ", "")) : c;
      },
      description: "Removed 'await' keyword - data shows as [object Promise] or undefined",
    },
  ];

  // Generic mutations that work for any language - prioritizing visible impact
  const genericMutations: StressMutation[] = [
    {
      name: "genericReturnNull",
      canApply: (c) => /return\s+\w+/.test(c),
      apply: (c) => c.replace(/return\s+\w+/, "return null"),
      description: "Changed return value to null - data shows as null/empty",
    },
    {
      name: "genericReturnEmptyString",
      canApply: (c) => /return\s+["'`]/.test(c),
      apply: (c) => c.replace(/return\s+["'`][^"'`]*["'`]/, 'return ""'),
      description: "Changed return value to empty string - text displays as blank",
    },
    {
      name: "genericTrueToFalse",
      canApply: (c) => c.includes("true"),
      apply: (c) => c.replace("true", "false"),
      description: "Changed 'true' to 'false' - affects visibility/display logic",
    },
    {
      name: "genericFalseToTrue",
      canApply: (c) => c.includes("false"),
      apply: (c) => c.replace("false", "true"),
      description: "Changed 'false' to 'true' - affects visibility/display logic",
    },
  ];

  // Select mutations based on file type
  let availableMutations: StressMutation[];
  if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
    availableMutations = jsMutations;
  } else {
    availableMutations = genericMutations;
  }

  // Filter to only applicable mutations
  const applicableMutations = availableMutations.filter(m => m.canApply(modifiedContent));

  // Shuffle and pick random mutations based on difficulty
  shuffleArray(applicableMutations);
  // Use targetBugCount if provided, otherwise calculate from stress level config
  const bugCount = targetBugCount !== undefined 
    ? targetBugCount 
    : Math.floor(Math.random() * (config.bugCountMax - config.bugCountMin + 1)) + config.bugCountMin;
  
  for (const mutation of applicableMutations) {
    if (changes.length >= bugCount) break;
    
    // Double-check mutation can still be applied (content may have changed)
    if (mutation.canApply(modifiedContent)) {
      const newContent = mutation.apply(modifiedContent);
      if (newContent !== modifiedContent) {
        modifiedContent = newContent;
        changes.push(mutation.description);
      }
    }
  }

  // Last resort if no changes could be made
  if (changes.length === 0) {
    changes.push("No automatic changes could be applied - file may need manual review");
  }

  return { content: modifiedContent, changes, symptoms: generateFallbackSymptoms(changes) };
}
