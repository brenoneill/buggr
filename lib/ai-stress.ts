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
    description: "The bugs should be somewhat noticeable - things like obvious operator mistakes, clear logic inversions, or simple typos in variable names. A junior developer should be able to spot them with careful review.",
  },
  medium: {
    bugCountMin: 2,
    bugCountMax: 3,
    subtlety: "subtle but findable",
    description: "The bugs should require careful code review to find - off-by-one errors, missing awaits that cause Promise objects to be used as values, edge case failures. A mid-level developer should need to trace through the logic to find them. You MAY optionally add some convoluted or overly-complex code that obscures the bug - realistic 'clever' code that a developer might write. All bugs must be deterministic and reproducible.",
  },
  high: {
    bugCountMin: 2,
    bugCountMax: 3,
    subtlety: "deviously subtle",
    description: "The bugs should be very hard to find but ALWAYS reproducible - subtle state mutations, edge cases with specific inputs, cascading errors where one bug masks another, deeply nested logic errors. Even senior developers should need debugging tools and careful analysis. You are ENCOURAGED to add bloated, spaghetti code - overly nested logic, unnecessary abstractions, confusing control flow - that makes bugs harder to trace. This should still be 'realistic' code that an over-engineering developer might actually write. IMPORTANT: All bugs must be 100% deterministic - no race conditions or timing-dependent issues.",
  },
};

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

  // Generate a random seed to encourage variety
  const randomSeed = Math.random().toString(36).substring(2, 15);
  // Use targetBugCount if provided, otherwise calculate from stress level config
  const bugCount = targetBugCount !== undefined 
    ? targetBugCount 
    : Math.floor(Math.random() * (config.bugCountMax - config.bugCountMin + 1)) + config.bugCountMin;
  
  // Build optional focus area instruction
  const focusInstruction = context 
    ? `\n\nFOCUS AREA: The user wants to specifically test: "${context}"\nPrioritize bugs related to this focus area when possible, but still be unpredictable.`
    : "";
  
  const prompt = `You are a stress engineer tasked with introducing ${config.subtlety} breaking bugs into code.
  
STRESS LEVEL: ${stressLevel.toUpperCase()}
${config.description}

IMPORTANT: Be UNPREDICTABLE. Each time you modify code, choose DIFFERENT types of bugs. Do not fall into patterns.${focusInstruction}

CRITICAL - DO NOT REVEAL BUG LOCATIONS:
- Do NOT add comments near bugs like "// bug here" or "// TODO: fix this"
- Do NOT add comments that hint at what was changed
- Do NOT make the bugs obvious through naming or comments
- You MAY add realistic developer comments (like normal code would have), but these must NOT reveal the bug location
- The goal is for the developer to FIND the bugs through debugging, not through reading comments

THE SCENARIO - A careless developer:
This is for a learning game. Imagine the code was written by a careless, sloppy developer who:
- Never writes tests or double-checks their work
- Copies and pastes code without understanding it
- Makes "quick fixes" that break other things
- Over-engineers simple solutions
- Leaves half-finished refactors
- Doesn't handle edge cases
- Gets confused by their own code
- Makes typos and doesn't proofread

The bugs can be somewhat over-the-top - this is a game after all! Just keep a small thread of plausibility.
Think: "a bad developer COULD have done this" rather than "a good developer might accidentally do this"

Your goal is to make changes that:
1. Will cause the code to fail or behave incorrectly
2. Could plausibly be written by a careless/incompetent developer
3. Match the ${stressLevel} stress level described above
4. Are NOT obvious syntax errors that an IDE would immediately catch
5. Are VARIED - do not always use the same bug patterns
6. You MAY add NEW code (helper functions, utilities) that introduces bugs - not just modify existing code
7. Do NOT leave any hints in comments about where bugs are located
8. Can be over-the-top but should still have a thread of "someone could have written this"

CRITICAL - BUGS MUST BE DETERMINISTIC:
- Every bug MUST reproduce 100% of the time under the same conditions
- NO race conditions, timing-dependent bugs, or intermittent failures
- NO bugs that "sometimes" happen or depend on execution speed
- The bug should fail the SAME way every time the code runs with the same input
- Users need to be able to reliably reproduce and debug the issue

Random seed for this session: ${randomSeed}
Number of bugs to introduce: ${bugCount} (stress level: ${stressLevel})

CRITICAL: Bugs MUST be HIGH-IMPACT and CLEARLY VISIBLE. The user should immediately notice something is wrong when they use the app. Avoid subtle operator changes that don't affect behavior.

Choose ${bugCount} bugs RANDOMLY from this list (vary your choices each time!):

=== HIGHEST PRIORITY: DATA VISIBILITY BUGS (pick from these first!) ===
These bugs cause OBVIOUS, VISIBLE problems that users notice immediately:

STRING/TEXT CORRUPTION:
- Slice off first or last character(s) of displayed text (e.g., name.slice(1) cuts off first letter)
- Apply substring/slice that cuts off beginning or end of user-visible strings
- Wrong string formatting that truncates or corrupts displayed data
- Template literal that's missing a variable or has wrong interpolation order
- String concatenation in wrong order so output looks jumbled

DATA DISAPPEARING:
- Array slice/filter that excludes the last 1-2 items (items.slice(0, -2) or length-2)
- Map/filter that skips every other item or specific indices
- Condition that hides certain items entirely (e.g., hide items where index > someValue)
- Return empty array or undefined for certain data paths
- Destructuring that extracts wrong properties, leaving displayed fields undefined

ALL ITEMS SHOW SAME VALUE:
- Set all IDs to the same value (using first item's ID for all items)
- Use same index variable for all items in a loop (let i = 0 outside loop, never incrementing)
- Cache a value outside the loop and use it for every iteration
- Overwrite array with single repeated item
- Return same object reference for all mapped items

DATA SHOWING AS UNDEFINED/NULL:
- Access wrong property name (e.g., item.nme instead of item.name)
- Destructure with wrong property names so values become undefined
- Return undefined instead of the actual data from a function
- Delete or overwrite a property before it's used elsewhere
- Access nested property without the intermediate object existing

PROPERTY DELETION/NULL POINTER:
- Delete a property from an object, then access it later causing crash
- Set a required property to null/undefined before it's used
- Reassign object to {} or null, then access properties on it
- Clear an array before iterating over it
- Overwrite function parameter before using it

=== SECONDARY: OTHER IMPACTFUL BUGS ===

CALCULATION/DISPLAY BUGS:
- Off-by-one that causes visible miscounts (showing "3 items" when there are 4)
- Wrong array length calculation affecting pagination or "showing X of Y"
- Price/total calculations that are visibly wrong (off by whole dollars, not cents)
- Date calculations showing wrong day (yesterday's date as today's)
- Counter that starts at wrong number or increments incorrectly

RENDERING BUGS:
- Conditional rendering with inverted logic (show when should hide, hide when should show)
- Wrong index in list rendering causing duplicate or missing items
- Map that returns null for some items but not others
- Filter with always-false or always-true condition
- Sorting with comparison function that produces wrong order

FORM/INPUT BUGS:
- Value setter that truncates or corrupts user input
- Input handler that clears the field or resets to wrong value
- Form submission that sends wrong field values
- Validation that rejects all valid inputs or accepts all invalid ones

=== LOWER PRIORITY: SUBTLE BUGS (use sparingly) ===
Only use these if you've already added high-impact bugs or the code doesn't support visible bugs:

- Missing await (but only if it causes visible [object Promise] or undefined in UI)
- Wrong comparison operators (but only if it visibly breaks filtering/display)
- Boolean logic errors (but only if it causes visible wrong behavior)
- Type coercion bugs (but only if it causes visible NaN or wrong values)

AVOID THESE - THEY RARELY HAVE VISIBLE IMPACT:
- Simple operator swaps that don't affect output (+ to - in non-displayed calculations)
- Changes to error handling that only affect edge cases
- Changes to logging or debugging code
- Changes to comments or type annotations
- Micro-optimizations or performance-only bugs

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

IMPORTANT about "symptoms": These should be written like DETAILED bug reports from a QA tester or team member. Each symptom should be a mini bug report that gives enough context to reproduce and investigate the issue. Include:
- What action was being performed
- What was expected to happen
- What actually happened instead
- Any relevant context (e.g., specific data, conditions, or state)

Format each symptom as: "[Action/Context]: [What went wrong]. Expected [X] but got [Y]."

Examples of GOOD detailed symptoms (HIGHLY VISIBLE bugs):
- "In the search bar: The first letter of my search is being cut off. I typed 'Apple' but it searches for 'pple'. Every search term loses its first character."
- "On the product list page: The last 2 items are completely missing. We have 10 products but only 8 show up. Scrolling to the end, items 9 and 10 are nowhere to be found."
- "In the user cards: Every single card shows the same user ID (#1001). All 50 users display 'ID: 1001' even though they should each have unique IDs."
- "On the dashboard: All the user names are showing as 'undefined'. The email and avatar load fine but where the name should be it just says 'undefined'."
- "After loading the orders page: App crashes with white screen. Something about 'Cannot read property of null'. Looks like order data is being deleted before it's displayed."
- "In the item list: Half the items are completely blank. Items 1, 3, 5, 7 show correctly but items 2, 4, 6, 8 are empty cards with no content."
- "On the pricing page: All prices show $0.00. We have items ranging from $10-$500 but every single one displays as $0.00."
- "In the data table: The 'Status' column shows the wrong status for every row. Items marked 'Active' in the database show as 'Inactive' and vice versa."
- "When viewing comments: Every comment shows the exact same text - the first comment's text is repeated for all 20 comments."
- "On the counter display: It shows '3 items' but there are clearly 5 items visible on screen. The count is always 2 less than the actual number."

Do NOT mention specific variable names, function names, or line numbers. Describe from a tester's perspective who can see the UI and behavior but not the code.

IMPORTANT: Symptoms must describe REPRODUCIBLE issues - bugs that happen every single time under the described conditions. Do NOT write symptoms like "sometimes works" or "intermittently fails". The bug should be 100% reproducible.

The modifiedCode must be the COMPLETE file content with your bugs inserted. Do not truncate or summarize.
You CAN add new functions, helpers, or code - not just modify existing code. If you add a helper function, make sure to actually USE it somewhere in the existing code so the bug manifests.`;

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
      symptoms: parsed.symptoms || generateFallbackSymptoms(parsed.changes),
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

