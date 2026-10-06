export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'password', label: 'Password' },
  { value: 'textarea', label: 'Long text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'time', label: 'Time' },
  { value: 'name', label: 'Full name' },
  { value: 'address', label: 'Address' },
  { value: 'country', label: 'Country' },
  { value: 'tax', label: 'Tax Information' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'file', label: 'File upload' },
]

// Field types with their own fixed layout — no placeholder/options to configure.
export const STRUCTURED_TYPES = new Set(['name', 'address', 'country', 'tax'])
export const OPTIONS_TYPES = new Set(['dropdown', 'checkbox', 'radio'])

// Groups FIELD_TYPES for the "Add new field" type picker — only categories
// and types this app actually supports today. (No "Content" category yet —
// heading/image/video/HTML blocks aren't real data-collecting fields and
// would need a different rendering path on the storefront; no Workflow
// Trigger Button — that's Workflows-shaped and explicitly out of scope.)
export const FIELD_TYPE_CATEGORIES = [
  { label: 'Basic inputs', types: ['text', 'textarea', 'email', 'phone', 'url', 'number', 'password'] },
  { label: 'Structured data', types: ['address', 'name', 'tax'] },
  { label: 'Choices', types: ['dropdown', 'country', 'checkbox', 'radio', 'toggle'] },
  { label: 'Dates & time', types: ['date', 'datetime', 'time'] },
  { label: 'Special', types: ['file', 'hidden'] },
]

