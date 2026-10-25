/**
 * Development data for `npm run seed`. It aims to look like a small production database:
 * metric and US recipes, count units such as cloves and cans, recipes used as ingredients,
 * a vegan version, ratings, and lines that nutrition cannot count yet, so every screen has
 * something to show.
 *
 * Units are named by their long singular name. Standard units (gram, cup, each and so on)
 * come from STANDARD_UNITS in utils/units.ts and are not listed here.
 */

export type SeedOwner = 'admin' | 'user';

/** Display name: what the user will see when they log in. Password for all: password1. */
export const SEED_USERS = [
    { username: 'john@gmail.com', firstName: 'John', lastName: 'Doe', role: 'admin' },
    { username: 'matt@gmail.com', firstName: 'Matt', lastName: 'Smith', role: 'user' },
    { username: 'sam@gmail.com', firstName: 'Sam', lastName: 'Lee', role: 'user' },
    { username: 'jane@gmail.com', firstName: 'Jane', lastName: 'Doe', role: 'unverified' },
] as const;

export const SEED_TAGS = [
    'breakfast',
    'lunch',
    'dinner',
    'dessert',
    'side',
    'baking',
    'spicy',
    'quick',
    'freezes',
];

export interface SeedCountUnit {
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    owner: SeedOwner;
    /** False for a bespoke unit, which only its owner sees. */
    unique?: boolean;
}

/** Count units: they reach grams only through a measure recorded on the ingredient. */
export const SEED_COUNT_UNITS: SeedCountUnit[] = [
    {
        shortSingular: 'clove',
        shortPlural: 'cloves',
        longSingular: 'clove',
        longPlural: 'cloves',
        owner: 'admin',
    },
    {
        shortSingular: 'pinch',
        shortPlural: 'pinches',
        longSingular: 'pinch',
        longPlural: 'pinches',
        owner: 'admin',
    },
    {
        shortSingular: 'handful',
        shortPlural: 'handfuls',
        longSingular: 'handful',
        longPlural: 'handfuls',
        owner: 'admin',
    },
    {
        shortSingular: 'can',
        shortPlural: 'cans',
        longSingular: 'can',
        longPlural: 'cans',
        owner: 'admin',
    },
    {
        shortSingular: 'slice',
        shortPlural: 'slices',
        longSingular: 'slice',
        longPlural: 'slices',
        owner: 'admin',
    },
    {
        shortSingular: 'bunch',
        shortPlural: 'bunches',
        longSingular: 'bunch',
        longPlural: 'bunches',
        owner: 'admin',
    },
    {
        shortSingular: 'sprig',
        shortPlural: 'sprigs',
        longSingular: 'sprig',
        longPlural: 'sprigs',
        owner: 'admin',
    },
    {
        shortSingular: 'stick',
        shortPlural: 'sticks',
        longSingular: 'stick',
        longPlural: 'sticks',
        owner: 'admin',
    },
    {
        shortSingular: 'knob',
        shortPlural: 'knobs',
        longSingular: 'knob',
        longPlural: 'knobs',
        owner: 'admin',
    },
    // Matt's own units: other users do not see them.
    {
        shortSingular: 'dash',
        shortPlural: 'dashes',
        longSingular: 'dash',
        longPlural: 'dashes',
        owner: 'user',
    },
    {
        shortSingular: 'heaped spoon',
        shortPlural: 'heaped spoons',
        longSingular: 'heaped spoon',
        longPlural: 'heaped spoons',
        owner: 'user',
        unique: false,
    },
];

export const SEED_SIZES = ['small', 'medium', 'large', 'extra large'];

export const SEED_PREP_METHODS = [
    'chopped',
    'finely chopped',
    'diced',
    'sliced',
    'grated',
    'minced',
    'crushed',
    'peeled',
    'melted',
    'softened',
    'beaten',
    'juiced',
    'drained',
    'torn',
];

/** One weight: 1 of the unit, optionally narrowed by size and prep method, weighs grams. */
export type SeedMeasure = [unit: string, grams: number, narrow?: { size?: string; prep?: string }];

export interface SeedIngredient {
    name: string;
    plural?: string;
    /** Pluralised after a unit: "200 g mushrooms". */
    countable?: boolean;
    tags?: Array<'vegan' | 'vegetarian'>;
    owner?: SeedOwner;
    /** Per 100 g: kcal, protein, carbs, fat. Missing: the ingredient has no nutrition. */
    per100g?: [number, number, number, number];
    /** Per 100 g of the prepared food, by prep method: lemon, juiced, is lemon juice. */
    prepPer100g?: Record<string, [number, number, number, number]>;
    measures?: SeedMeasure[];
}

