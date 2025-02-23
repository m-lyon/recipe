import { GetUnitsQuery } from '@recipe/graphql/generated';
import { GetRecipeQuery, GetRecipesQuery } from '@recipe/graphql/generated';
import { EnumIngredientTags, GetTagsQuery } from '@recipe/graphql/generated';
import { CurrentUserQuery, GetUnitConversionsQuery } from '@recipe/graphql/generated';
import { CreateConversionRuleMutation, GetSizesQuery } from '@recipe/graphql/generated';
import { GetIngredientComponentsQuery, GetIngredientsQuery } from '@recipe/graphql/generated';
import { EnumUnitPreferredNumberFormat, GetPrepMethodsQuery } from '@recipe/graphql/generated';

/**
 * Represents the editable value that is used in the recipe ingredient editing flow.
 */
type EditableValue = string | null;

declare global {
    // - Dropdown Choices ----------------------------------------

    /**
     * Represents a unit document dropdown choice that can be selected by the user when in
     * unit state within the recipe ingredient editing flow.
     */
    type UnitChoice = GetIngredientComponentsQuery['units'][number];
    /**
     * Represents a size document dropdown choice that can be selected by the user when in
     * the unit or size state within the recipe ingredient editing flow.
     */
    type SizeChoice = GetIngredientComponentsQuery['sizes'][number];
    /**
     * Represents an ingredient document dropdown choice that can be selected by the user when
     * in the unit, size, or ingredient state within the recipe ingredient editing flow.
     */
    type IngredientChoice = GetIngredientComponentsQuery['ingredients'][number];
    /**
     * Represents a recipe document dropdown choice that can be selected by the user when in
     * the unit, size, or ingredient state within the recipe ingredient editing flow.
     */
    type RecipeChoice = GetIngredientComponentsQuery['recipes'][number];
    /**
     * Represents either an ingredient or recipe dropdown choice that can be selected by the
     * user when in the unit, size, or ingredient state within the recipe ingredient editing
     * flow.
     */
    type IngredientOrRecipeChoice = IngredientChoice | RecipeChoice;
    /**
     * Represents a prep method document dropdown choice that can be selected by the user when
     * in the prep method state within the recipe ingredient editing flow.
     */
    type PrepMethodChoice = GetIngredientComponentsQuery['prepMethods'][number];
    /**
     * Represents a tag document dropdown choice that can be selected by the user when selecting
     * tags for a recipe.
     */
    type TagChoice = Omit<GetTagsQuery['tagMany'][number], '__typename'>;
    /**
     * Represents a dropdown choice that can be selected by the user when editing a recipe.
     * This includes 'string' which is used for the quantity field, as well as the various
     * custom choices such as 'skip unit' and 'add new ingredient', etc.
     */
    type RecipeIngredientDropdown =
        | string
        | UnitChoice
        | SizeChoice
        | IngredientChoice
        | RecipeChoice
        | PrepMethodChoice;
    /**
     * This type is used to represent the attribute that is set when a dropdown choice is
     * selected by the user. This includes null, which is set when skip actions are selected,
     * such as 'skip unit' or 'skip prep method'. It also includes undefined, which is set when
     * no attribute is selected, e.g. when Enter is pressed when in quantity state.
     */
    type SetAttr = null | undefined | RecipeIngredientDropdown;

    // - Editables ----------------------------------------------------------------
    // ----------- Types for the RecipeIngredient Edit Workflow -------------------

    /**
     * Represents the state of the input field within the recipe ingredient editing flow.
     */
    type EditableState = 'quantity' | 'unit' | 'size' | 'ingredient' | 'prepMethod';
    /**
     * Represents a quantity object that is currently being edited within the recipe
     * ingredient editing flow. This object is mutable and can be changed by the user.
     */
    type EditableQuantity = EditableValue;
    /**
     * Represents a unit object that is currently being edited within the recipe ingredient
     * editing flow. This object is mutable and can be changed by the user.
     */
    interface EditableUnit {
        value: EditableValue;
        data: undefined | null | UnitChoice;
    }
    /**
     * Represents a size object that is currently being edited within the recipe ingredient
     * editing flow. This object is mutable and can be changed by the user.
     */
    interface EditableSize {
        value: EditableValue;
        data: undefined | null | SizeChoice;
    }
    /**
     * Represents an ingredient object that is currently being edited within the recipe
     * ingredient editing flow. This object is mutable and can be changed by the user.
     */
    interface EditableIngredient {
        value: EditableValue;
        data: undefined | null | IngredientChoice | RecipeChoice;
    }
    /**
     * Represents a prep method object that is currently being edited within the recipe
     * ingredient editing flow. This object is mutable and can be changed by the user.
     */
    interface EditablePrepMethod {
        value: EditableValue;
        data: undefined | null | PrepMethodChoice;
    }
    /**
     * Represents a recipe ingredient object that is currently being edited within the recipe
     * ingredient editing flow. This object is mutable and can be changed by the user. Notably
     * the object contains a key attribute that is used to uniquely identify the object within
     * the list of recipe ingredients.
     */
    interface EditableRecipeIngredient {
        quantity: EditableQuantity;
        unit: EditableUnit;
        size: EditableSize;
        ingredient: EditableIngredient;
        prepMethod: EditablePrepMethod;
        state: EditableState;
        showDropdown: boolean;
        popover: PopoverType;
    }
    /**
     * Represents an editable ingredient object that is valid for transformation into a
     * finished ingredient object. Notably, the value attribute is non-nullable, and the data
     * attribute is a valid ingredient object.
     */
    interface FinishableEditableIngredient {
        value: string;
        data: IngredientChoice | RecipeChoice;
    }
    /**
     * Represents an editable recipe ingredient object that is valid for transformation into a
     * finished recipe ingredient object. Notably, the ingredient attribute is a valid
     * finishable ingredient object.
     */
    interface FinishableEditableRecipeIngredient extends EditableRecipeIngredient {
        ingredient: FinishableEditableIngredient;
    }
    /**
     * Represents the type of popover that is currently open within the recipe ingredient
     * editing flow. Setting this value to null will close the popover.
     */
    type PopoverType = null | 'unit' | 'bespokeUnit' | 'size' | 'ingredient' | 'prepMethod';

    // - Finished -----------------------------------------------------------------
    // ----------- Types for the RecipeIngredient Edit Workflow -------------------

    /**
     * Represents a finished quantity object that is no longer modifiable within the recipe
     * ingredient editing flow. This is the penultimate form of the quantity object
     * before being transformed into a submittable quantity object. Can be null if no quantity
     * is selected.
     */
    type FinishedQuantity = EditableQuantity;
    /**
     * Represents a unit object that is no longer modifiable within the recipe ingredient
     * editing flow. This is the penultimate form of the unit object before being
     * transformed into a submittable unit object. Can be null if no unit is selected.
     */
    type FinishedUnit = UnitChoice | null;
    /**
     * Represents a size object that is no longer modifiable within the recipe ingredient
     * editing flow. This is the penultimate form of the size object before being
     * transformed into a submittable size object. Can be null if no size is selected.
     */
    type FinishedSize = SizeChoice | null;
    /**
     * Represents a finished ingredient object that is no longer modifiable within the
     * recipe ingredient editing flow. This is the penultimate form of the ingredient object
     * before being transformed into a submittable ingredient object. It can be either an
     * ingredient object or a recipe object.
     */
    type FinishedIngredient = IngredientChoice | RecipeChoice;
    /**
     * Represents a finished prep method object that is no longer modifiable within the
     * recipe ingredient editing flow. This is the penultimate form of the prep method object
     * before being transformed into a submittable prep method object. Can be null if no prep
     * method is selected.
     */
    type FinishedPrepMethod = PrepMethodChoice | null;
    /**
     * Represents a finished recipe ingredient object that is no longer modifiable within the
     * recipe ingredient editing flow. This is the penultimate form of the recipe ingredient object
     * before being transformed into a submittable recipe ingredient object. This object is used to
     * display completed finished recipe ingredient objects in a list array. Extranaeous attributes
     * such as show and type are removed.
     */
    interface FinishedRecipeIngredient {
        quantity: FinishedQuantity;
        unit: FinishedUnit;
        size: FinishedSize;
        ingredient: FinishedIngredient;
        prepMethod: FinishedPrepMethod;
        key: string;
    }

    // - Submittable --------------------------------------------------------------

    /**
     * Represents a quantity object that is ready to be submitted to the API. Null is
     * transformed into undefined to indicate that no quantity is present.
     */
    type SubmittableQuantity = string | undefined;
    /**
     * Represents a unit object that is ready to be submitted to the API. Null is transformed
     * into undefined to indicate that no unit is present. If present, the object is the _id of
     * the unit object.
     */
    type SubmittableUnit = string | undefined;
    /**
     * Represents a size object that is ready to be submitted to the API. Null is transformed
     * into undefined to indicate that no size is present. If present, the object is the _id of
     * the size object.
     */
    type SubmittableSize = string | undefined;
    /**
     * Represents an ingredient object that is ready to be submitted to the API. The
     * object is the _id of the ingredient object.
     */
    type SubmittableIngredient = string;
    /**
     * Represents a prep method object that is ready to be submitted to the API. Null is
     * transformed into undefined to indicate that no prep method is present. If present, the
     * object is the _id of the prep method object.
     */
    type SubmittablePrepMethod = string | undefined;
    /**
     * Represents a recipe ingredient object that is ready to be submitted to the API.
     */
    interface SubmittableRecipeIngredient {
        quantity: SubmittableQuantity;
        unit: SubmittableUnit;
        size: SubmittableSize;
        ingredient: SubmittableIngredient;
        prepMethod: SubmittablePrepMethod;
    }

    // - Viewables ----------------------------------------------------------------
    // ----------- Types for the View Recipe page ---------------------------------

    /**
     * Represents a recipe object for use in the view recipe page. Can be null if the recipe
     * does not exist, or undefined if the query has not yet completed.
     */
    type RecipeView = GetRecipeQuery['recipeOne'] | undefined;
    /**
     * Represents a resolved recipe object for use in the view recipe page.
     */
    type CompletedRecipeView = NonNullable<RecipeView>;
    /**
     * Represents an ingredient subsection object for use in the view recipe page.
     */
    type IngredientSubsectionView = CompletedRecipeView['ingredientSubsections'][number];
    /**
     * Represents a recipe ingredient object for use in the view recipe page.
     */
    type RecipeIngredientView = IngredientSubsectionView['ingredients'][number];
    /**
     * Represents a recipe ingredient object that has an ingredient attribute that is a recipe.
     */
    interface RecipeIngredientAsRecipeView extends RecipeIngredientView {
        ingredient: IngredientAsRecipeView;
    }
    /**
     * Represents an ingredient object that is a recipe.
     */
    type IngredientAsRecipeView = Extract<
        RecipeIngredientView['ingredient'],
        { __typename?: 'Recipe' }
    >;
    /**
     * Represents an image object for use in the view recipe page.
     */
    type ImageView = CompletedRecipeView['images'][number];
    /**
     * Represents a rating object for use in the view recipe page.
     */
    type RatingView = CompletedRecipeView['ratings'][number];
    /**
     * Represents an ingredient object for use in the view recipe page.
     * This is an attribute of the RecipeIngredientView object.
     */
    type IngredientView =
        IngredientAsIngredientView['ingredientSubsections'][number]['ingredients'][number]['ingredient'];
    /**
     * Represents a unit object for use in the view recipe page.
     * This is an attribute of the RecipeIngredientView object.
     * Can be null if the unit does not exist.
     */
    type UnitView =
        CompletedRecipeView['ingredientSubsections'][number]['ingredients'][number]['unit'];
    /**
     * Represents a source attribute for use in the view recipe page.
     * Can be null if the source does not exist.
     */
    type SourceView = CompletedRecipeView['source'];
    /**
     * Represents a notes attribute for use in the view recipe page.
     * Can be null if the notes do not exist.
     */
    type NotesView = CompletedRecipeView['notes'];
    /**
     * Represents a recipe tags list for use in the view recipe page.
     */
    type RecipeTagsView = CompletedRecipeView['tags'];
    /**
     * Represents a number of servings attribute for use in the view recipe page.
     */
    type ServingNumberView = CompletedRecipeView['numServings'];
    /**
     * Represents an instruction subsection object for use in the view recipe page.
     */
    type InstructionSubsectionView = CompletedRecipeView['instructionSubsections'][number];
    /**
     * Represents the calculated recipe tags list for use in the view recipe page.
     */
    type CalculatedTagsView = CompletedRecipeView['calculatedTags'];

    // - Previews -----------------------------------------------------------------
    // ----------- Types for the data displayed on the Home Page ------------------

    /**
     * Represents a recipe object for use in the home page.
     */
    type RecipePreview = GetRecipesQuery['recipeMany'][number];
    /**
     * Represents an image object for use in the home page.
     */
    type ImagePreview = RecipePreview['images'][number];

    // - Modifyables --------------------------------------------------------------
    // ------------- Types for the Edit RecipeIngredient Component pages ----------

    /**
     * Represents the unit document that is returned from the API when a unit is
     * created or modified.
     */
    type ModifyableUnit = GetUnitsQuery['unitMany'][number];
    /**
     * Represents the size document that is returned from the API when a size is
     * created or modified.
     */
    type ModifyableSize = GetSizesQuery['sizeMany'][number];
    /**
     * Represents the ingredient document that is returned from the API when an ingredient
     * is created or modified.
     */
    type ModifyableIngredient = GetIngredientsQuery['ingredientMany'][number];
    /**
     * Represents the prep method document that is returned from the API when a prep
     * method is created or modified.
     */
    type ModifyablePrepMethod = GetPrepMethodsQuery['prepMethodMany'][number];

    // - Queries and Mutations ----------------------------------------------------
    // ----------------------- GraphQL Query and Mutation Types -------------------

    /**
     * Represents a completed query object that is a list of ingredient components
     * that can be used to populate dropdown choices in the recipe ingredient editing
     */
    type IngredientComponents = GetIngredientComponentsQuery;
    /**
     * Represents a query object that is a list of ingredient components
     * that can be used to populate dropdown choices in the recipe ingredient editing.
     * Can be undefined if the query has not been completed.
     */
    type IngredientComponentQuery = IngredientComponents | undefined;
    /**
     * Represents a completed create converion rule mutation object.
     */
    type CompletedCreateConversionRule = NonNullable<
        CreateConversionRuleMutation['conversionRuleCreateOne']
    >;

    // - Enums -------------------------------------------------------

    /**
     * Represents the number format that is possible for a recipe ingredient quantity.
     */
    type NumberFormat = EnumUnitPreferredNumberFormat;
    /**
     * Represents the tags that are assignable to an ingredient.
     */
    type IngredientTags = EnumIngredientTags;

    // - Unit Conversions ---------------------------------------------------------

    /**
     * Represents a unit conversion object that is returned from the API when a unit
     * conversion is queried.
     */
    type UnitConversion = GetUnitConversionsQuery['unitConversionMany'][number];

    // - User Authentication ------------------------------------------------------

    /**
     * Represents the current user object that is returned from the API when queried.
     * Can be null if the user is not authenticated.
     */
    type CurrentUser = CurrentUserQuery['currentUser'];
    // - Images -------------------------------------------------------------------

    /**
     * Represents an image object for use in components that can display either
     * an image using data from either the recipe view page or the home page.
     */
    type Image = ImageView | ImagePreview;

    // ----------------------------------------------------------------------------
}