// Languages the embed's own built-in text (First Name, Next/Back, etc.) can be
// localised into — kept in sync by hand with backend-api's form.model.js LANGUAGES.
export const LANGUAGES = [
  { value: 'en', label: 'Default (English)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
]

// Localises only the embed's own built-in vocabulary (structured-field
// sublabels, pagination controls) — never merchant-entered content like field
// labels, description, or the success message. Used by both the admin Preview
// tab and the generated embed snippet, so both show the same translated text.
export const BUILT_IN_TRANSLATIONS = {
  en: {
    title: 'Title',
    firstName: 'First Name',
    middleName: 'Middle Name',
    lastName: 'Last Name',
    suffix: 'Suffix',
    addressLine: 'Address line',
    city: 'City',
    zip: 'ZIP',
    country: 'Country',
    selectCountry: 'Select country',
    back: 'Back',
    next: 'Next',
    step: 'Step',
    of: 'of',
  },
  es: {
    title: 'Título',
    firstName: 'Nombre',
    middleName: 'Segundo nombre',
    lastName: 'Apellido',
    suffix: 'Sufijo',
    addressLine: 'Dirección',
    city: 'Ciudad',
    zip: 'Código postal',
    country: 'País',
    selectCountry: 'Seleccionar país',
    back: 'Atrás',
    next: 'Siguiente',
    step: 'Paso',
    of: 'de',
  },
  fr: {
    title: 'Civilité',
    firstName: 'Prénom',
    middleName: 'Deuxième prénom',
    lastName: 'Nom',
    suffix: 'Suffixe',
    addressLine: 'Adresse',
    city: 'Ville',
    zip: 'Code postal',
    country: 'Pays',
    selectCountry: 'Sélectionner un pays',
    back: 'Retour',
    next: 'Suivant',
    step: 'Étape',
    of: 'sur',
  },
  de: {
    title: 'Titel',
    firstName: 'Vorname',
    middleName: 'Zweiter Vorname',
    lastName: 'Nachname',
    suffix: 'Suffix',
    addressLine: 'Adresse',
    city: 'Stadt',
    zip: 'PLZ',
    country: 'Land',
    selectCountry: 'Land auswählen',
    back: 'Zurück',
    next: 'Weiter',
    step: 'Schritt',
    of: 'von',
  },
  hi: {
    title: 'उपाधि',
    firstName: 'पहला नाम',
    middleName: 'मध्य नाम',
    lastName: 'अंतिम नाम',
    suffix: 'उपसर्ग',
    addressLine: 'पता',
    city: 'शहर',
    zip: 'पिन कोड',
    country: 'देश',
    selectCountry: 'देश चुनें',
    back: 'पीछे',
    next: 'आगे',
    step: 'चरण',
    of: 'में से',
  },
}

// The Validation tab's condition picker — grouped exactly like the reference
// app's "Select condition..." dropdown. `needsValue` controls whether a rule
// using that condition shows a Value input; `valueType` picks the input's
// type when it does. Kept in sync by hand with backend-api's
// form.controller.js VALIDATION_CONDITIONS.
export const VALIDATION_CONDITION_GROUPS = [
  {
    category: 'Equality',
    options: [
      { value: 'equals', label: 'Equals', needsValue: true, valueType: 'text' },
      { value: 'not_equals', label: 'Does not equal', needsValue: true, valueType: 'text' },
    ],
  },
  {
    category: 'Length',
    options: [
      { value: 'length_equals', label: 'Length equals', needsValue: true, valueType: 'number' },
      { value: 'length_not_equals', label: 'Length not equals', needsValue: true, valueType: 'number' },
      { value: 'length_gt', label: 'Length greater than', needsValue: true, valueType: 'number' },
      { value: 'length_gte', label: 'Length greater or equal to', needsValue: true, valueType: 'number' },
      { value: 'length_lt', label: 'Length less than', needsValue: true, valueType: 'number' },
      { value: 'length_lte', label: 'Length less or equal to', needsValue: true, valueType: 'number' },
    ],
  },
  {
    category: 'Text content',
    options: [
      { value: 'contains', label: 'Contains', needsValue: true, valueType: 'text' },
      { value: 'not_contains', label: 'Does not contain', needsValue: true, valueType: 'text' },
      { value: 'starts_with', label: 'Starts with', needsValue: true, valueType: 'text' },
      { value: 'ends_with', label: 'Ends with', needsValue: true, valueType: 'text' },
      { value: 'matches_pattern', label: 'Matches pattern', needsValue: true, valueType: 'text' },
    ],
  },
  {
    category: 'Type validation',
    options: [
      { value: 'is_email', label: 'Is email', needsValue: false },
      { value: 'is_url', label: 'Is URL', needsValue: false },
      { value: 'is_number', label: 'Is number', needsValue: false },
      { value: 'is_integer', label: 'Is integer', needsValue: false },
      { value: 'is_float', label: 'Is float', needsValue: false },
      { value: 'is_alpha', label: 'Is alpha', needsValue: false },
      { value: 'is_alphanumeric', label: 'Is alphanumeric', needsValue: false },
    ],
  },
  {
    category: 'Empty check',
    options: [
      { value: 'is_empty', label: 'Is empty', needsValue: false },
      { value: 'is_not_empty', label: 'Is not empty', needsValue: false },
    ],
  },
]

export const VALIDATION_CONDITIONS = VALIDATION_CONDITION_GROUPS.flatMap((g) => g.options)

export function makeValidationRule() {
  return { id: crypto.randomUUID(), condition: '', value: '', message: '' }
}

export const AUTOCOMPLETE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'on', label: 'On' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'organization', label: 'Organization' },
  { value: 'street-address', label: 'Street address' },
  { value: 'postal-code', label: 'Postal code' },
  { value: 'country', label: 'Country' },
]

export const INPUT_MODE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Telephone' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'search', label: 'Search' },
  { value: 'url', label: 'URL' },
]

export const AUTOCAPITALIZE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sentences', label: 'Sentences' },
  { value: 'words', label: 'Words' },
  { value: 'characters', label: 'Characters' },
]

// Sub-fields available on a "name" field — which ones are enabled, which of
// those are required, and each one's own default value. Kept in sync by hand
// with backend-api's form.model.js NAME_SUBFIELD_KEYS.
export const NAME_SUBFIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'firstName', label: 'First name' },
  { key: 'middleName', label: 'Middle name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'suffix', label: 'Suffix' },
]

export function makeDefaultNameOptions() {
  return {
    title: { enabled: false, required: false, defaultValue: '' },
    firstName: { enabled: true, required: false, defaultValue: '' },
    middleName: { enabled: false, required: false, defaultValue: '' },
    lastName: { enabled: true, required: false, defaultValue: '' },
    suffix: { enabled: false, required: false, defaultValue: '' },
  }
}

export function makeDefaultFileOptions() {
  return {
    maxFileSizeMB: 10,
    allowedFileTypes: '',
    expiryDays: null,
    allowMultiple: false,
  }
}