const VEGAN: Array<'vegan' | 'vegetarian'> = ['vegan', 'vegetarian'];
const VEGETARIAN: Array<'vegan' | 'vegetarian'> = ['vegetarian'];

/** Nutrition values are rounded from USDA FoodData Central. */
export const SEED_INGREDIENTS: SeedIngredient[] = [
    // Vegetables and fruit
    {
        name: 'onion',
        plural: 'onions',
        countable: true,
        tags: VEGAN,
        per100g: [40, 1.1, 9.3, 0.1],
        measures: [
            ['each', 110],
            ['each', 70, { size: 'small' }],
            ['each', 150, { size: 'large' }],
            ['cup', 160, { prep: 'chopped' }],
        ],
    },
    {
        name: 'red onion',
        plural: 'red onions',
        countable: true,
        tags: VEGAN,
        per100g: [40, 1.1, 9.3, 0.1],
        measures: [['each', 110]],
    },
    {
        name: 'spring onion',
        plural: 'spring onions',
        countable: true,
        tags: VEGAN,
        per100g: [32, 1.8, 7.3, 0.2],
        measures: [['each', 15]],
    },
    {
        name: 'garlic',
        plural: 'garlic',
        tags: VEGAN,
        per100g: [149, 6.4, 33, 0.5],
        measures: [
            ['clove', 3],
            ['teaspoon', 2.8, { prep: 'minced' }],
        ],
    },
    {
        name: 'ginger',
        plural: 'ginger',
        tags: VEGAN,
        per100g: [80, 1.8, 18, 0.8],
        measures: [['tablespoon', 6, { prep: 'grated' }]],
    },
    {
        name: 'tomato',
        plural: 'tomatoes',
        countable: true,
        tags: VEGAN,
        per100g: [18, 0.9, 3.9, 0.2],
        measures: [
            ['each', 123],
            ['each', 182, { size: 'large' }],
            ['cup', 180, { prep: 'chopped' }],
        ],
    },
    {
        name: 'chopped tomatoes',
        plural: 'chopped tomatoes',
        tags: VEGAN,
        per100g: [21, 1, 4, 0.1],
        measures: [['can', 400]],
    },
    {
        name: 'tomato puree',
        plural: 'tomato puree',
        tags: VEGAN,
        per100g: [82, 4.3, 19, 0.5],
        measures: [['tablespoon', 16]],
    },
    {
        name: 'carrot',
        plural: 'carrots',
        countable: true,
        tags: VEGAN,
        per100g: [41, 0.9, 9.6, 0.2],
        measures: [
            ['each', 61],
            ['each', 72, { size: 'large' }],
            ['cup', 110, { prep: 'grated' }],
        ],
    },
    {
        name: 'celery',
        plural: 'celery',
        tags: VEGAN,
        per100g: [16, 0.7, 3, 0.2],
        measures: [['stick', 40]],
    },
    {
        name: 'potato',
        plural: 'potatoes',
        countable: true,
        tags: VEGAN,
        per100g: [77, 2, 17, 0.1],
        measures: [
            ['each', 173],
            ['each', 92, { size: 'small' }],
            ['each', 299, { size: 'large' }],
        ],
    },
    {
        name: 'red pepper',
        plural: 'red peppers',
        countable: true,
        tags: VEGAN,
        per100g: [31, 1, 6, 0.3],
        measures: [['each', 119]],
    },
    {
        name: 'mushroom',
        plural: 'mushrooms',
        countable: true,
        tags: VEGAN,
        per100g: [22, 3.1, 3.3, 0.3],
        measures: [
            ['each', 18],
            ['cup', 70, { prep: 'sliced' }],
        ],
    },
    {
        name: 'spinach',
        plural: 'spinach',
        tags: VEGAN,
        per100g: [23, 2.9, 3.6, 0.4],
        measures: [
            ['cup', 30],
            ['handful', 25],
        ],
    },
    {
        name: 'cucumber',
        plural: 'cucumbers',
        countable: true,
        tags: VEGAN,
        per100g: [15, 0.7, 3.6, 0.1],
        measures: [['each', 300]],
    },
    {
        name: 'avocado',
        plural: 'avocados',
        countable: true,
        tags: VEGAN,
        per100g: [160, 2, 8.5, 14.7],
        measures: [['each', 150]],
    },
    {
        name: 'lemon',
        plural: 'lemons',
        countable: true,
        tags: VEGAN,
        per100g: [29, 1.1, 9.3, 0.3],
        prepPer100g: { juiced: [22, 0.4, 6.9, 0.2] },
        measures: [
            ['each', 84],
            // A juiced lemon gives its juice, not its weight.
            ['each', 48, { prep: 'juiced' }],
        ],
    },
    {
        name: 'banana',
        plural: 'bananas',
        countable: true,
        tags: VEGAN,
        per100g: [89, 1.1, 23, 0.3],
        measures: [
            ['each', 118],
            ['each', 136, { size: 'large' }],
        ],
    },
    {
        name: 'blueberries',
        plural: 'blueberries',
        tags: VEGAN,
        per100g: [57, 0.7, 14, 0.3],
        measures: [
            ['cup', 148],
            ['handful', 40],
        ],
    },
    {
        name: 'coriander',
        plural: 'coriander',
        tags: VEGAN,
        per100g: [23, 2.1, 3.7, 0.5],
        measures: [
            ['handful', 10],
            ['bunch', 30],
        ],
    },
    // No nutrition yet: these lines show as not counted.
    { name: 'fresh basil', plural: 'fresh basil', tags: VEGAN },
    { name: 'rosemary', plural: 'rosemary', tags: VEGAN },

    // Meat, fish, eggs and dairy
    {
        name: 'chicken breast',
        plural: 'chicken breasts',
        countable: true,
        per100g: [120, 22.5, 0, 2.6],
        measures: [['each', 174]],
    },
    {
        name: 'beef mince',
        plural: 'beef mince',
        owner: 'user',
        per100g: [254, 17, 0, 20],
    },
    {
        name: 'bacon',
        plural: 'bacon',
        per100g: [393, 13, 1.4, 37],
        measures: [['slice', 23]],
    },
    {
        name: 'egg',
        plural: 'eggs',
        countable: true,
        tags: VEGETARIAN,
        per100g: [143, 12.6, 0.7, 9.5],
        measures: [
            ['each', 50],
            ['each', 38, { size: 'small' }],
            ['each', 56, { size: 'large' }],
            ['each', 63, { size: 'extra large' }],
        ],
    },
    {
        name: 'butter',
        plural: 'butter',
        tags: VEGETARIAN,
        per100g: [717, 0.9, 0.1, 81],
        measures: [
            ['tablespoon', 14.2],
            ['stick', 113],
            ['knob', 10],
        ],
    },
    {
        name: 'milk',
        plural: 'milk',
        tags: VEGETARIAN,
        per100g: [61, 3.2, 4.8, 3.3],
        measures: [['millilitre', 1.03]],
    },
    {
        name: 'greek yoghurt',
        plural: 'greek yoghurt',
        tags: VEGETARIAN,
        per100g: [97, 9, 3.9, 5],
        measures: [['cup', 245]],
    },
    {
        name: 'cheddar',
        plural: 'cheddar',
        tags: VEGETARIAN,
        per100g: [403, 25, 1.3, 33],
        measures: [['cup', 113, { prep: 'grated' }]],
    },
    {
        name: 'parmesan',
        plural: 'parmesan',
        per100g: [431, 38, 4.1, 29],
        measures: [['tablespoon', 5, { prep: 'grated' }]],
    },
    {
        name: 'feta',
        plural: 'feta',
        tags: VEGETARIAN,
        per100g: [264, 14, 4.1, 21],
    },

    // Store cupboard
    {
        name: 'olive oil',
        plural: 'olive oil',
        tags: VEGAN,
        per100g: [884, 0, 0, 100],
        // No measure on purpose: recipe pages ask for the weight of a tablespoon.
    },
    {
        name: 'vegetable stock',
        plural: 'vegetable stock',
        tags: VEGAN,
        per100g: [5, 0.3, 0.9, 0.1],
        measures: [['millilitre', 1]],
    },
    {
        name: 'coconut milk',
        plural: 'coconut milk',
        tags: VEGAN,
        per100g: [197, 2, 2.8, 21],
        measures: [
            ['can', 400],
            ['millilitre', 0.98],
        ],
    },
    {
        name: 'kidney beans',
        plural: 'kidney beans',
        tags: VEGAN,
        per100g: [127, 8.7, 22.8, 0.5],
        measures: [['can', 240, { prep: 'drained' }]],
    },
    {
        name: 'chickpeas',
        plural: 'chickpeas',
        tags: VEGAN,
        per100g: [139, 7, 22, 2.6],
        measures: [['can', 240, { prep: 'drained' }]],
    },
    {
        name: 'red lentils',
        plural: 'red lentils',
        tags: VEGAN,
        per100g: [358, 24, 63, 2.2],
        measures: [['cup', 192]],
    },
    {
        name: 'basmati rice',
        plural: 'basmati rice',
        tags: VEGAN,
        per100g: [365, 7.1, 80, 0.7],
        measures: [['cup', 185]],
    },
    {
        name: 'spaghetti',
        plural: 'spaghetti',
        tags: VEGAN,
        per100g: [371, 13, 75, 1.5],
    },
    {
        name: 'rolled oats',
        plural: 'rolled oats',
        tags: VEGAN,
        per100g: [379, 13, 68, 6.5],
        measures: [['cup', 81]],
    },
    {
        name: 'sourdough bread',
        plural: 'sourdough bread',
        tags: VEGAN,
        per100g: [274, 10, 51, 3],
        measures: [['slice', 50]],
    },
    {
        name: 'plain flour',
        plural: 'plain flour',
        tags: VEGAN,
        per100g: [364, 10, 76, 1],
        measures: [
            ['cup', 125],
            ['tablespoon', 7.8],
        ],
    },
    {
        name: 'caster sugar',
        plural: 'caster sugar',
        tags: VEGAN,
        per100g: [387, 0, 100, 0],
        measures: [
            ['cup', 200],
            ['tablespoon', 12.5],
        ],
    },
    {
        name: 'honey',
        plural: 'honey',
        tags: VEGETARIAN,
        per100g: [304, 0.3, 82, 0],
        measures: [['tablespoon', 21]],
    },
    {
        name: 'dark chocolate',
        plural: 'dark chocolate',
        tags: VEGETARIAN,
        per100g: [546, 4.9, 61, 31],
    },
    {
        name: 'baking powder',
        plural: 'baking powder',
        tags: VEGAN,
        per100g: [53, 0, 28, 0],
        measures: [['teaspoon', 4.6]],
    },
    {
        name: 'vanilla extract',
        plural: 'vanilla extract',
        tags: VEGAN,
        per100g: [288, 0.1, 13, 0.1],
        measures: [['teaspoon', 4.2]],
    },
    {
        name: 'soy sauce',
        plural: 'soy sauce',
        tags: VEGAN,
        per100g: [53, 8, 4.9, 0.6],
        measures: [['tablespoon', 16]],
    },

    // Spices and seasoning
    {
        name: 'salt',
        plural: 'salt',
        tags: VEGAN,
        per100g: [0, 0, 0, 0],
        measures: [
            ['teaspoon', 6],
            ['pinch', 0.4],
        ],
    },
    {
        name: 'black pepper',
        plural: 'black pepper',
        tags: VEGAN,
        per100g: [251, 10, 64, 3.3],
        measures: [
            ['teaspoon', 2.3],
            ['pinch', 0.1],
        ],
    },
    {
        name: 'ground cumin',
        plural: 'ground cumin',
        tags: VEGAN,
        per100g: [375, 18, 44, 22],
        measures: [['teaspoon', 2.1]],
    },
    {
        name: 'smoked paprika',
        plural: 'smoked paprika',
        tags: VEGAN,
        per100g: [282, 14, 54, 13],
        measures: [['teaspoon', 2.3]],
    },
    {
        name: 'chilli powder',
        plural: 'chilli powder',
        tags: VEGAN,
        per100g: [282, 13, 50, 14],
        measures: [
            ['teaspoon', 2.7],
            ['pinch', 0.2],
        ],
    },
    {
        name: 'garam masala',
        plural: 'garam masala',
        tags: VEGAN,
        per100g: [379, 13, 51, 15],
        measures: [['teaspoon', 2]],
    },
];

