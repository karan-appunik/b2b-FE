export const INTERNAL_FIELD_TYPES = [
  { value: 'toggle', label: 'Toggle' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'longtext', label: 'Long text' },
  { value: 'group', label: 'Field Group' },
  { value: 'button', label: 'Workflow Trigger Button' },
]

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected']

export function makeInternalField(overrides = {}) {
  return {
    key: crypto.randomUUID(),
    label: '',
    type: 'toggle',
    options: [],
    visibleWhenReviewStatus: [],
    fields: undefined,
    ...overrides,
  }
}