export function makeField(overrides = {}) {
  return {
    key: crypto.randomUUID(),
    label: '',
    // A merchant-facing machine name, set once at creation (Add-field
    // popup) — surfaced as a reference in Display logic / future
    // Workflows/API, not used internally in place of the field's real _id.
    fieldKey: '',
    type: 'text',
    description: '',
    placeholder: '',
    defaultValue: '',
    required: false,
    readOnly: false,
    repeatable: false,
    autocomplete: '',
    inputMode: '',
    autocapitalize: 'none',
    spellcheck: true,
    minLength: null,
    maxLength: null,
    // One or more condition + optional-error-message rules, evaluated
    // in order on submit (and live in the storefront embed).
    validationRules: [],
    options: [],
    condition: { fieldId: null, operator: 'equals', value: '' },
    newPage: false,
    // Only meaningful for type "name" — which sub-fields show, whether
    // each is required, and its default value; plus the row/column layout.
    nameOptions: makeDefaultNameOptions(),
    nameLayout: 'row',
    // Only meaningful for type "phone" — an international dial-code
    // dropdown shown alongside the number input, optionally pre-selected.
    showCountryCode: true,
    defaultCountry: '',
    // Only meaningful for type "file" — max upload size, allowed MIME/
    // extension list, retention window, and whether multiple files can be
    // attached.
    fileOptions: makeDefaultFileOptions(),
    ...overrides,
  }
}

// Border-radius presets for the storefront embed's inputs/buttons.
export const BORDER_RADIUS_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 4, label: 'Small' },
  { value: 8, label: 'Medium (default)' },
  { value: 12, label: 'Large' },
  { value: 20, label: 'Extra large' },
]

// A small, safe font list (all web-safe — no external font loading on the
// storefront) rather than free text, so a merchant can't break the embed's
// CSS by typing something unexpected into a font-family value.
export const FONT_FAMILY_OPTIONS = [
  { value: '', label: 'Inherit from theme' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
]

export function makeDefaultBranding() {
  return { primaryColor: '#111827', borderRadius: 8, fontFamily: '' }
}

const DEFAULT_SETTINGS = {
  publicTitle: '',
  description: '',
  submitButtonText: 'Submit',
  successMessage: 'Thanks! Your submission has been received.',
  language: 'en',
  enableApprovalWorkflow: false,
  trackReadStatus: true,
  // Whether the merchant wants the (not-yet-built) "New submission
  // notifications" workflow to notify them for this form — stored here so
  // the preference survives until that workflow exists to read it.
  notifyOnSubmission: true,
  // Storefront embed styling — button/focus color, corner rounding, and font.
  branding: makeDefaultBranding(),
}

export function makeSettings(overrides = {}) {
  return { ...DEFAULT_SETTINGS, ...overrides }
}

export const FORM_TEMPLATES = [
  {
    id: 'blank',
    name: 'Start with a blank form',
    description: 'Build a form from scratch.',
    getName: () => 'Untitled form',
    getFields: () => [],
    getSettings: () => makeSettings(),
  },
  {
    id: 'wholesale-registration',
    name: 'Wholesale Registration Form',
    description:
      'Allow prospective customers to apply for a wholesale account, with an approve/reject workflow and email notifications.',
    getName: () => 'Wholesale Registration Form',
    getFields: () => [
      makeField({ label: 'Name', type: 'name', required: true }),
      makeField({ label: 'Company Name', type: 'text' }),
      makeField({ label: 'Email', type: 'email', required: true }),
      makeField({ label: 'Country', type: 'country', required: true }),
      makeField({ label: 'Address', type: 'address' }),
      makeField({ label: 'Tax', type: 'tax' }),
    ],
    getSettings: () =>
      makeSettings({
        description: 'Are you a prospective customer? Please fill in the form below to apply for access.',
        enableApprovalWorkflow: true,
      }),
  },
  {
    id: 'contact-us',
    name: 'Contact Us Form',
    description: 'A simple contact form that notifies you of new submissions.',
    getName: () => 'Contact Us Form',
    getFields: () => [
      makeField({ label: 'Name', type: 'name', required: true }),
      makeField({ label: 'Email', type: 'email', required: true }),
      makeField({ label: 'Message', type: 'textarea', required: true }),
    ],
    getSettings: () =>
      makeSettings({
        description: "We'd love to hear from you. Fill in the form below and we'll get back to you shortly.",
      }),
  },
]

export function getTemplate(id) {
  return FORM_TEMPLATES.find((t) => t.id === id) || FORM_TEMPLATES[0]
}