/**
 * One recipe line: quantity, unit, ingredient (or the title of a recipe that is used as an
 * ingredient), and an optional size and prep method. Mixed numbers are improper fractions,
 * as the app stores them: '3/2' shows as 1½. A null unit with a quantity is stored
 * as the hidden each unit: "2 onions".
 */
export type SeedLine = [
    quantity: string | null,
    unit: string | null,
    ingredient: string,
    narrow?: { size?: string; prep?: string },
];

export interface SeedRecipe {
    title: string;
    pluralTitle?: string;
    subTitle?: string;
    owner?: SeedOwner;
    servings: number;
    tags: string[];
    /** Used as an ingredient in other recipes. */
    isIngredient?: boolean;
    yield?: Array<[quantity: string, unit: string | null]>;
    source?: string;
    notes?: string;
    archived?: boolean;
    /** Days before the seed date, so the home page has an order. */
    daysAgo: number;
    ingredients: Array<{ name?: string; lines: SeedLine[] }>;
    instructions: Array<{ name?: string; steps: string[] }>;
    /** Title of the recipe this one is the vegan version of. */
    veganVersionOf?: string;
    /** Number of photos, downloaded from picsum.photos when the seed runs. */
    images?: number;
    /** Star ratings, 1 to 5. */
    ratings?: Array<[SeedOwner, number]>;
}

export const SEED_RECIPES: SeedRecipe[] = [
    {
        title: 'Homemade Curry Paste',
        pluralTitle: 'Homemade Curry Paste',
        subTitle: 'Makes about 6 tablespoons',
        servings: 6,
        isIngredient: true,
        // Chicken Curry uses it by the tablespoon.
        yield: [
            ['6', 'tablespoon'],
            ['90', 'gram'],
        ],
        tags: ['spicy', 'freezes'],
        daysAgo: 60,
        notes: 'Freeze in an ice cube tray. One cube is about a tablespoon.',
        ingredients: [
            {
                lines: [
                    ['2', 'teaspoon', 'ground cumin'],
                    ['2', 'teaspoon', 'smoked paprika'],
                    ['1', 'teaspoon', 'chilli powder'],
                    ['1', 'teaspoon', 'garam masala'],
                    ['3', 'clove', 'garlic', { prep: 'crushed' }],
                    ['1', 'tablespoon', 'ginger', { prep: 'grated' }],
                    ['2', 'tablespoon', 'tomato puree'],
                    ['2', 'tablespoon', 'olive oil'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Toast the dry spices in a pan for 1 minute, until fragrant.',
                    'Blend everything to a smooth paste.',
                ],
            },
        ],
    },
    {
        title: 'Chicken Curry',
        subTitle: 'A weeknight curry with homemade paste',
        servings: 4,
        tags: ['dinner', 'spicy', 'freezes'],
        daysAgo: 45,
        source: 'Family recipe',
        images: 2,
        ratings: [
            ['admin', 5],
            ['user', 4],
        ],
        ingredients: [
            {
                name: 'Curry',
                lines: [
                    ['1', 'tablespoon', 'olive oil'],
                    ['1', null, 'onion', { size: 'large', prep: 'finely chopped' }],
                    ['3', 'tablespoon', 'Homemade Curry Paste'],
                    ['2', null, 'chicken breast', { prep: 'diced' }],
                    ['1', 'can', 'coconut milk'],
                    ['1', 'handful', 'spinach'],
                ],
            },
            {
                name: 'To serve',
                lines: [
                    ['3/2', 'cup', 'basmati rice'],
                    ['1', 'handful', 'coriander', { prep: 'chopped' }],
                ],
            },
        ],
        instructions: [
            {
                name: 'Curry',
                steps: [
                    'Soften the onion in the oil for 8 minutes.',
                    'Stir in the curry paste and cook for 1 minute.',
                    'Add the chicken and brown it on all sides.',
                    'Pour in the coconut milk and simmer for 15 minutes. Stir in the spinach.',
                ],
            },
            {
                name: 'To serve',
                steps: ['Cook the rice. Serve the curry on the rice with the coriander.'],
            },
        ],
    },
    {
        title: 'Spaghetti Bolognese',
        subTitle: 'A slow-cooked ragù',
        owner: 'user',
        servings: 4,
        tags: ['dinner', 'freezes'],
        daysAgo: 40,
        images: 1,
        ratings: [
            ['admin', 4],
            ['user', 5],
        ],
        notes: 'The sauce is better the next day.',
        ingredients: [
            {
                name: 'Sauce',
                lines: [
                    ['1', 'tablespoon', 'olive oil'],
                    ['2', 'slice', 'bacon', { prep: 'diced' }],
                    ['1', null, 'onion', { prep: 'diced' }],
                    ['1', null, 'carrot', { prep: 'diced' }],
                    ['1', 'stick', 'celery', { prep: 'diced' }],
                    ['2', 'clove', 'garlic', { prep: 'crushed' }],
                    ['500', 'gram', 'beef mince'],
                    ['2', 'tablespoon', 'tomato puree'],
                    ['1', 'can', 'chopped tomatoes'],
                    ['150', 'millilitre', 'milk'],
                    [null, null, 'salt'],
                ],
            },
            {
                name: 'To serve',
                lines: [
                    ['400', 'gram', 'spaghetti'],
                    ['4', 'tablespoon', 'parmesan', { prep: 'grated' }],
                ],
            },
        ],
        instructions: [
            {
                name: 'Sauce',
                steps: [
                    'Fry the bacon in the oil until crisp. Add the onion, carrot and celery and cook for 10 minutes.',
                    'Add the garlic and the mince. Brown the mince.',
                    'Stir in the tomato puree, the tomatoes and the milk. Simmer gently for 2 hours.',
                    'Season with salt.',
                ],
            },
            {
                name: 'To serve',
                steps: ['Cook the spaghetti. Toss with the sauce and serve with parmesan.'],
            },
        ],
    },
    {
        title: 'Red Lentil Dahl',
        subTitle: 'Creamy, cheap and quick',
        servings: 4,
        tags: ['dinner', 'quick', 'freezes'],
        daysAgo: 30,
        images: 1,
        ratings: [['user', 5]],
        ingredients: [
            {
                lines: [
                    ['1', null, 'onion', { prep: 'chopped' }],
                    ['3', 'clove', 'garlic', { prep: 'crushed' }],
                    ['1', 'tablespoon', 'ginger', { prep: 'grated' }],
                    ['1', 'teaspoon', 'ground cumin'],
                    ['1', 'teaspoon', 'garam masala'],
                    ['1', 'cup', 'red lentils'],
                    ['1', 'can', 'coconut milk'],
                    ['500', 'millilitre', 'vegetable stock'],
                    ['2', 'handful', 'spinach'],
                    ['1/2', null, 'lemon', { prep: 'juiced' }],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Soften the onion, garlic and ginger in a large pan for 5 minutes.',
                    'Stir in the spices, then the lentils, coconut milk and stock.',
                    'Simmer for 20 minutes until the lentils break down. Stir in the spinach and lemon juice.',
                ],
            },
        ],
    },
    {
        title: 'Chilli con Carne',
        subTitle: 'With kidney beans',
        owner: 'user',
        servings: 6,
        tags: ['dinner', 'spicy', 'freezes'],
        daysAgo: 28,
        ingredients: [
            {
                lines: [
                    ['1', null, 'onion', { prep: 'chopped' }],
                    ['1', null, 'red pepper', { prep: 'diced' }],
                    ['2', 'clove', 'garlic', { prep: 'crushed' }],
                    ['500', 'gram', 'beef mince'],
                    ['1-2', 'teaspoon', 'chilli powder'],
                    ['1', 'teaspoon', 'ground cumin'],
                    ['1', 'can', 'chopped tomatoes'],
                    ['1', 'can', 'kidney beans', { prep: 'drained' }],
                    ['3/2', 'cup', 'basmati rice'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Soften the onion and pepper. Add the garlic and brown the mince.',
                    'Stir in the spices, tomatoes and beans. Simmer for 40 minutes.',
                    'Serve with the rice.',
                ],
            },
        ],
    },
    {
        title: 'Vegan Chilli',
        subTitle: 'Lentils and chickpeas instead of beef',
        owner: 'user',
        servings: 6,
        tags: ['dinner', 'spicy', 'freezes'],
        daysAgo: 27,
        veganVersionOf: 'Chilli con Carne',
        ingredients: [
            {
                lines: [
                    ['1', null, 'onion', { prep: 'chopped' }],
                    ['1', null, 'red pepper', { prep: 'diced' }],
                    ['2', 'clove', 'garlic', { prep: 'crushed' }],
                    ['3/4', 'cup', 'red lentils'],
                    ['1', 'can', 'chickpeas', { prep: 'drained' }],
                    ['1-2', 'teaspoon', 'chilli powder'],
                    ['1', 'teaspoon', 'ground cumin'],
                    ['1', 'can', 'chopped tomatoes'],
                    ['1', 'can', 'kidney beans', { prep: 'drained' }],
                    ['3/2', 'cup', 'basmati rice'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Soften the onion and pepper. Add the garlic.',
                    'Stir in the lentils, chickpeas, spices, tomatoes and beans. Add 300 ml water and simmer for 40 minutes.',
                    'Serve with the rice.',
                ],
            },
        ],
    },
    {
        title: 'American Pancakes',
        pluralTitle: 'American Pancakes',
        subTitle: 'Thick and fluffy, in cups',
        servings: 4,
        tags: ['breakfast', 'quick'],
        daysAgo: 20,
        source: 'Written in US cups: try the Metric view',
        images: 1,
        ratings: [
            ['admin', 4],
            ['user', 3],
        ],
        ingredients: [
            {
                lines: [
                    ['3/2', 'cup', 'plain flour'],
                    ['7/2', 'teaspoon', 'baking powder'],
                    ['1', 'tablespoon', 'caster sugar'],
                    ['1/4', 'teaspoon', 'salt'],
                    ['5/4', 'cup', 'milk'],
                    ['1', null, 'egg', { size: 'large', prep: 'beaten' }],
                    ['3', 'tablespoon', 'butter', { prep: 'melted' }],
                    ['1', 'cup', 'blueberries'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Whisk the flour, baking powder, sugar and salt.',
                    'Make a well, add the milk, egg and butter, and whisk until smooth.',
                    'Cook ladlefuls in a hot pan. Scatter blueberries on top before you flip them.',
                ],
            },
        ],
    },
    {
        title: 'Chocolate Chip Cookies',
        pluralTitle: 'Chocolate Chip Cookies',
        subTitle: 'Makes 24',
        servings: 24,
        yield: [['24', null]],
        tags: ['baking', 'dessert'],
        daysAgo: 18,
        notes: 'A stick of butter is 113 g, or half a cup.',
        ratings: [['user', 5]],
        ingredients: [
            {
                lines: [
                    ['2', 'stick', 'butter', { prep: 'softened' }],
                    ['1', 'cup', 'caster sugar'],
                    ['2', null, 'egg', { size: 'large' }],
                    ['2', 'teaspoon', 'vanilla extract'],
                    ['9/4', 'cup', 'plain flour'],
                    ['1', 'teaspoon', 'baking powder'],
                    ['1', 'pinch', 'salt'],
                    ['200', 'gram', 'dark chocolate', { prep: 'chopped' }],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Beat the butter and sugar until pale. Beat in the eggs and vanilla.',
                    'Fold in the flour, baking powder, salt and chocolate.',
                    'Bake spoonfuls at 180°C for 10 to 12 minutes.',
                ],
            },
        ],
    },
    {
        title: 'Banana Bread',
        subTitle: 'For the spotty bananas',
        servings: 10,
        yield: [
            ['1', null],
            ['900', 'gram'],
        ],
        tags: ['baking', 'freezes'],
        daysAgo: 14,
        images: 1,
        ingredients: [
            {
                lines: [
                    ['3', null, 'banana', { size: 'large' }],
                    ['75', 'gram', 'butter', { prep: 'melted' }],
                    ['150', 'gram', 'caster sugar'],
                    ['1', null, 'egg', { prep: 'beaten' }],
                    ['1', 'teaspoon', 'vanilla extract'],
                    ['1', 'teaspoon', 'baking powder'],
                    ['190', 'gram', 'plain flour'],
                    ['1', 'pinch', 'salt'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Mash the bananas and stir in the butter, sugar, egg and vanilla.',
                    'Fold in the flour, baking powder and salt.',
                    'Bake in a lined loaf tin at 170°C for 55 minutes.',
                ],
            },
        ],
    },
    {
        title: 'Shakshuka',
        subTitle: 'Eggs in spiced tomato sauce',
        servings: 2,
        tags: ['breakfast', 'lunch', 'quick'],
        daysAgo: 10,
        ratings: [['admin', 5]],
        ingredients: [
            {
                lines: [
                    ['2', 'tablespoon', 'olive oil'],
                    ['1', null, 'onion', { prep: 'sliced' }],
                    ['1', null, 'red pepper', { prep: 'sliced' }],
                    ['2', 'clove', 'garlic', { prep: 'crushed' }],
                    ['1', 'teaspoon', 'ground cumin'],
                    ['1', 'teaspoon', 'smoked paprika'],
                    ['1', 'can', 'chopped tomatoes'],
                    ['4', null, 'egg', { size: 'large' }],
                    ['50', 'gram', 'feta'],
                    ['1', 'handful', 'coriander', { prep: 'chopped' }],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Soften the onion and pepper in the oil. Add the garlic and spices.',
                    'Add the tomatoes and simmer for 10 minutes.',
                    'Make 4 wells, crack in the eggs, cover, and cook for 6 minutes. Top with feta and coriander.',
                ],
            },
        ],
    },
    {
        title: 'Greek Salad',
        servings: 2,
        tags: ['lunch', 'quick'],
        daysAgo: 8,
        ingredients: [
            {
                lines: [
                    ['1', null, 'cucumber', { prep: 'chopped' }],
                    ['4', null, 'tomato', { prep: 'chopped' }],
                    ['1/2', null, 'red onion', { prep: 'sliced' }],
                    ['200', 'gram', 'feta'],
                    ['2', 'tablespoon', 'olive oil'],
                    ['1', 'handful', 'fresh basil', { prep: 'torn' }],
                    [null, null, 'black pepper'],
                ],
            },
        ],
        instructions: [{ steps: ['Toss everything together and season with pepper.'] }],
    },
    {
        title: 'Roast Potatoes',
        pluralTitle: 'Roast Potatoes',
        servings: 4,
        tags: ['side'],
        daysAgo: 6,
        ingredients: [
            {
                lines: [
                    ['1', 'kilogram', 'potato', { prep: 'peeled' }],
                    ['4', 'tablespoon', 'olive oil'],
                    ['2', 'sprig', 'rosemary'],
                    ['1', 'pinch', 'salt'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Cut the potatoes into chunks and boil for 8 minutes. Drain and shake to rough the edges.',
                    'Roast in hot oil at 200°C for 45 minutes, turning once. Add the rosemary for the last 10 minutes.',
                ],
            },
        ],
    },
    {
        title: 'Avocado Toast',
        servings: 1,
        tags: ['breakfast', 'lunch', 'quick'],
        daysAgo: 4,
        ingredients: [
            {
                lines: [
                    ['2', 'slice', 'sourdough bread'],
                    ['1', null, 'avocado'],
                    ['1/2', null, 'lemon', { prep: 'juiced' }],
                    ['1', 'pinch', 'salt'],
                    ['1', 'pinch', 'chilli powder'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Toast the bread. Mash the avocado with the lemon juice and salt.',
                    'Spread on the toast and finish with chilli.',
                ],
            },
        ],
    },
    {
        title: 'Overnight Oats',
        pluralTitle: 'Overnight Oats',
        owner: 'user',
        servings: 1,
        tags: ['breakfast', 'quick'],
        daysAgo: 3,
        ingredients: [
            {
                lines: [
                    ['1/2', 'cup', 'rolled oats'],
                    ['120', 'millilitre', 'milk'],
                    ['2', 'tablespoon', 'greek yoghurt'],
                    ['1', 'tablespoon', 'honey'],
                    ['1', 'handful', 'blueberries'],
                ],
            },
        ],
        instructions: [{ steps: ['Stir everything together in a jar and chill overnight.'] }],
    },
    {
        title: 'Microwave Mug Cake',
        subTitle: "Matt's bespoke units",
        owner: 'user',
        servings: 1,
        tags: ['dessert', 'quick'],
        daysAgo: 2,
        notes: 'Uses a heaped spoon and a dash, units only Matt can see.',
        ingredients: [
            {
                lines: [
                    ['4', 'heaped spoon', 'plain flour'],
                    ['3', 'heaped spoon', 'caster sugar'],
                    ['1', null, 'egg'],
                    ['3', 'tablespoon', 'milk'],
                    ['2', 'tablespoon', 'butter', { prep: 'melted' }],
                    ['1', 'dash', 'vanilla extract'],
                    ['30', 'gram', 'dark chocolate', { prep: 'chopped' }],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Mix everything in a large mug with a fork.',
                    'Microwave on high for 90 seconds.',
                ],
            },
        ],
    },
    {
        title: 'Tomato Chicken Rice',
        subTitle: 'A one-pot weeknight dinner',
        servings: 4,
        tags: ['dinner'],
        daysAgo: 1,
        ingredients: [
            {
                lines: [
                    ['1', null, 'onion', { size: 'large', prep: 'chopped' }],
                    ['2', 'tablespoon', 'olive oil'],
                    ['500', 'gram', 'chicken breast', { prep: 'diced' }],
                    ['3', null, 'tomato', { prep: 'chopped' }],
                    ['3/2', 'cup', 'basmati rice'],
                ],
            },
        ],
        instructions: [
            {
                steps: [
                    'Warm the oil in a wide pan and soften the onion for 5 minutes.',
                    'Add the chicken and brown it on all sides.',
                    'Stir in the tomatoes and rice, cover with water by 1 cm, and simmer for 18 minutes.',
                ],
            },
        ],
    },
    {
        title: 'Tomato Soup',
        subTitle: 'Archived: replaced by a better version',
        servings: 4,
        tags: ['lunch'],
        daysAgo: 90,
        archived: true,
        ingredients: [
            {
                lines: [
                    ['2', 'can', 'chopped tomatoes'],
                    ['500', 'millilitre', 'vegetable stock'],
                    ['1', null, 'onion', { prep: 'chopped' }],
                ],
            },
        ],
        instructions: [{ steps: ['Simmer everything for 20 minutes and blend.'] }],
    },
];
